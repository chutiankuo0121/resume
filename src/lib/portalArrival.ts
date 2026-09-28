import { createTextDetailTexture } from "./textDetailTexture";

/** 洞口只采样即将出现的第一段经历，不扫描后续章节，也不再加载已移除的学校配图。 */
export function createPortalArrival(canvas: HTMLCanvasElement) {
  const chapter = document.querySelector<HTMLElement>(".career-period:first-child");
  const text = createTextDetailTexture(chapter, ".career-intro,.career-story", ".career-entry-date");
  return {
    uniforms: { uArrivalText: { value: text.texture } },
    update() { text.update(canvas.getBoundingClientRect()); },
    dispose() { text.dispose(); },
  };
}
