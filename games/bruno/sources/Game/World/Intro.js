import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { atan, Fn, PI, PI2, positionGeometry, texture, uniform, uv, vec3, vec4 } from 'three/tsl'
import gsap from 'gsap'
import { Inputs } from '../Inputs/Inputs.js'

export class Intro
{
    constructor()
    {
        this.game = Game.getInstance()

        const respawn = this.game.respawns.getDefault()
        this.center = respawn.position.clone()

        this.setCircle()
        this.setLabel()

        this.update = this.update.bind(this)
        this.game.ticker.events.on('tick', this.update, 8)
    }

    setLabel()
    {
        this.label = new THREE.Group()
        this.label.position.copy(this.center)
        this.label.rotation.reorder('YXZ')

        if(this.game.quality.level === 0)
        {
            this.label.position.x += 3.5
            this.label.position.z -= 1
            this.label.position.y = 3.3

            this.label.rotation.y = 0.4
        }
        else
        {
            this.label.position.x += 2.3
            this.label.position.z -= 1.8
            this.label.position.y = 3.3

            this.label.rotation.y = 0.4
            this.label.rotation.x = -0.4
        }

        this.label.scale.setScalar(0.01)
        this.game.scene.add(this.label)
    }

    setCircle()
    {
        this.circle = {}

        const radius = 3.5
        const thickness = 0.04
        this.circle.progress = 0
        this.circle.smoothedProgress = uniform(0)

        // Geometry
        const geometry = new THREE.RingGeometry(radius - thickness, radius, 128, 1)

        // Material
        const material = new THREE.MeshBasicNodeMaterial()
        material.outputNode = Fn(() =>
        {
            const angle = atan(positionGeometry.y, positionGeometry.x)
            const angleProgress = angle.div(PI2).add(0.5).oneMinus()

            this.circle.smoothedProgress.lessThan(angleProgress).discard()

            return vec4(this.game.reveal.color.mul(this.game.reveal.intensity), 1)
        })()

        // Mesh
        const mesh = new THREE.Mesh(geometry, material)

        mesh.position.copy(this.center)
        mesh.position.y = 0.001
        mesh.rotation.x = - Math.PI * 0.5
        mesh.rotation.z = Math.PI * 0.5

        this.game.scene.add(mesh)

        this.circle.mesh = mesh

        // Hide
        this.circle.hide = (callback = null) =>
        {
            const dummy = { scale: 1 }
            const speedMultiplier = 1
            gsap.to(
                dummy,
                {
                    scale: 0,
                    duration: 1.5 / speedMultiplier,
                    // ease: 'back.in(1.7)',
                    ease: 'power4.in',
                    overwrite: true,
                    onUpdate: () =>
                    {
                        mesh.scale.setScalar(dummy.scale)
                    },
                    onComplete: () =>
                    {
                        if(typeof callback === 'function')
                            callback()

                        mesh.removeFromParent()
                    }
                }
            )
        }
    }

    setText()
    {
        const canvas = document.createElement('canvas')
        canvas.width = 768
        canvas.height = 384
        const context = canvas.getContext('2d')
        const labelTexture = new THREE.CanvasTexture(canvas)
        const material = new THREE.MeshBasicNodeMaterial({ transparent: true })
        material.outputNode = Fn(() => {
            const alpha = texture(labelTexture, uv()).a
            alpha.lessThan(0.02).discard()
            return vec4(vec3(1), alpha)
        })()
        this.text = {}
        this.text.texture = labelTexture
        this.text.updateTexture = () => {
            context.clearRect(0, 0, 768, 384)
            context.textAlign = 'center'
            context.fillStyle = '#fff'
            context.font = '52px "Bruno Han"'
            context.fillText('驶入这个小世界', 384, 144)
            context.font = '32px "Bruno Han"'
            const hint = this.game.inputs.mode === Inputs.MODE_GAMEPAD ? '按确认键开始'
                : this.game.inputs.mode === Inputs.MODE_TOUCH ? '轻触屏幕开始' : '点击屏幕或按回车开始'
            context.fillText(hint, 384, 218)
            context.font = '25px "Bruno Han"'
            context.fillText('WASD 驾驶 · Shift 加速 · 空格跳跃', 384, 280)
            labelTexture.needsUpdate = true
        }
        this.text.updateTexture()
        this.game.inputs.gamepad.events.on('typeChange', this.text.updateTexture)
        this.game.inputs.events.on('modeChange', this.text.updateTexture)
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), material)
        this.label.add(mesh)
        this.text.mesh = mesh
    }

    setSoundButton()
    {
        this.soundButton = {}

        // Texture
        const texture = this.game.resources.soundTexture

        if(this.game.audio.mute.active)
            texture.offset.x = 0.5

        // Geometry
        const scale = 0.5
        const geometry = new THREE.PlaneGeometry(50 / 38 * scale, 1 * scale)

        // Material
        const intensity = uniform(1)
        const material = new THREE.MeshBasicNodeMaterial({
            alphaTest: 0.5,
            alphaMap: texture,
            transparent: true,
            outputNode: vec4(vec3(1).mul(intensity), 1)
        })

        // Mesh
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.x = 0.38
        mesh.position.y = - 1
        this.label.add(mesh)

        // Intersect
        const position = this.label.position.clone()
        position.x += 0.38
        position.y += - 1

        this.soundButton.intersect = this.game.rayCursor.addIntersect({
            active: true,
            shape: new THREE.Sphere(position, 0.5),
            onClick: () =>
            {
                this.game.audio.mute.toggle()
            },
            onEnter: () =>
            {
                gsap.to(intensity, { value: 1.5, duration: 0.3, overwrite: true })
            },
            onLeave: () =>
            {
                gsap.to(intensity, { value: 1, duration: 0.3, overwrite: true })
            }
        })

        this.game.audio.events.on('muteChange', (active) =>
        {
            texture.offset.x = active ? 0.5 : 0
        })

        this.soundButton.mesh = mesh
    }

    showLabel()
    {
        const dummy = { scale: 0 }
        const speedMultiplier = 1
        gsap.to(
            dummy,
            {
                scale: 1,
                duration: 2 / speedMultiplier,
                delay: 1 / speedMultiplier,
                ease: 'elastic.out(0.5)',
                overwrite: true,
                onUpdate: () =>
                {
                    this.label.scale.setScalar(dummy.scale)
                }
            }
        )
    }

    hideLabel()
    {
        const speedMultiplier = 1
        const dummy = { scale: 1 }
        gsap.to(
            dummy,
            {
                scale: 0,
                duration: 0.3 / speedMultiplier,
                ease: 'power2.in',
                overwrite: true,
                onUpdate: () =>
                {
                    this.label.scale.setScalar(dummy.scale)
                },
                onComplete: () =>
                {
                    this.text.mesh.removeFromParent()
                    this.soundButton.mesh.removeFromParent()
                    this.game.rayCursor.removeIntersect(this.soundButton.intersect)
                }
            }
        )
    }

    updateProgress(progress)
    {
        this.circle.progress = progress
    }

    update()
    {
        this.circle.smoothedProgress.value += (this.circle.progress - this.circle.smoothedProgress.value) * this.game.ticker.delta * 10
    }

    destroy()
    {
        this.label.removeFromParent()

        // Geometries
        this.circle.mesh.geometry.dispose()
        this.soundButton.mesh.geometry.dispose()
        this.text.mesh.geometry.dispose()

        // Materials
        this.circle.mesh.material.dispose()
        this.soundButton.mesh.material.dispose()
        this.text.mesh.material.dispose()

        // Textures
        this.game.resources.soundTexture.dispose()

        this.text.texture.dispose()

        // Events
        this.game.ticker.events.off('tick', this.update)
        this.game.inputs.gamepad.events.off('typeChange', this.text.updateTexture)
        this.game.inputs.events.off('modeChange', this.text.updateTexture)
    }
}
