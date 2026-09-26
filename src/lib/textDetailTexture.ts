import * as THREE from "three";

/** Cache glyph contours at their DOM positions; never rasterize chapter masks. */
export function createTextDetailTexture(
  root: HTMLElement | null,
  anchorSelector: string,
  excludeSelector?: string,
) {
  const textCanvas = document.createElement("canvas");
  const context = textCanvas.getContext("2d")!;
  const textTexture = new THREE.CanvasTexture(textCanvas);
  textTexture.generateMipmaps = false;
  textTexture.minFilter = THREE.LinearFilter;
  let textLayout = "";
  const invalidateText = () => { textLayout = ""; };
  document.fonts.addEventListener("loadingdone", invalidateText);
  function updateText(viewport: DOMRect) {
    if (!root) return;
    const box = root.getBoundingClientRect();
    const anchors = [...root.querySelectorAll<HTMLElement>(anchorSelector)];
    const key = [viewport.width, viewport.height, box.left-viewport.left, box.top-viewport.top,
      ...anchors.flatMap(element => { const r=element.getBoundingClientRect(); return [r.x-viewport.left,r.y-viewport.top,r.width,r.height]; })]
      .map(value => Math.round(value)).join(",") + anchors.map(element => {
        const style = getComputedStyle(element);
        return `${style.opacity}:${style.visibility}`;
      }).join(",");
    if (key === textLayout) return;
    textLayout = key;
    const dpr = Math.min(devicePixelRatio, 1.5);
    const w = Math.max(1, Math.round(viewport.width*dpr));
    const h = Math.max(1, Math.round(viewport.height*dpr));
    if (textCanvas.width !== w || textCanvas.height !== h) {
      // WebGL texture storage is immutable; resizing needs a fresh allocation.
      textTexture.dispose();
      textCanvas.width = w; textCanvas.height = h;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.globalAlpha = 1;
    context.fillStyle = "white"; context.fillRect(0, 0, viewport.width, viewport.height);
    context.fillStyle = "black";
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    // DOM ranges supply actual wrapping and glyph positions. Only text contours
    // are sampled; the live DOM remains responsible for displaying the content.
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || !node.textContent?.trim() || (excludeSelector && parent.closest(excludeSelector))) continue;
      const style = getComputedStyle(parent);
      if (style.visibility === "hidden" || style.display === "none") continue;
      // 完整经历现在直接铺在页面上；视口外的长段落不必逐字量取。
      const parentBox = parent.getBoundingClientRect();
      if (parentBox.bottom <= viewport.top || parentBox.top >= viewport.bottom ||
          parentBox.right <= viewport.left || parentBox.left >= viewport.right) continue;
      let opacity = 1;
      for (let element: HTMLElement | null = parent; element; element = element.parentElement) {
        const ancestorStyle = getComputedStyle(element);
        if (ancestorStyle.display === "none" || ancestorStyle.visibility === "hidden") { opacity = 0; break; }
        opacity *= Number(ancestorStyle.opacity);
        if (element === root) break;
      }
      if (opacity < .005) continue;
      context.globalAlpha = opacity;
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const metrics = context.measureText("国Mg");
      const descent = metrics.fontBoundingBoxDescent;
      const ascent = metrics.fontBoundingBoxAscent;
      const content = node.textContent;
      for (let i = 0; i < content.length; i++) {
        const glyph = String.fromCodePoint(content.codePointAt(i)!);
        range.setStart(node, i); range.setEnd(node, i+glyph.length);
        const r = range.getBoundingClientRect();
        const x = r.left-viewport.left, y = r.top-viewport.top;
        if (r.width && r.height && x < viewport.width && x+r.width > 0 && y < viewport.height && y+r.height > 0) {
          context.fillText(glyph, x, y+(r.height-ascent-descent)/2+ascent);
        }
        i += glyph.length-1;
      }
    }
    textTexture.needsUpdate = true;
  }
  return {
    texture: textTexture,
    update: updateText,
    dispose() {
      document.fonts.removeEventListener("loadingdone", invalidateText);
      textTexture.dispose();
    },
  };
}
