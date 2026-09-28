/** 指针事件只记录坐标；渲染帧采样时才按需量取画布，滚动与尺寸变化会使缓存失效。 */
export function createPointerInput(element: HTMLElement) {
  let active = false, dirty = true, clientX = 0, clientY = 0;
  let bounds: DOMRect;
  const point = { x: 0, y: 0 };
  const invalidate = () => { dirty = true; };
  window.addEventListener("scroll", invalidate, { capture: true, passive: true });
  window.addEventListener("resize", invalidate, { passive: true });
  return {
    move(x: number, y: number) { clientX = x; clientY = y; active = true; },
    clear() { active = false; },
    invalidate,
    sample() {
      if (!active) return null;
      if (dirty) { bounds = element.getBoundingClientRect(); dirty = false; }
      point.x = (clientX - bounds.left) / Math.max(1, bounds.width) * 2 - 1;
      point.y = (clientY - bounds.top) / Math.max(1, bounds.height) * 2 - 1;
      return point;
    },
    dispose() {
      window.removeEventListener("scroll", invalidate, true);
      window.removeEventListener("resize", invalidate);
    },
  };
}
