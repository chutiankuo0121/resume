import { color, Fn, luminance, mix, texture, uniform, uv, vec4 } from 'three/tsl'
import { SceneryArea } from './SceneryArea.js'
import { MeshDefaultMaterial } from '../../Materials/MeshDefaultMaterial.js'

/** 工坊只保留炉火、砂轮与锤击；没有作品数据、外链或接管驾驶的镜头。 */
export class WorkshopArea extends SceneryArea {
    constructor(model) {
        super(model)
        this.setSounds()
        this.setOven()
        this.setGrinder()
        this.setAnvil()
    }

    setSounds()
    {
        this.sounds = {}
        this.sounds.anvil = this.game.audio.register({
            path: 'sounds/anvil/METLImpt_Anvil Single Hammer Strike Hammers_GENHD1-01372.mp3',
            autoplay: false,
            loop: false,
            volume: 0.5,
            antiSpam: 0.1,
            positions: this.references.items.get('anvil')[0].position,
            distanceFade: 18,
            onPlay: (item) =>
            {
                item.volume = 0.1 + Math.random() * 0.1
                item.rate = 1 + Math.random() * 0.02
            }
        })
    }

    setOven()
    {
        this.oven = {}

        // Blower
        this.oven.blower = this.references.items.get('blower')[0]

        // Charcoal
        this.oven.charcoal = this.references.items.get('charcoal')[0]

        this.oven.threshold = uniform(0.2)

        const alphaNode = Fn(() =>
        {
            const baseUv = uv()

            const voronoi = texture(
                this.game.noises.voronoi,
                baseUv
            ).g

            voronoi.subAssign(this.oven.threshold)

            return voronoi
        })()

        const material = new MeshDefaultMaterial({
            colorNode: color(0x6F6A87),
            alphaNode: alphaNode,
            hasWater: false,
            hasLightBounce: false
        })

        this.oven.charcoal.material = material

    }

    setGrinder()
    {
        this.grinder = this.references.items.get('grinder')[0]
    }

    setAnvil()
    {
        this.anvil = {}
        this.anvil.frequency = 1
        this.anvil.loopTime = 0

        // Hammer
        this.anvil.hammer = this.references.items.get('hammer')[0]
        this.anvil.hammer.rotation.reorder('ZXY')

        // Blade
        this.anvil.blade = this.references.items.get('blade')[0]

        const material = new MeshDefaultMaterial({
            colorNode: color('#a88c7f')
        })

        const colorA = uniform(color('#ff8641'))
        const colorB = uniform(color('#ff3e00'))
        const intensity = uniform(1.7)

        const baseOutput = material.outputNode
        material.outputNode = Fn(() =>
        {
            const baseUv = uv(1).toVar()

            const emissiveColor = mix(colorA, colorB, uv().sub(0.5).length().mul(10))
            const emissiveOutput = emissiveColor.div(luminance(emissiveColor)).mul(intensity)

            const mixStrength = baseUv.y.smoothstep(0.4, 0.9)
            const output = mix(baseOutput.rgb, emissiveOutput, mixStrength)

            return vec4(output.rgb, 1)
        })()

        this.anvil.blade.material = material
    }

    update()
    {
        // Oven
        this.oven.blower.scale.y = (Math.sin(this.game.ticker.elapsedScaled) * 0.2 + 0.8)
        this.oven.threshold.value = -Math.sin(this.game.ticker.elapsedScaled - 0.5) * 0.1 + 0.25

        // Grinder
        this.grinder.rotation.z = - this.game.ticker.elapsedScaled * 0.75

        // Anvil
        const time = this.game.ticker.elapsedScaled * this.anvil.frequency + Math.PI * 0.25
        this.anvil.hammer.rotation.x = Math.pow(1 - Math.abs(Math.sin(time)), 5) - 1

        // Anvil sound
        const loopTime = ((time) / Math.PI) % 1
        if(loopTime < this.anvil.loopTime)
            this.sounds.anvil.play()

        this.anvil.loopTime = loopTime
    }
}
