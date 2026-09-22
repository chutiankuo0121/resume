import * as THREE from 'three/webgpu'
import { color, Fn, mix, sin, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { SceneryArea } from './SceneryArea.js'

/** 撞击切换星空与波纹，画面只依赖游戏时钟，无图片和外链。 */
export class OldTelevisionArea extends SceneryArea {
    constructor(model) {
        super(model)
        this.screenMode = uniform(0)
        const material = new THREE.MeshBasicNodeMaterial()
        material.outputNode = Fn(() => {
            const p = uv()
            const clock = this.game.ticker.elapsedScaledUniform
            const cell = p.mul(vec2(128, 96)).floor()
            const seed = sin(cell.dot(vec2(12.9898, 78.233))).mul(43758.5453).fract()
            const stars = seed.greaterThan(0.994).select(1, 0).mul(sin(clock.add(seed.mul(35))).mul(0.3).add(0.7))
            const wave = sin(p.x.mul(12).add(clock).add(sin(p.y.mul(8).sub(clock)))).mul(0.5).add(0.5).pow(5)
            const scan = sin(p.y.mul(420).sub(clock.mul(1.8))).mul(0.08).add(0.88)
            const glow = p.sub(0.5).length().mul(1.6).oneMinus().max(0)
            const sky = color('#122332').mul(glow).add(vec3(stars))
            const bands = mix(color('#123d4a'), color('#86dfe5'), wave).mul(glow)
            return vec4(mix(sky, bands, this.screenMode).mul(scan), 1)
        })()
        this.references.items.get('screen')[0].material = material
        const tv = this.references.items.get('tv')[0]
        let lastHit = -Infinity
        tv.userData.object.physical.onCollision = () => {
            const now = this.game.ticker.elapsedScaled
            if (now - lastHit < 1) return
            lastHit = now
            this.screenMode.value = 1 - this.screenMode.value
            this.game.audio.groups.get('click')?.play(true)
        }
    }
}
