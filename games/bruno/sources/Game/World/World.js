import { Game } from '../Game.js'
import { Floor } from './Floor.js'
import { Grid } from './Grid.js'
import { Grass } from './Grass.js'

import { WaterSurface } from './WaterSurface.js'
import { Areas } from './Areas/Areas.js'
import { WindLines } from './WindLines.js'
import { Leaves } from './Leaves.js'
import { Lightnings } from './Lightnings.js'
import { Snow } from './Snow.js'
import { VisualVehicle } from './VisualVehicle.js'
import { VisualTornado } from './VisualTornado.js'
import { Flowers } from './Flowers.js'
import { Bricks } from './Bricks.js'
import { Trees } from './Trees.js'
import { Bushes } from './Bushes.js'

import { Fireballs } from './Fireballs.js'
import { ExplosiveCrates } from './ExplosiveCrates.js'
import { RainLines } from './RainLines.js'
import { Confetti } from './Confetti.js'
import { Intro } from './Intro.js'
import { PoleLights } from './PoleLights.js'
import { Lanterns } from './Lanterns.js'
import { Fences } from './Fences.js'
import { Benches } from './Benches.js'
import { Scenery } from './Scenery.js'

export class World
{
    constructor()
    {
        this.game = Game.getInstance()

        this.step(0)

    }

    step(step)
    {
        if(step === 0)
        {
            this.grid = new Grid()
            this.intro = new Intro()
        }
        else if(step === 1)
        {
            this.visualVehicle = new VisualVehicle(this.game.resources.vehicle.scene)
            this.floor = new Floor()
            this.waterSurface = new WaterSurface()
            this.grass = new Grass()
            this.windLines = new WindLines()
            this.confetti = new Confetti()
            this.leaves = new Leaves()
            this.rain = new RainLines()
            this.lightnings = new Lightnings()
            this.fireballs = new Fireballs()
            this.snow = new Snow()
            this.visualTornado = new VisualTornado()
            this.bushes = new Bushes()
            this.birchTrees = new Trees('Birch Tree', this.game.resources.birchTreesVisualModel.scene, this.game.resources.birchTreesReferencesModel.scene.children, '#ff4f2b', '#ff903f')
            this.oakTrees = new Trees('Oak Tree', this.game.resources.oakTreesVisualModel.scene, this.game.resources.oakTreesReferencesModel.scene.children, '#b4b536', '#d8cf3b')
            this.cherryTrees = new Trees('Cherry Tree', this.game.resources.cherryTreesVisualModel.scene, this.game.resources.cherryTreesReferencesModel.scene.children, '#ff6d6d', '#ff9990')
            this.flowers = new Flowers()
            this.bricks = new Bricks()
            this.fences = new Fences()
            this.benches = new Benches()
            this.explosiveCrates = new ExplosiveCrates()
            this.poleLights = new PoleLights()
            this.lanterns = new Lanterns()
            this.scenery = new Scenery()
            this.areas = new Areas()
        }
    }

}
