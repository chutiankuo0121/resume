import * as THREE from 'three/webgpu'
import { Events } from './Events.js'
import { Game } from './Game.js'

export class Zones
{
    constructor()
    {
        this.game = Game.getInstance()

        this.items = []

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 8)

    }

    create(type = 'sphere', position, radius)
    {
        const zone = { type, position, radius, isIn: false }
        zone.events = new Events()
        this.items.push(zone)

        // Preview

        return zone
    }

    update()
    {
        for(const zone of this.items)
        {
            let playerPosition = this.game.player.position
            let zonePosition = zone.position

            if(zone.type === 'cylinder')
            {
                playerPosition = new THREE.Vector2(playerPosition.x, playerPosition.z)
                zonePosition = new THREE.Vector2(zonePosition.x, zonePosition.z)
            }
            const distance = playerPosition.distanceTo(zonePosition)

            if(distance < zone.radius)
            {
                if(!zone.isIn)
                {
                    zone.isIn = true
                    zone.events.trigger('enter', [ zone ])
                }
            }
            else
            {
                if(zone.isIn)
                {
                    zone.isIn = false
                    zone.events.trigger('leave', [ zone ])
                }
            }
        }
    }
}
