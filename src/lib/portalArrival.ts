import * as THREE from "three";
import { createTextDetailTexture } from "./textDetailTexture";
import { careerCollagePaths } from "./career/collage";

/** Reuse the displayed career image URL; map its live DOM rectangle to the portal. */
export function createPortalArrival(canvas: HTMLCanvasElement) {
  const image = document.querySelector<HTMLImageElement>(".career-period:first-child .career-background img");
  const stage = document.querySelector<HTMLElement>(".career-period:first-child .career-stage");
  const text = createTextDetailTexture(stage, ".career-intro,.career-story", ".career-visual");
  const empty = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  empty.needsUpdate = true;
  // The first chapter enters as an incomplete paper background. Sample only
  // that complement, so the portal cannot echo pieces still below the screen.
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = 384; maskCanvas.height = 512;
  const context = maskCanvas.getContext("2d")!;
  context.scale(maskCanvas.width, maskCanvas.height);
  context.fillStyle = "white"; context.fillRect(0, 0, 1, 1);
  const cuts = careerCollagePaths(0);
  context.fillStyle = "black";
  context.fill(new Path2D(cuts.cutout));
  const mask = new THREE.CanvasTexture(maskCanvas);
  mask.generateMipmaps = false; mask.minFilter = THREE.LinearFilter;
  const uniforms = {
    uArrival: { value: empty as THREE.Texture },
    uArrivalMask: { value: mask },
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
      uniforms.uArrivalRect.value.set(box.left - viewport.left, box.top - viewport.top,
        Math.max(1, box.width), Math.max(1, box.height));
    },
    dispose() {
      disposed = true;
      text.dispose();
      texture?.dispose(); empty.dispose(); mask.dispose();
    },
  };
}
