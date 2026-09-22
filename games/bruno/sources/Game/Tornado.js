import * as THREE from 'three/webgpu'

import { Game } from './Game.js'
import gsap from 'gsap'
import { remapClamp } from './utilities/maths.js'

export class Tornado
{
    constructor()
    {
        this.game = Game.getInstance()

        this.running = false
        this.strength = 0
        this.resolution = 100
        this.position = new THREE.Vector3()
        this.achievementAchieved = this.game.achievements.groups.get('cataclysm')?.items[0].achieved
        this.setPath()

        // Update
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 9)
    }

    setPath()
    {
        const points = []

        const children = [...this.game.resources.tornadoPathReferencesModel.scene.children]
        children.sort((a, b) =>
        {
            if ( a.name < b.name )
                return -1

            if ( a.name > b.name )
                return 1

            return 0
        })

        for(const child of children)
        {
            const point = new THREE.Vector3(
                child.position.x,
                0,
                child.position.z
            )

            points.push(point)
        }
        const curve = new THREE.CatmullRomCurve3(points, true)
        this.path = curve.getSpacedPoints(this.resolution)
    }

    start()
    {
        if(this.running)
            return

        // Move to position to prevent easing
        const progress = this.game.dayCycles.absoluteProgress * 2
        this.position.copy(this.getPosition(progress))

        // Strength
        gsap.to(this, { strength: 1, duration: 20, ease: 'linear', overwrite: true })

        // Weather
        this.game.weather.override.start(
            {
                humidity: 1,
                electricField: 0.5,
                clouds: 1,
                wind: 1
            },
            20
        )

        // Day cycles
        this.game.dayCycles.override.start(
            {
                lightColor: new THREE.Color('#ff4141'),
                lightIntensity: 1.2,
                shadowColor: new THREE.Color('#4e009c'),
                fogColorA: new THREE.Color('#3e53ff'),
                fogColorB: new THREE.Color('#ff4ce4'),
                fogNearRatio: 0,
                fogFarRatio: 1.25
            },
            20
        )

        // Save
        this.running = true
    }

    stop()
    {
        if(!this.running)
            return

        // Strength
        gsap.to(this, { strength: 0, duration: 20, ease: 'linear', overwrite: true })

        // Weather
        this.game.weather.override.end(20)

        // Day cycles
        this.game.dayCycles.override.end(20)

        // Save
        this.running = false
    }

    getPosition(progress)
    {
        const loopProgress = progress % 1
        const prevIndex = Math.floor(loopProgress * this.resolution)
        const nextIndex = (prevIndex + 1) % this.resolution
        const mix = loopProgress * this.resolution - prevIndex
        const prevPosition = this.path[prevIndex]
        const nextPosition = this.path[nextIndex]
        const position = new THREE.Vector3().lerpVectors(prevPosition, nextPosition, mix)

        return position
    }

    update()
    {
        if(this.strength === 0)
            return

        // Position on path
        const progress = this.game.dayCycles.absoluteProgress * 1
        const newPosition = this.getPosition(progress)

        this.position.lerp(newPosition, 0.3 * this.game.ticker.deltaScaled)

        // Previews

        // Physics vehicle
        const toTornado = this.position.clone().sub(this.game.physicalVehicle.position)
        const distance = toTornado.length()

        const strength = remapClamp(distance, 20, 2, 0, 1)
        if(!this.achievementAchieved && strength > 0.5)
        {
            this.achievementAchieved = true
            this.game.achievements.setProgress('cataclysm', 1)
        }

        const force = toTornado.clone().normalize()

        const sideAngleStrength = remapClamp(distance, 8, 2, 0, Math.PI * 0.25)
        force.applyAxisAngle(new THREE.Vector3(0, 1, 0), -sideAngleStrength)

        const flyForce = remapClamp(distance, 8, 2, 0, 1)
        force.y = flyForce * 2

        force.setLength(strength * this.game.ticker.deltaScaled * this.strength * 30)
        this.game.physicalVehicle.chassis.physical.body.applyImpulse(force)
    }
}
