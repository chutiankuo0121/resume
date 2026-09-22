import * as THREE from 'three/webgpu'
import { Game } from './Game.js'
import { uniform, color, float } from 'three/tsl'

export class Lighting
{
    constructor()
    {
        this.game = Game.getInstance()

        this.useDayCycles = true
        this.phi = 0.63
        this.theta = 0.72
        this.phiAmplitude = 0.62
        this.thetaAmplitude = 1.25
        this.near = 1
        this.spherical = new THREE.Spherical(this.game.view.optimalArea.radius + this.near, this.phi, this.theta)
        this.direction = new THREE.Vector3().setFromSpherical(this.spherical).normalize()
        this.directionUniform = uniform(this.direction)
        this.colorUniform = uniform(color('#ffffff'))
        this.intensityUniform = uniform(1)
        this.count = 1
        this.mapSize = this.game.quality.level === 0 ? 2048 : 512
        this.shadowAmplitude = this.game.view.optimalArea.radius
        this.depth = this.game.view.optimalArea.radius * 2
        this.shadowBias = -0.001
        this.shadowNormalBias = 0.1
        this.shadowRadius = this.game.quality.level === 0 ? 3 : 2

        this.setNodes()
        this.setLight()
        this.updateShadow()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 9)

        this.game.viewport.events.on('throttleChange', () =>
        {
            this.spherical.radius = this.game.view.optimalArea.radius
            this.shadowAmplitude = this.game.view.optimalArea.radius
            this.updateShadow()
        }, 3)
    }

    setNodes()
    {
        this.lightBounceEdgeLow = uniform(float(-1))
        this.lightBounceEdgeHigh = uniform(float(1))
        this.lightBounceDistance = uniform(float(1.5))
        this.lightBounceMultiplier = uniform(float(1))

        this.shadowColor = uniform(this.game.dayCycles.properties.shadowColor.value)
        this.bounceColor = uniform(color('#82487f'))
        this.coreShadowEdgeLow = uniform(float(-0.25))
        this.coreShadowEdgeHigh = uniform(float(1))
    }

    setLight()
    {
        this.light = new THREE.DirectionalLight(0xffffff, 5)
        this.light.position.setFromSpherical(this.spherical)
        this.light.castShadow = true

        this.game.scene.add(this.light)
        this.game.scene.add(this.light.target)
    }

    updateShadow()
    {
        this.light.shadow.camera.top = this.shadowAmplitude
        this.light.shadow.camera.right = this.shadowAmplitude
        this.light.shadow.camera.bottom = - this.shadowAmplitude
        this.light.shadow.camera.left = - this.shadowAmplitude
        this.light.shadow.camera.near = this.near
        this.light.shadow.camera.far = this.near + this.depth
        this.light.shadow.bias = this.shadowBias
        this.light.shadow.normalBias = this.shadowNormalBias
        this.light.shadow.radius = this.shadowRadius

        this.light.shadow.camera.updateProjectionMatrix()
        this.light.shadow.mapSize.set(this.mapSize, this.mapSize)

        this.game.quality.events.on('change', () =>
        {
            this.mapSize = this.game.quality.level === 0 ? 2048 : 512
            this.light.shadow.mapSize.set(this.mapSize, this.mapSize)
        })
    }

    updateCoordinates()
    {
        this.direction.setFromSpherical(this.spherical).normalize()
    }

    update()
    {
        // Spherical coordinates
        if(this.useDayCycles)
        {
            const progressOffset = 9/16
            this.spherical.theta = this.theta + Math.sin(- (this.game.dayCycles.progress + progressOffset) * Math.PI * 2) * this.thetaAmplitude
            this.spherical.phi = this.phi + (Math.cos(- (this.game.dayCycles.progress + progressOffset) * Math.PI * 2) * 0.5) * this.phiAmplitude
        }
        else
        {
            this.spherical.theta = this.theta
            this.spherical.phi = this.phi
        }

        // Direction (for shaders)
        this.direction.setFromSpherical(this.spherical).normalize()

        // Actual lights transform
        const optimalRoundedPosition = this.game.view.optimalArea.position.clone()
        // optimalRoundedPosition.x = Math.round(optimalRoundedPosition.x)
        // optimalRoundedPosition.y = Math.round(optimalRoundedPosition.y)
        // optimalRoundedPosition.z = Math.round(optimalRoundedPosition.z)

        this.light.position.setFromSpherical(this.spherical).add(optimalRoundedPosition)
        this.light.target.position.copy(optimalRoundedPosition)

        // Apply day cycles values
        this.colorUniform.value.copy(this.game.dayCycles.properties.lightColor.value)
        this.intensityUniform.value = this.game.dayCycles.properties.lightIntensity.value
    }
}
