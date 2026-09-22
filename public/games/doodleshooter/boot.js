// 静态入口把初始化失败明确告知作品播放器，避免加载遮罩无限等待。
const report = () => {
  window.dispatchEvent(new Event('portfolio:dispose'));
  if (window.parent !== window) {
    window.parent.postMessage({ channel: 'astra-game', type: 'error' }, location.origin);
  }
};
window.addEventListener('error', report);
window.addEventListener('unhandledrejection', report);
import('./src/main.js').catch((error) => {
  console.error('Doodle District could not start', error);
  report();
});
