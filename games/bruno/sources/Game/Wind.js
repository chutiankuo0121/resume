import { vec2, Fn, texture, uniform } from 'three/tsl'
import { Game } from './Game.js'
import { remapClamp } from './utilities/maths.js'

export class Wind
{
    constructor()
    {
        this.game = Game.getInstance()

        this.angle = Math.PI * 0.6
        this.direction = uniform(vec2(
            Math.sin(this.angle),
            Math.cos(this.angle),
        ))
        this.positionFrequency = uniform(0.5)
        this.strength = uniform(0.5)
        this.localTime = uniform(0)
        this.timeFrequency = 0.1

        this.offsetNode = Fn(([position]) =>
        {
            const remapedPosition = position.mul(this.positionFrequency)

            const noiseUv1 = remapedPosition.xy.mul(0.2).add(this.direction.mul(this.localTime)).xy
            const noise1 = texture(this.game.noises.perlin, noiseUv1).r.sub(0.5)

            const noiseUv2 = remapedPosition.xy.mul(0.1).add(this.direction.mul(this.localTime.mul(0.2))).xy
            const noise2 = texture(this.game.noises.perlin, noiseUv2).r.sub(0.5)

            const intensity = noise2.add(noise1)

            return vec2(this.direction.mul(intensity).mul(this.strength))
        })

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 9)
        this.updateStrength = () =>
        {
            this.strength.value = remapClamp(this.game.weather.wind.value, 0, 1, 0.1, 1)
        }

    }

    update()
    {
        // Apply weather
        this.updateStrength()
        this.localTime.value += this.game.ticker.deltaScaled * this.timeFrequency * this.strength.value
    }
}
