/**
 * 本站唯一的游戏适配层：握手、鼠标锁状态、失焦暂停和销毁。
 * 不修改地图、武器、敌人、渲染或音效算法；脱离 iframe 也可独立运行。
 */
export function mountPortfolioBridge({ input, pause, audio, stop }) {
  let disposed = false;
  const send = (type, payload = {}) => {
    if (window.parent !== window) {
      window.parent.postMessage({ channel: 'astra-game', type, ...payload }, location.origin);
    }
  };
  const lock = () => send('lock', { locked: Boolean(document.pointerLockElement) });
  const suspend = () => {
    if (disposed) return;
    pause();
    input.exitLock();
    // 失焦时静音；回到页面后由用户手势恢复声音与单人游戏。
    if (audio.ctx?.state === 'running') void audio.ctx.suspend();
  };
  const visibility = () => { if (document.hidden) suspend(); };
  const message = (event) => {
    if (event.source !== window.parent || event.origin !== location.origin) return;
    if (event.data?.channel === 'astra-game' && event.data.type === 'pause') suspend();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    input.exitLock();
    audio.musicOn(false);
    audio.reelLoop(false);
    if (audio.ctx && audio.ctx.state !== 'closed') void audio.ctx.close();
    stop();
    window.removeEventListener('message', message);
    window.removeEventListener('blur', suspend);
    window.removeEventListener('pagehide', dispose);
    window.removeEventListener('portfolio:dispose', dispose);
    document.removeEventListener('visibilitychange', visibility);
    document.removeEventListener('pointerlockchange', lock);
  };
  window.addEventListener('message', message);
  window.addEventListener('blur', suspend);
  window.addEventListener('pagehide', dispose);
  window.addEventListener('portfolio:dispose', dispose);
  document.addEventListener('visibilitychange', visibility);
  document.addEventListener('pointerlockchange', lock);
  document.getElementById('c').addEventListener('webglcontextlost', () => {
    if (!disposed) { send('error'); dispose(); }
  }, { once: true });
  send('ready');
  lock();
}
