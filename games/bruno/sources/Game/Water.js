import { uniform } from 'three/tsl'
import { Game } from './Game.js'

export class Water
{
    constructor()
    {
        this.game = Game.getInstance()

        this.surfaceElevation = -0.3
        this.depthElevation = -1.5

        this.surfaceElevationUniform = uniform(this.surfaceElevation)
        this.surfaceThicknessUniform = uniform(0.013)
    }
}
