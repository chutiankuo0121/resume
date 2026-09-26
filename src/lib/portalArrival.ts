import * as THREE from "three";
import { createTextDetailTexture } from "./textDetailTexture";

/** Reuse the displayed career image URL; map its live DOM rectangle to the portal. */
export function createPortalArrival(canvas: HTMLCanvasElement) {
  const image = document.querySelector<HTMLImageElement>(".career-backdrop:first-child .career-picture img");
  const stage = document.querySelector<HTMLElement>(".resume-timeline");
  const text = createTextDetailTexture(stage, ".career-period:first-child .career-intro,.career-period:first-child .career-story,.career-ruler", ".career-stage,.career-entry-date");
  const empty = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  empty.needsUpdate = true;
  const uniforms = {
    uArrival: { value: empty as THREE.Texture },
    uArrivalText: { value: text.texture },
    uArrivalRect: { value: new THREE.Vector4(0, 0, 1, 1) },
    uArrivalReady: { value: 0 },
  };
  let disposed = false, texture: THREE.Texture | undefined;
  if (image) {
    new THREE.TextureLoader().load(image.currentSrc || image.src, loaded => {
      if (disposed) { loaded.dispose(); return; }
      texture = loaded;
      // The opening compositor works in display-space color, matching DOM imagery.
      uniforms.uArrival.value = loaded;
      uniforms.uArrivalReady.value = 1;
    }, undefined, () => { /* Existing crystal details still render if this image fails. */ });
  }
  return {
    uniforms,
    update() {
      const viewport = canvas.getBoundingClientRect();
      text.update(viewport);
      if (!image || !texture) return;
      const box = image.getBoundingClientRect();
      // Match object-fit: cover, including portrait/mobile crops of the full-screen scene.
      const scale = Math.max(box.width / Math.max(1, image.naturalWidth), box.height / Math.max(1, image.naturalHeight));
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      const position = getComputedStyle(image).objectPosition.split(" ").map(value => parseFloat(value) / 100);
      uniforms.uArrivalRect.value.set(
        box.left - viewport.left + (box.width - width) * (Number.isFinite(position[0]) ? position[0] : .5),
        box.top - viewport.top + (box.height - height) * (Number.isFinite(position[1]) ? position[1] : .5),
        Math.max(1, width), Math.max(1, height));
    },
    dispose() {
      disposed = true;
      text.dispose();
      texture?.dispose(); empty.dispose();
    },
  };
}
