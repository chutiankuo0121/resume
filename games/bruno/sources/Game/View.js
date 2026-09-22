import * as THREE from 'three/webgpu'

import { Game } from './Game.js'
import { clamp, lerp, remap, smoothstep } from './utilities/maths.js'
import { mix, uniform, vec4, Fn, positionGeometry, attribute } from 'three/tsl'
import { Pointer } from './Inputs/Pointer.js'

import { alea } from 'seedrandom'

const rng = new alea('speedLines')

export class View
{

    constructor(idealRatio = 1920 / 1080)
    {
        this.game = Game.getInstance()

        this.position = new THREE.Vector3()
        this.delta = new THREE.Vector3()
        this.idealRatio = idealRatio
        this.ratioOverflow = Math.max(1, this.idealRatio / this.game.viewport.ratio) - 1

        this.setFocusPoint()
        this.setZoom()
        this.setSpherical()
        this.setRoll()
        this.setCameras()
        this.setOptimalArea()

        this.setSpeedLines()
        this.setMapControls()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 7)

        this.update()

        this.game.viewport.events.on('change', () =>
        {
            this.resize()
        })

        this.game.viewport.events.on('throttleChange', () =>
        {
            this.throttleResize()
        }, 1)

    }

    setFocusPoint()
    {
        const defaultRespawn = this.game.respawns.getDefault()

        this.focusPoint = {}
        this.focusPoint.trackedPosition = new THREE.Vector3(defaultRespawn.position.x, 0, defaultRespawn.position.z)
        this.focusPoint.isTracking = true
        this.focusPoint.position = this.focusPoint.trackedPosition.clone()
        this.focusPoint.smoothedPosition = this.focusPoint.trackedPosition.clone()
        this.focusPoint.isEased = true
        this.focusPoint.easing = 1
        this.focusPoint.magnet = {}
        this.focusPoint.magnet.active = true
        this.focusPoint.magnet.multiplier = 0.25

        const focusActionsNames = [
            'forward',
            'right',
            'backward',
            'left',
            'boost',
            'brake',
            'respawn',
            'suspensions',
            'suspensionsFront',
            'suspensionsBack',
            'suspensionsRight',
            'suspensionsLeft',
            'suspensionsFrontLeft',
            'suspensionsFrontRight',
            'suspensionsBackRight',
            'suspensionsBackLeft',
            'interact'
        ]
        this.game.inputs.events.on('actionStart', (action) =>
        {
            if(focusActionsNames.indexOf(action.name) !== -1)
                this.focusPoint.isTracking = true
        })

    }

    setOptimalArea()
    {
        this.optimalArea = {}
        this.optimalArea.needsUpdate = true
        this.optimalArea.position = new THREE.Vector3()
        this.optimalArea.basePosition = new THREE.Vector3()
        this.optimalArea.nearPosition = new THREE.Vector3()
        this.optimalArea.farPosition = new THREE.Vector3()
        this.optimalArea.nearDistance = null
        this.optimalArea.farDistance = null
        this.optimalArea.radius = 0
        this.optimalArea.raycaster = new THREE.Raycaster()
        this.optimalArea.quad2 = [
            { base: new THREE.Vector2(), offseted: new THREE.Vector2() },
            { base: new THREE.Vector2(), offseted: new THREE.Vector2() },
            { base: new THREE.Vector2(), offseted: new THREE.Vector2() },
            { base: new THREE.Vector2(), offseted: new THREE.Vector2() },
        ]

        this.optimalArea.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

        this.optimalArea.update = () =>
        {
            // Save state
            const savedPosition = this.defaultCamera.position.clone()
            const savedQuaternion = this.defaultCamera.quaternion.clone()

            // Reset with max radius
            let radiusMax = (this.spherical.radius.edges.max + this.ratioOverflow * this.spherical.radius.nonIdealRatioOffset)

            if(this.game.quality.level === 0)
                radiusMax *= 1 - this.zoom.speedAmplitude

            const offset = new THREE.Vector3()
            offset.setFromSphericalCoords(radiusMax, this.spherical.phi, this.spherical.theta)

            this.defaultCamera.position.set(0, 0, 0).add(offset)
            this.defaultCamera.lookAt(new THREE.Vector3())
            this.defaultCamera.updateProjectionMatrix()
            this.defaultCamera.updateWorldMatrix()

            // First near/far diagonal
            this.optimalArea.raycaster.setFromCamera(new THREE.Vector2(1, -1), this.defaultCamera)
            this.optimalArea.raycaster.ray.intersectPlane(this.optimalArea.floorPlane, this.optimalArea.nearPosition)
            this.optimalArea.quad2[0].base.x = this.optimalArea.nearPosition.x
            this.optimalArea.quad2[0].base.y = this.optimalArea.nearPosition.z

            this.optimalArea.raycaster.setFromCamera(new THREE.Vector2(-1, 1), this.defaultCamera)
            this.optimalArea.raycaster.ray.intersectPlane(this.optimalArea.floorPlane, this.optimalArea.farPosition)
            this.optimalArea.quad2[2].base.x = this.optimalArea.farPosition.x
            this.optimalArea.quad2[2].base.y = this.optimalArea.farPosition.z

            const centerA = this.optimalArea.nearPosition.clone().lerp(this.optimalArea.farPosition, 0.5)

            // Second near/far diagonal
            this.optimalArea.raycaster.setFromCamera(new THREE.Vector2(-1, -1), this.defaultCamera)
            this.optimalArea.raycaster.ray.intersectPlane(this.optimalArea.floorPlane, this.optimalArea.nearPosition)
            this.optimalArea.quad2[3].base.x = this.optimalArea.nearPosition.x
            this.optimalArea.quad2[3].base.y = this.optimalArea.nearPosition.z

            this.optimalArea.raycaster.setFromCamera(new THREE.Vector2(1, 1), this.defaultCamera)
            this.optimalArea.raycaster.ray.intersectPlane(this.optimalArea.floorPlane, this.optimalArea.farPosition)
            this.optimalArea.quad2[1].base.x = this.optimalArea.farPosition.x
            this.optimalArea.quad2[1].base.y = this.optimalArea.farPosition.z

            const centerB = this.optimalArea.nearPosition.clone().lerp(this.optimalArea.farPosition, 0.5)

            // Center between the two diagonal centers
            this.optimalArea.basePosition = centerA.clone().lerp(centerB, 0.5)

            // Radius
            this.optimalArea.radius = this.optimalArea.basePosition.distanceTo(this.optimalArea.farPosition)

            // Distances
            this.optimalArea.raycaster.setFromCamera(new THREE.Vector2(0, -1), this.defaultCamera)
            this.optimalArea.raycaster.ray.intersectPlane(this.optimalArea.floorPlane, this.optimalArea.nearPosition)

            this.optimalArea.raycaster.setFromCamera(new THREE.Vector2(0, 1), this.defaultCamera)
            this.optimalArea.raycaster.ray.intersectPlane(this.optimalArea.floorPlane, this.optimalArea.farPosition)

            this.optimalArea.nearDistance = this.defaultCamera.position.distanceTo(this.optimalArea.nearPosition)
            this.optimalArea.farDistance = this.defaultCamera.position.distanceTo(this.optimalArea.farPosition)

            // Put back state
            this.defaultCamera.position.copy(savedPosition)
            this.defaultCamera.quaternion.copy(savedQuaternion)

            // Save
            this.optimalArea.needsUpdate = false
        }
    }

    setZoom()
    {
        this.zoom = {}
        this.zoom.baseRatio = 0.6
        this.zoom.ratio = this.zoom.baseRatio
        this.zoom.smoothedRatio = this.zoom.baseRatio
        this.zoom.speedAmplitude = - 0.4
        this.zoom.speedEdge = { min: 5, max: 40 }
        this.zoom.sensitivity = 0.05
        this.zoom.toggle = 0
        this.zoom.toggleLast = -1

        this.game.inputs.addActions([
            { name: 'zoom',    categories: [ 'wandering', 'racing' ], keys: [ 'Wheel.roll' ] },
            { name: 'zoomToggle',  categories: [ 'wandering', 'racing' ], keys: [ 'Gamepad.r3' ] },
        ])

        this.game.inputs.events.on('zoom', (action) =>
        {
            this.zoom.baseRatio -= action.value * this.zoom.sensitivity
            this.zoom.baseRatio = clamp(this.zoom.baseRatio, 0, 1)
        })

        this.game.inputs.events.on('zoomToggle', (action) =>
        {
            if(action.active)
            {
                this.zoom.toggle -= this.zoom.toggleLast
                this.zoom.toggleLast = this.zoom.toggle
            }
            else
            {
                this.zoom.toggle = 0
            }
        })

    }

    setSpherical()
    {
        this.spherical = {}
        this.spherical.phi = Math.PI * (this.game.quality.level === 0 ? 0.31 : 0.27)
        this.spherical.theta = Math.PI * 0.25

        this.spherical.radius = {}
        this.spherical.radius.edges = { min: 15, max: 30 }
        this.spherical.radius.current = lerp(this.spherical.radius.edges.min, this.spherical.radius.edges.max, 1 - this.zoom.smoothedRatio)
        this.spherical.radius.nonIdealRatioOffset = 9

        this.spherical.offset = new THREE.Vector3()
        this.spherical.offset.setFromSphericalCoords(this.spherical.radius.current, this.spherical.phi, this.spherical.theta)

    }

    setRoll()
    {
        this.roll = {}
        this.roll.value = 0
        this.roll.velocity = 0
        this.roll.speed = 0
        this.roll.damping = 4
        this.roll.pullStrength = 100
        this.roll.kickStrength = 1

        this.roll.kick = (strength = 1) =>
        {
            this.roll.speed = strength * this.roll.kickStrength * (Math.random() < 0.5 ? - 1 : 1)
        }

    }

    setCameras()
    {
        this.camera = new THREE.PerspectiveCamera(25, this.game.viewport.ratio, 0.1, 200)
        this.camera.position.setFromSphericalCoords(this.spherical.radius.current, this.spherical.phi, this.spherical.theta)

        this.defaultCamera = this.camera.clone()

        this.game.scene.add(this.camera, this.defaultCamera)

    }

    setSpeedLines()
    {
        this.speedLines = {}
        this.speedLines.strength = 0
        this.speedLines.smoothedStrength = uniform(this.speedLines.strength)
        this.speedLines.worldTarget = new THREE.Vector3()
        this.speedLines.clipSpaceTarget = uniform(new THREE.Vector3())
        this.speedLines.speed = uniform(12)

        const linesCount = 30
        const positionArray = new Float32Array(linesCount * 3 * 3)
        const timeRandomnessArray = new Float32Array(linesCount * 3)
        const distanceArray = new Float32Array(linesCount * 3)
        const tipnessArray = new Float32Array(linesCount * 3)
        const maxDistance = Math.hypot(1, 1)

        for(let i = 0; i < linesCount; i++)
        {
            const i9 = i * 9
            const i3 = i * 3

            // Base vertex
            const vertexMiddle = new THREE.Vector2(0, 1)
            const angle = Math.PI * 2 * rng()
            vertexMiddle.rotateAround(new THREE.Vector2(), angle)

            // Side vertices
            const thickness = rng() * 0.01 + 0.002
            const vertexLeft = vertexMiddle.clone().rotateAround(new THREE.Vector2(), thickness)
            const vertexRight = vertexMiddle.clone().rotateAround(new THREE.Vector2(), - thickness)

            // Distance to center
            vertexMiddle.multiplyScalar(maxDistance)
            vertexLeft.multiplyScalar(maxDistance)
            vertexRight.multiplyScalar(maxDistance)

            // Position
            positionArray[i9 + 0] = vertexLeft.x
            positionArray[i9 + 1] = vertexLeft.y
            positionArray[i9 + 2] = 0

            positionArray[i9 + 3] = vertexMiddle.x
            positionArray[i9 + 4] = vertexMiddle.y
            positionArray[i9 + 5] = 0

            positionArray[i9 + 6] = vertexRight.x
            positionArray[i9 + 7] = vertexRight.y
            positionArray[i9 + 8] = 0

            // Time randomness
            timeRandomnessArray[i3 + 0] = i
            timeRandomnessArray[i3 + 1] = i
            timeRandomnessArray[i3 + 2] = i

            // Distance
            const distance = rng() * 0.4 + 0.4
            distanceArray[i3 + 0] = distance
            distanceArray[i3 + 1] = distance
            distanceArray[i3 + 2] = distance

            // Tipness
            tipnessArray[i3 + 0] = 0
            tipnessArray[i3 + 1] = 1
            tipnessArray[i3 + 2] = 0
        }

        this.speedLines.geometry = new THREE.BufferGeometry()
        this.speedLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionArray, 3))
        this.speedLines.geometry.setAttribute('timeRandomness', new THREE.Float32BufferAttribute(timeRandomnessArray, 1))
        this.speedLines.geometry.setAttribute('distance', new THREE.Float32BufferAttribute(distanceArray, 1))
        this.speedLines.geometry.setAttribute('tipness', new THREE.Float32BufferAttribute(tipnessArray, 1))

        this.speedLines.material = new THREE.MeshBasicNodeMaterial({ wireframe: false, depthWrite: false, depthTest: false })
        this.speedLines.material.vertexNode = Fn(() =>
        {
            const timeRandomness = attribute('timeRandomness')
            const distance = attribute('distance')
            const tipness = attribute('tipness')

            const osciliation = this.game.ticker.elapsedScaledUniform.mul(this.speedLines.speed).add(timeRandomness).sin().div(2).add(0.5)
            const newPosition = mix(positionGeometry.xy, this.speedLines.clipSpaceTarget.xy, tipness.mul(osciliation).mul(distance).mul(this.speedLines.smoothedStrength))

            return vec4(newPosition, 0, 1)
        })()
        this.speedLines.material.outputNode = vec4(1)

        this.speedLines.mesh = new THREE.Mesh(this.speedLines.geometry, this.speedLines.material)
        this.speedLines.mesh.frustumCulled = false
        this.speedLines.mesh.renderOrder = 10
        this.game.scene.add(this.speedLines.mesh)
    }

    resize()
    {
        this.ratioOverflow = Math.max(1, this.idealRatio / this.game.viewport.ratio) - 1

        this.camera.aspect = this.game.viewport.width / this.game.viewport.height
        this.camera.updateProjectionMatrix()

        this.defaultCamera.aspect = this.game.viewport.width / this.game.viewport.height
        this.defaultCamera.updateProjectionMatrix()

    }

    throttleResize()
    {
        this.optimalArea.update()
    }

    setMapControls()
    {
        this.game.inputs.addActions([
            { name: 'viewMapPointer', categories: [ 'intro', 'wandering' ], keys: [ 'Pointer.any' ] },
        ])

        this.game.inputs.events.on('viewMapPointer', (action) =>
        {

            // Focus point
            if(action.active)
            {
                // Map
                if(this.game.inputs.pointer.mode === Pointer.MODE_MOUSE || this.game.inputs.pointer.touches.length >= 2)
                {
                    this.focusPoint.isTracking = false

                    const mapMovement = new THREE.Vector2(this.game.inputs.pointer.delta.x, this.game.inputs.pointer.delta.y)
                    mapMovement.rotateAround(new THREE.Vector2(), -this.spherical.theta)

                    const smallestSide = Math.min(this.game.viewport.width, this.game.viewport.height)
                    mapMovement.multiplyScalar(10 / smallestSide)

                    this.focusPoint.position.x -= mapMovement.x * 2
                    this.focusPoint.position.z -= mapMovement.y * 2
                }

                // Pinch
                this.zoom.baseRatio += this.game.inputs.pointer.pinch.distanceDelta * 0.005
                this.zoom.baseRatio = clamp(this.zoom.baseRatio, 0, 1)
            }

        })
    }

    update()
    {
        // Gamepad Joystick map controls
        if(this.game.inputs.gamepad.joysticks.right.active)
        {
            this.focusPoint.isTracking = false

            const mapMovement = new THREE.Vector2(this.game.inputs.gamepad.joysticks.right.x, this.game.inputs.gamepad.joysticks.right.y)
            mapMovement.rotateAround(new THREE.Vector2(), -this.spherical.theta)
            mapMovement.multiplyScalar(20 * this.game.ticker.delta)

            this.focusPoint.position.x += mapMovement.x
            this.focusPoint.position.z += mapMovement.y
        }

        // Focus point
        if(this.focusPoint.isTracking)
        {
            this.focusPoint.position.x = this.focusPoint.trackedPosition.x
            this.focusPoint.position.z = this.focusPoint.trackedPosition.z
        }

        if(this.focusPoint.magnet.active)
        {
            const magnetDelta = { x: this.focusPoint.trackedPosition.x - this.focusPoint.position.x, z: this.focusPoint.trackedPosition.z - this.focusPoint.position.z }
            const distanceToMagnet = Math.hypot(magnetDelta.x, magnetDelta.z)
            const magnetStrength = distanceToMagnet * this.focusPoint.magnet.multiplier
            this.focusPoint.position.x += magnetStrength * magnetDelta.x * this.game.ticker.delta
            this.focusPoint.position.z += magnetStrength * magnetDelta.z * this.game.ticker.delta

        }

        const easing = remap(this.focusPoint.easing, 0, 1, 1, this.game.ticker.delta * 10)

        const newSmoothFocusPoint = this.focusPoint.smoothedPosition.clone().lerp(this.focusPoint.position, easing)

        const smoothFocusPointDelta = newSmoothFocusPoint.clone().sub(this.focusPoint.smoothedPosition)
        const focusPointSpeed = Math.hypot(smoothFocusPointDelta.x, smoothFocusPointDelta.z) / this.game.ticker.delta
        this.focusPoint.smoothedPosition.copy(newSmoothFocusPoint)

        // 驾驶跟随镜头：速度只影响缩放，保留拖动地图和弹性倾斜。
        // Zoom
        if(this.zoom.toggle !== 0)
        {
            this.zoom.baseRatio += this.zoom.toggle * 0.01
            this.zoom.baseRatio = clamp(this.zoom.baseRatio, 0, 1)
        }

        const zoomSpeedRatio = smoothstep(focusPointSpeed, this.zoom.speedEdge.min, this.zoom.speedEdge.max)
        this.zoom.ratio = this.zoom.baseRatio

        if(this.focusPoint.isTracking && this.game.quality.level === 0)
            this.zoom.ratio += this.zoom.speedAmplitude * zoomSpeedRatio

        this.zoom.smoothedRatio = lerp(this.zoom.smoothedRatio, this.zoom.ratio, this.game.ticker.delta * 10)

        // Radius
        const radiusMax = this.spherical.radius.edges.max + this.ratioOverflow * this.spherical.radius.nonIdealRatioOffset
        this.spherical.radius.current = lerp(this.spherical.radius.edges.min, radiusMax, 1 - this.zoom.smoothedRatio)
        this.spherical.offset.setFromSphericalCoords(this.spherical.radius.current, this.spherical.phi, this.spherical.theta)

        // Position
        this.position.copy(this.focusPoint.smoothedPosition).add(this.spherical.offset)

        // Default camera position
        this.delta = this.position.clone().sub(this.defaultCamera.position)
        this.defaultCamera.position.copy(this.position)

        // Default camera look at and roll
        this.defaultCamera.rotation.set(0, 0, 0)
        this.defaultCamera.lookAt(this.focusPoint.smoothedPosition)

        this.roll.velocity = - this.roll.value * this.roll.pullStrength * this.game.ticker.deltaScaled
        this.roll.speed += this.roll.velocity
        this.roll.value += this.roll.speed * this.game.ticker.deltaScaled
        this.roll.speed *= 1 - this.roll.damping * this.game.ticker.deltaScaled
        this.defaultCamera.rotation.z += this.roll.value

        // Apply to final camera

        this.camera.position.copy(this.defaultCamera.position)
        this.camera.quaternion.copy(this.defaultCamera.quaternion)

        // Cameras matrices
        this.camera.updateMatrixWorld()
        this.defaultCamera.updateMatrixWorld()

        // Optimal area
        if(this.optimalArea.needsUpdate)
            this.optimalArea.update()

        this.optimalArea.position
            .copy(this.optimalArea.basePosition)
            .add(new THREE.Vector3(this.focusPoint.smoothedPosition.x, 0, this.focusPoint.smoothedPosition.z))

        for(const point of this.optimalArea.quad2)
        {
            point.offseted.x = point.base.x + this.focusPoint.position.x
            point.offseted.y = point.base.y + this.focusPoint.position.z
        }

        // Speed lines
        this.speedLines.clipSpaceTarget.value.copy(this.speedLines.worldTarget)
        this.speedLines.clipSpaceTarget.value.project(this.camera)

        this.speedLines.smoothedStrength.value = lerp(this.speedLines.smoothedStrength.value, this.speedLines.strength, this.game.ticker.delta * 2)
    }
}
