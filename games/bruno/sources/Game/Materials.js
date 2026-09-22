import * as THREE from 'three/webgpu'
import { uv, float, Fn, uniform, color, mix, vec4, texture, luminance } from 'three/tsl'
import { Game } from './Game.js'
import { MeshDefaultMaterial } from './Materials/MeshDefaultMaterial.js'

export class Materials
{
    constructor()
    {
        this.game = Game.getInstance()
        this.list = new Map()

        this.setGradient()
        this.setLuminance()

        this.createPalette()

        this.createEmissiveGradient('emissiveOrangeRadialGradient', '#ff8641', '#ff3e00', 1.7, true)
        this.createEmissiveGradient('emissivePurpleRadialGradient', '#454bbc', '#ff2eb4', 1.7, true)
        this.createEmissiveGradient('emissiveBlueRadialGradient', '#91f0ff', '#128fff', 1.7, true)
        this.createEmissiveGradient('emissiveGreenRadialGradient', '#f8ffa6', '#74ff00', 1.5, true)
        this.createEmissiveGradient('emissiveWhiteRadialGradient', '#ffffff', '#666666', 2.7, false)

        this.createGradient('redGradient', '#ff3a3a', '#721551')
    }

    createPalette()
    {
        const material = new MeshDefaultMaterial({
            colorNode: texture(this.game.resources.paletteTexture).rgb
        })

        this.save('palette', material)

    }

    setGradient()
    {
        const height = 16

        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = height

        this.gradientTexture = new THREE.Texture(canvas)
        this.gradientTexture.colorSpace = THREE.SRGBColorSpace

        const context = canvas.getContext('2d')

        const colors = [
            { stop: 0, value: '#ffb646' },
            { stop: 0.5, value: '#ff347e' },
            { stop: 1, value: '#01005f' },
        ]

        const update = () =>
        {
            const gradient = context.createLinearGradient(0, 0, 0, height)
            for(const color of colors)
                gradient.addColorStop(color.stop, color.value)

            context.fillStyle = gradient
            context.fillRect(0, 0, 1, height)
            this.gradientTexture.needsUpdate = true
        }

        update()

    }

    setLuminance()
    {
        this.luminance = {}
        this.luminance.coefficients = new THREE.Vector3()
        THREE.ColorManagement.getLuminanceCoefficients(this.luminance.coefficients)

        this.luminance.get = (color) =>
        {
            return color.r * this.luminance.coefficients.x + color.g * this.luminance.coefficients.y + color.b * this.luminance.coefficients.z
        }
    }

    // Create materials functions
    createEmissive(_name = 'material', _color = '#ffffff', _intensity = 3)
    {
        const baseColor = uniform(color(_color))
        const intensity = uniform(_intensity)

        const material = new THREE.MeshBasicNodeMaterial({ transparent: true })
        material.colorNode = baseColor.div(luminance(baseColor)).mul(intensity)
        material.fog = false
        this.save(_name, material)

        return material
    }

    createEmissiveGradient(_name = 'material', _colorA = '#ffffff', _colorB = '#ff0000', _intensity = 3, normalize = true)
    {
        const colorA = uniform(color(_colorA))
        const colorB = uniform(color(_colorB))
        const intensity = uniform(_intensity)

        const material = new THREE.MeshBasicNodeMaterial({ transparent: true })
        let mixedColor = mix(colorA, colorB, uv().sub(0.5).length().mul(2))

        if(normalize)
            mixedColor = mixedColor.div(luminance(mixedColor))

        const outputNode = Fn(() =>
        {
            const outputColor = vec4(mixedColor.mul(intensity), 1)
            outputColor.assign(MeshDefaultMaterial.revealDiscardNodeBuilder(this.game, outputColor))

            return outputColor
        })

        material.outputNode = outputNode()
        material.fog = false
        this.save(_name, material)

        // update()

        return material
    }

    createGradient(_name = 'material', _colorA = 'red', _colorB = 'blue')
    {
        const colorA = uniform(new THREE.Color(_colorA))
        const colorB = uniform(new THREE.Color(_colorB))
        const baseColor = mix(colorA, colorB, uv().y)

        const material = new MeshDefaultMaterial({
            colorNode: baseColor
        })
        // material.shadowSide = THREE.BackSide

        this.save(_name, material)

        return material
    }

    save(name, material)
    {
        this.list.set(name, material)

    }

    getFromName(name, baseMaterial)
    {
        // Return existing material
        if(this.list.has(name))
            return this.list.get(name)

        // Create new
        const material = this.createFromMaterial(baseMaterial)

        // Save
        this.save(name, material)
        return material
    }

    createFromMaterial(baseMaterial)
    {
        if(baseMaterial.isMeshLambertNodeMaterial || baseMaterial.isMeshStandardMaterial)
        {
            // Shadow
            // material.shadowSide = THREE.BackSide

            // Color
            let baseColor = null

            if(baseMaterial.map)
                baseColor = texture(baseMaterial.map).rgb
            else
                baseColor = color(baseMaterial.color)

            // Alpha
            let alphaNode = null

            if(baseMaterial.alphaMap)
                alphaNode = texture(baseMaterial.alphaMap)
            else
                alphaNode = float(baseMaterial.opacity)

            // Transparent
            let transparent = baseMaterial.transparent

            // Material
            const material = new MeshDefaultMaterial({
                colorNode: baseColor,
                alphaNode: alphaNode,
                hasCoreShadows: true,
                hasDropShadows: true,
                transparent: transparent
            })
            material.map = baseMaterial.map

            return material
        }

        return baseMaterial

    }

    copy(baseMaterial, targetMaterial)
    {
        const properties = [ 'name', 'color', 'transparent' ]

        for(const property of properties)
        {
            if(typeof baseMaterial[property] !== 'undefined' && typeof targetMaterial[property] !== 'undefined')
                targetMaterial[property] = baseMaterial[property]
        }
    }

    updateObject(mesh)
    {
        mesh.traverse((child) =>
        {
            if(child.isMesh)
            {
                if(typeof child.material.userData.prevent === 'undefined' || !child.material.userData.prevent)
                    child.material = this.getFromName(child.material.name, child.material)
            }
        })
    }
}
