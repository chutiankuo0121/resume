import { Game } from '../../Game.js'
import { AltarArea } from './AltarArea.js'
import { CookieArea } from './CookieArea.js'
import { LandingArea } from './LandingArea.js'
import { WorkshopArea } from './WorkshopArea.js'
import { MachineryArea } from './MachineryArea.js'
import { SceneryArea } from './SceneryArea.js'
import { ToiletArea } from './ToiletArea.js'
import { BowlingArea } from './BowlingArea.js'
import { CircuitArea } from './CircuitArea.js'
import { LightGardenArea } from './LightGardenArea.js'
import { AchievementsArea } from './AchievementsArea.js'
import { OldTelevisionArea } from './OldTelevisionArea.js'

export class Areas
{
    constructor()
    {
        this.game = Game.getInstance()

        const list = [
            [ 'achievements', AchievementsArea ],
            [ 'altar', AltarArea ],
            [ 'lightGarden', LightGardenArea ],
            [ 'bowling', BowlingArea ],
            [ 'grove', SceneryArea ],
            [ 'circuit', CircuitArea ],
            [ 'cookie', CookieArea ],
            [ 'machinery', MachineryArea ],
            [ 'landing', LandingArea ],
            [ 'workshop', WorkshopArea ],
            [ 'plaza', SceneryArea ],
            [ 'toilet', ToiletArea ],
            [ 'oldTelevision', OldTelevisionArea ],
        ]

        const model = [...this.game.resources.areasModel.scene.children]

        for(const child of model)
        {
            for(const [ name, AreaClass ] of list)
            {
                if(child.name.startsWith(name))
                    this[name] = new AreaClass(child)
            }
        }

    }
}
