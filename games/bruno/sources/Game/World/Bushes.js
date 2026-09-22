import { color, uniform } from 'three/tsl'
import { Foliage } from './Foliage.js'
import { Game } from '../Game.js'

export class Bushes
{
    constructor()
    {
        this.game = Game.getInstance()

        this.colorANode = uniform(color('#b4b536'))
        this.colorBNode = uniform(color('#d8cf3b'))
        this.foliage = new Foliage(this.game.resources.bushesReferences.scene.children, this.colorANode, this.colorBNode)
    }
}
