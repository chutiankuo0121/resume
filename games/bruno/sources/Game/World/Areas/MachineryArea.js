import * as THREE from 'three/webgpu'
import { color, Fn, luminance, mix, positionGeometry, sin, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import gsap from 'gsap'
import { SceneryArea } from './SceneryArea.js'

/** 机关小屋复用原有摆锤、齿轮与炉火，自动运转，不再展示项目画册。 */
export class MachineryArea extends SceneryArea {
    constructor(model) {
        super(model)

        this.setPendulum()
        this.setCandleFlames()
        this.setCauldron()
        this.gears = ['gearA', 'gearB', 'gearC'].map(name => {
            const mesh = this.references.items.get(name)[0]
            mesh.rotation.reorder('YXZ')
            return { mesh, angle: mesh.rotation.x }
        })
    }

    update() {
        // 大小齿轮反向咬合；按游戏时钟驱动，暂停时不会继续转动。
        if (!this.gears) return
        this.gears.forEach(({ mesh, angle }, i) => {
            mesh.rotation.x = angle + this.game.ticker.elapsedScaled * [0.3, -0.15, 0.075][i]
        })
    }

    setPendulum()
    {
        this.references.items.get('balls')[0].rotation.reorder('YXZ')
        const timeline0 = gsap.timeline({ yoyo: true, repeat: -1 })
        timeline0.to(this.references.items.get('balls')[0].rotation, { x: 0.75, ease: 'power2.out', delay: 0.75, duration: 0.75 })

        const timeline1 = gsap.timeline({ yoyo: true, repeat: -1, delay: 1.5 })
        timeline1.to(this.references.items.get('balls')[1].rotation, { x: -0.75, ease: 'power2.out', delay: 0.75, duration: 0.75 })
    }

    setCandleFlames()
    {
        const meshes = this.references.items.get('candleFlame')

        const baseMaterial = this.game.materials.getFromName('emissiveOrangeRadialGradient')
        const material = new THREE.MeshBasicNodeMaterial({ transparent: true })
        material.outputNode = baseMaterial.outputNode
        material.positionNode = Fn(() =>
        {
            const newPosition = positionGeometry.toVar()

            const wave = sin(this.game.ticker.elapsedScaledUniform.mul(0.3).add(uv().y.mul(3)))
            const strength = uv().y.oneMinus().pow(2).mul(0.06)
            newPosition.x.addAssign(wave.mul(strength))

            return newPosition
        })()

        for(const mesh of meshes)
        {
            mesh.scale.setScalar(0)
            mesh.visible = false

            mesh.material = material
        }

        this.game.dayCycles.events.on('night', (inInterval) =>
        {
            if(inInterval)
            {
                for(const mesh of meshes)
                {
                    mesh.visible = true
                    gsap.to(mesh.scale, { x: 1, y: 1, z: 1, duration: 10, ease: 'power1.out', overwrite: true })
                }
            }
            else
            {
                for(const mesh of meshes)
                {
                    gsap.to(mesh.scale, { x: 0, y: 0, z: 0, duration: 10, ease: 'power1.in', overwrite: true, onComplete: () =>
                    {
                        mesh.visible = false
                    } })
                }
            }
        })
    }

    setCauldron()
    {
        this.cauldron = {}

        // Heat
        {
            const material = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, transparent: true, depthTest: true, depthWrite: false })

            material.outputNode = Fn(() =>
            {
                const noiseUv = uv().mul(vec2(2, 0.2))
                noiseUv.y.addAssign(this.game.ticker.elapsedScaledUniform.mul(0.05))
                const noise = texture(this.game.noises.perlin, noiseUv).r

                const strength = noise.mul(uv().y.pow(2))

                const emissiveMix = strength.smoothstep(0, 1)
                const emissiveColor = mix(color('#ff3e00'), color('#ff8641'), emissiveMix).mul(strength.add(1).mul(2))

                return vec4(vec3(emissiveColor), strength)
            })()

            this.cauldron.heat = this.references.items.get('heat')[0]
            this.cauldron.heat.material = material
            this.cauldron.heat.castShadow = false
        }

        // Burning wood
        {
            const baseMaterial = this.game.materials.getFromName('palette')
            const material = baseMaterial.clone()

            const colorA = uniform(color('#ff6b2b'))
            const colorB = uniform(color('#ff4100'))
            const intensity = uniform(1.25)

            const baseOutput = baseMaterial.outputNode
            material.outputNode = Fn(() =>
            {
                const baseUv = uv(1).toVar()

                const emissiveColor = mix(colorA, colorB, baseUv.sub(0.5).length().mul(2))
                const emissiveOutput = emissiveColor.div(luminance(emissiveColor)).mul(intensity)

                const mixStrength = baseUv.sub(0.5).length().mul(2).pow2()
                const output = mix(baseOutput.rgb, emissiveOutput, mixStrength)

                // return vec4(vec3(mixStrength), 1)
                return vec4(output.rgb, 1)
            })()

            this.cauldron.wood = this.references.items.get('wood')[0]
            this.cauldron.wood.material = material

        }

        // Liquid
        {
            this.cauldron.liquid = {}

            const colorA = uniform(color('#ff0083'))
            const colorB = uniform(color('#3018eb'))
            const intensity = uniform(1.7)

            const material = new THREE.MeshBasicNodeMaterial({ transparent: true })
            const mixedColor = mix(colorA, colorB, uv().sub(0.5).length().mul(2))
            material.colorNode = mixedColor.div(luminance(mixedColor)).mul(intensity)
            material.fog = false

            this.cauldron.liquid.surface = this.references.items.get('liquid')[0]
            this.cauldron.liquid.surface.material = material

        }
    }

}
