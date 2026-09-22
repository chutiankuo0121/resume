import * as THREE from 'three/webgpu'
import { Cycles } from './Cycles.js'

const presets = {
    day:   { revealColor: new THREE.Color('#5f7dff'), revealIntensity: 12, electricField: 0, temperature: 5, lightColor: new THREE.Color('#ffd2c2'), lightIntensity: 1.2, shadowColor: new THREE.Color('#6d3fff'), fogColorA: new THREE.Color('#00ffff'), fogColorB: new THREE.Color('#9b89ff'), fogNearRatio: 0.315, fogFarRatio: 1.25 },
    dusk:  { revealColor: new THREE.Color('#ff86d9'), revealIntensity: 5.55, electricField: 0.25, temperature: 0, lightColor: new THREE.Color('#ff8181'), lightIntensity: 1.2, shadowColor: new THREE.Color('#4e009c'), fogColorA: new THREE.Color('#3e53ff'), fogColorB: new THREE.Color('#ff4ce4'), fogNearRatio: 0, fogFarRatio: 1.25 },
    night: { revealColor: new THREE.Color('#b678ff'), revealIntensity: 10, electricField: 1, temperature: -7.5, lightColor: new THREE.Color('#3240ff'), lightIntensity: 3.8, shadowColor: new THREE.Color('#2f00db'), fogColorA: new THREE.Color('#10266f'), fogColorB: new THREE.Color('#490a42'), fogNearRatio: -0.85, fogFarRatio: 1 },
    dawn:  { revealColor: new THREE.Color('#ff9d9d'), revealIntensity: 4.85, electricField: 0.25, temperature: 0, lightColor: new THREE.Color('#ffa882'), lightIntensity: 1.2, shadowColor: new THREE.Color('#db004f'), fogColorA: new THREE.Color('#f885ff'), fogColorB: new THREE.Color('#ff7d24'), fogNearRatio: 0.3, fogFarRatio: 1.25 },
}

export class DayCycles extends Cycles
{
    constructor()
    {
        super(4 * 60)
    }

    get presets()
    {
        return presets
    }

    getKeyframesDescriptions()
    {
        return [
            [
                { properties: presets.day, stop: 0.0 }, // day
                { properties: presets.day, stop: 0.15 }, // day
                { properties: presets.dusk, stop: 0.25 }, // Dusk
                { properties: presets.night, stop: 0.35 }, // Night
                { properties: presets.night, stop: 0.6 }, // Night
                { properties: presets.dawn, stop: 0.8 }, // Dawn
                { properties: presets.day, stop: 0.9 }, // day
            ]
        ]
    }

    getIntervalDescriptions()
    {
        return [
            { name: 'night', start: 0.25, end: 0.7 },
            { name: 'deepNight', start: 0.35, end: 0.6 },
        ]
    }
}
