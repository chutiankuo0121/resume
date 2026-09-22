import './threejs-override.js'
import { Game } from './Game/Game.js'
import { connectPortfolio } from './portfolio.js'

// 先载入本地字体，再制作三维场景中的 Canvas 文字纹理。
try {
    await Promise.all([
        document.fonts.load('400 20px "Nunito"'),
        document.fonts.load('700 20px "Amatic SC"'),
        document.fonts.load('500 20px "Pally-Medium"'),
        document.fonts.load('400 20px "Bruno Han"', '中文'),
    ])
    connectPortfolio(new Game())
} catch(error) {
    console.error('游戏资源初始化失败', error)
    if(parent !== window) parent.postMessage({ channel: 'astra-game', type: 'error' }, location.origin)
}
