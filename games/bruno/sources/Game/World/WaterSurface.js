import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { color, float, Fn, hash, max, positionWorld, screenUV, select, step, texture, uniform, vec3, vec4, viewportSharedTexture } from 'three/tsl'
import { lerp, remap, remapClamp } from '../utilities/maths.js'
import { hashBlur } from 'three/examples/jsm/tsl/display/hashBlur.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

export class WaterSurface
{
    constructor()
    {
        this.game = Game.getInstance()

        this.hasRipples = false
        this.hasIce = false
        this.hasSplashes = false
        this.setGeometry()
        this.setNodes()
        this.setMaterial()
        this.setMesh()
        this.setIce()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 10)
    }

    setGeometry()
    {
        this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)
        this.geometry.rotateX(- Math.PI * 0.5)
    }

    setNodes()
    {
        /**
         * Ripples
         */
        this.ripplesRatio = uniform(1)
        const ripplesSlopeFrequency = uniform(10)
        const ripplesNoiseFrequency = uniform(0.1)
        const ripplesNoiseOffset = uniform(0.345)

        this.updateRipplesRatio = () =>
        {
            this.ripplesRatio.value = remapClamp(this.game.weather.temperature.value, 0, -3, 1, 0)
        }

        const ripplesNode = Fn(([terrainData]) =>
        {
            const baseRipple = terrainData.b.add(this.game.wind.localTime.mul(0.5)).mul(ripplesSlopeFrequency)
            const rippleIndex = baseRipple.floor()

            const ripplesNoise = texture(
                this.game.noises.perlin,
                positionWorld.xz.add(rippleIndex.div(ripplesNoiseOffset)).mul(ripplesNoiseFrequency)
            ).r

            const ripples = terrainData.b
                .add(this.game.wind.localTime.mul(0.5))
                .mul(ripplesSlopeFrequency)
                .mod(1)
                .sub(terrainData.b.remap(0, 1, -0.3, 1).oneMinus())
                .add(ripplesNoise)

            ripples.assign(this.ripplesRatio.remap(0, 1, -1, -0.4).step(ripples))

            return ripples
        })
        /**
         * Ice
         */
        this.iceRatio = uniform(0)
        const iceNoiseFrequency = uniform(0.3)

        this.updateIceRatio = () =>
        {
            this.iceRatio.value = remapClamp(this.game.weather.temperature.value, 0, -5, 0, 1)
        }

        const iceNode = Fn(([terrainData]) =>
        {
            const iceVoronoi = texture(
                this.game.noises.voronoi,
                positionWorld.xz.mul(iceNoiseFrequency)
            ).g

            const ice = terrainData.b.remapClamp(0, this.iceRatio, 0, 1).toVar()
            ice.assign(iceVoronoi.step(ice))

            return ice
        })
        /**
         * Splashes
         */
        this.splashesRatio = uniform(0)
        const splashesNoiseFrequency = uniform(0.33)
        const splashesTimeFrequency = uniform(6)
        const splashesThickness = uniform(0.3)
        const splashesEdgeAttenuationLow = uniform(0.14)
        const splashesEdgeAttenuationHigh = uniform(1)

        this.updateSplashesRatio = () =>
        {
            this.splashesRatio.value = Math.pow(this.game.weather.rain.value, 2)
        }

        const splashesNode = Fn(() =>
        {
            // Noises
            const splashesVoronoi = texture(
                this.game.noises.voronoi,
                positionWorld.xz.mul(splashesNoiseFrequency)
            )
            const splashPerlin = texture(
                this.game.noises.perlin,
                positionWorld.xz.mul(splashesNoiseFrequency.mul(0.25))
            ).r

            // Base
            const splash = splashesVoronoi.r

            // Time
            const splashTimeRandom = hash(splashesVoronoi.b.mul(123456)).add(splashPerlin)
            const splashTime = this.game.wind.localTime.mul(splashesTimeFrequency).add(splashTimeRandom)
            splash.assign(splash.sub(splashTime).mod(1))

            // Thickness
            const edgeMutliplier = splashesVoronoi.g.remapClamp(splashesEdgeAttenuationLow, splashesEdgeAttenuationHigh, 0, 1)
            const thickness = splashesThickness.mul(edgeMutliplier)
            splash.assign(splash.step(thickness).oneMinus())

            // Visibility
            const splashVisibilityRandom = hash(splashesVoronoi.b.mul(654321))
            const visible = splashVisibilityRandom.add(splashPerlin).mod(1)
            visible.assign(this.splashesRatio.step(visible))
            splash.assign(splash.mul(visible))

            return splash
        })
        /**
         * Shore
         */
        const shoreEdge = uniform(0.17)

        const shoreNode = Fn(([terrainData]) =>
        {
            return shoreEdge.step(terrainData.b)
        })
        /**
         * Details mask
         */
        this.detailsMask = () =>
        {
            return Fn(() =>
            {
                const terrainData = this.game.terrain.terrainNode(positionWorld.xz)
                const value = float(0)

                // Ripples
                if(this.hasRipples)
                    value.assign(max(value, ripplesNode(terrainData)))

                // Ice
                if(this.hasIce)
                    value.assign(max(value, iceNode(terrainData)))

                // Splashes
                if(this.hasSplashes)
                    value.assign(max(value, splashesNode()))

                // Shore
                value.assign(max(value, shoreNode(terrainData)))

                return value
            })()
        }

        /**
         * Blur Output
         */
         const blurStrength = uniform(0.01)

         this.blurOutputNode = Fn(() =>
         {

            // Hash blur
            const blurOutput = hashBlur(viewportSharedTexture(screenUV), 0.01, {
                repeats: 25,
                premultipliedAlpha: true
            })

            return vec3(blurOutput)
         })
    }

    setMaterial()
    {
        const material = new MeshDefaultMaterial({
            depthWrite: false,
            colorNode: color(0xffffff),
            alphaNode: this.detailsMask(),
            alphaTest: 0,
            hasCoreShadows: false,
            hasDropShadows: true,
            hasLightBounce: false,
            hasFog: true,
            hasWater: false,
            transparent: true
        })

        const baseOutput = material.outputNode
        const blurredOutput = Fn(() =>
        {
            const blurOutput = this.blurOutputNode()
            const surfaceAlpha = baseOutput.a
            const surfaceOutput = vec4(baseOutput.rgb, 1)

            const finalOuput = select(
                surfaceAlpha.lessThan(0.5),
                blurOutput,
                surfaceOutput
            )

            return finalOuput
        })()

        // Quality
        const qualityChange = (level) =>
        {
            if(level === 0)
            {
                material.outputNode = blurredOutput
            }
            else if(level === 1)
            {
                material.outputNode = baseOutput
            }

            material.needsUpdate = true
        }
        qualityChange(this.game.quality.level)
        this.game.quality.events.on('change', qualityChange)

        //     return finalOuput
        // })()

        material.maskShadowNode = this.detailsMask().greaterThan(0.5)

        // Already exist
        if(this.material)
        {
            this.material.dispose()
            this.material = material
            this.mesh.material = this.material
        }

        // Don't exist yet
        else
        {
            this.material = material
        }
    }

    setMesh()
    {
        this.mesh = new THREE.Mesh(this.geometry, this.material)

        const halfExtent = this.game.view.optimalArea.radius
        this.mesh.scale.setScalar(halfExtent * 2)

        this.mesh.position.y = this.game.water.surfaceElevation
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        this.game.scene.children.unshift(this.mesh)

        this.game.viewport.events.on('throttleChange', () =>
        {
            const halfExtent = this.game.view.optimalArea.radius
            this.mesh.scale.setScalar(halfExtent * 2)
        }, 2)
    }

    setIce()
    {
        this.ice = {}

        this.ice.halfThickness = 0.5
        this.ice.physical = this.game.physics.getPhysical({
            type: 'kinematicPositionBased',
            position: new THREE.Vector3(0, this.game.water.surfaceElevation - this.ice.halfThickness, 0),
            frictionRule: 'min',
            friction: 0.02,
            enabled: false,
            colliders:
            [
                { shape: 'cuboid', parameters: [ 256, this.ice.halfThickness, 256 ] },
            ]
        })
    }

    update()
    {
        // Apply weather
        this.updateRipplesRatio()
        this.updateIceRatio()
        this.updateSplashesRatio()

        // Mesh
        this.mesh.position.x = this.game.view.optimalArea.position.x
        this.mesh.position.z = this.game.view.optimalArea.position.z
        this.mesh.renderOrder = 1

        // Material
        const hasRipples = this.ripplesRatio.value > 0.0001
        const hasIce = this.iceRatio.value > 0.0001
        const hasSplashes = this.splashesRatio.value > 0.0001

        if(
            hasRipples !== this.hasRipples ||
            hasIce !== this.hasIce ||
            hasSplashes !== this.hasSplashes
        )
        {
            this.hasRipples = hasRipples
            this.hasIce = hasIce
            this.hasSplashes = hasSplashes

            this.setMaterial()
        }

        // Ice
        const friction = lerp(0.5, 0.02, this.iceRatio.value)
        this.ice.physical.body.collider(0).setFriction(friction)
        this.ice.physical.body.setNextKinematicTranslation({ x: 0, y: lerp(- 1.5 - this.ice.halfThickness, this.game.water.surfaceElevation - this.ice.halfThickness, this.iceRatio.value), z: 0})

        if(this.iceRatio.value > 0)
        {
            if(!this.ice.physical.body.isEnabled())
            {
                this.game.objects.enable(this.ice)
            }
        }
        else
        {
            if(this.ice.physical.body.isEnabled())
            {
                this.game.objects.disable(this.ice)
            }
        }
    }
}
