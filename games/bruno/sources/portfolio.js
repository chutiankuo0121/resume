import { Howler } from 'howler'
import gsap from 'gsap'

/** 独立 iframe 的生命周期：暂停模拟与音频，退出前释放本局 GPU / WASM 资源。 */
export function connectPortfolio(game) {
    let paused = false
    let disposed = false
    let ready = false
    let pausedAt = 0
    let filters = []
    const overlay = document.createElement('div')
    overlay.className = 'portfolio-pause'
    overlay.hidden = true
    overlay.innerHTML = '<div><p>暂歇片刻</p><button type="button">继续探索</button><small>WASD 驾驶 · Shift 加速 · 空格跳跃 · M 地图</small></div>'
    document.body.append(overlay)

    const send = (type, extra = {}) => {
        if(parent !== window && !disposed)
            parent.postMessage({ channel: 'astra-game', type, ...extra }, location.origin)
    }
    function pause() {
        if(paused || disposed || !ready) return
        paused = true
        pausedAt = performance.now()
        game.rendering.renderer.setAnimationLoop(null)
        gsap.globalTimeline.pause()
        filters = [...game.inputs.filters]
        game.inputs.filters.clear()
        for(const key of game.inputs.keyboard.pressed) game.inputs.keyboard.events.trigger('up', [key])
        game.inputs.keyboard.pressed = []
        Howler.ctx?.suspend()
        Howler.mute(true)
        overlay.hidden = false
        overlay.querySelector('button').focus()
    }
    function resume() {
        if(!paused || disposed || document.hidden) return
        paused = false
        game.ticker.pausedDuration += (performance.now() - pausedAt) / 1000
        overlay.hidden = true
        game.inputs.filters.clear()
        for(const filter of filters) game.inputs.filters.add(filter)
        Howler.mute(game.audio.mute.active)
        Howler.ctx?.resume()
        gsap.globalTimeline.resume()
        game.rendering.renderer.setAnimationLoop(elapsed => game.ticker.update(elapsed))
        window.focus()
    }
    function dispose() {
        if(disposed) return
        disposed = true
        game.rendering?.renderer.setAnimationLoop(null)
        gsap.globalTimeline.clear()
        gsap.ticker.sleep()
        Howler.unload()
        for(const loader of game.resourcesLoader.loaders.values()) loader.dispose?.()
        game.rendering?.postProcessing?.dispose()
        game.rendering?.renderer.dispose()
        game.physics?.eventQueue?.free()
        game.physics?.world?.free()
        overlay.remove()
    }
    function fail(error) {
        console.error('游戏启动失败', error)
        send('error')
        dispose()
    }
    overlay.querySelector('button').addEventListener('click', resume)
    window.addEventListener('blur', pause)
    document.addEventListener('visibilitychange', () => { if(document.hidden) pause() })
    window.addEventListener('message', event => {
        if(event.origin === location.origin && event.source === parent
            && event.data?.channel === 'astra-game' && event.data.type === 'pause') pause()
    })
    // Esc 始终暂停；原作菜单可以使用屏幕上的菜单按钮打开。
    window.addEventListener('keydown', event => {
        if(event.code !== 'Escape') return
        event.preventDefault()
        event.stopImmediatePropagation()
        if(paused) resume(); else pause()
    }, true)
    window.addEventListener('portfolio:dispose', dispose, { once: true })
    window.addEventListener('pagehide', dispose, { once: true })
    window.addEventListener('portfolio:progress', event => send('progress', { progress: event.detail }))
    window.addEventListener('unhandledrejection', event => { if(!ready) fail(event.reason) })
    send('progress', { progress: 0.05 })
    game.ready.then(() => {
        if(disposed) return
        ready = true
        send('ready')
        if(document.hidden) pause()
    }).catch(fail)
}
