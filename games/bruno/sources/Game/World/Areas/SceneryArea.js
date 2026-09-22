import { Area } from './Area.js'

/** 装饰区域共用探索进度；区域名来自构建后的模型，与地图数据一致。 */
export class SceneryArea extends Area {
    constructor(model) {
        super(model)
        this.events.on('boundingIn', () => this.game.achievements.setProgress('areas', model.name))
    }
}
