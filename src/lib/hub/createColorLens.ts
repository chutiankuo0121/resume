import type { BoundaryState } from "./boundaryField";

/** One eased pointer drives the outline and both existing WebGL color passes. */
export function createColorLens(stage: HTMLElement, guide: HTMLElement, state: BoundaryState) {
  const outline = stage.querySelector<HTMLElement>(".hub-color-lens")!;
  const finePointer = matchMedia("(any-hover: hover) and (any-pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const lens = state.colorLens = { x: 0, y: 0, radius: 140, strength: 0, enabled: !reduced.matches };
  const pointer = { x: 0, y: 0 }, local = { x: 0, y: 0 };
  let hasPointer = false, boundsDirty = true;
  let origin = { left: 0, top: 0 };
  let lastTransform = "", lastOpacity = "0";
  let wasInside = false;
  let cursorActive = false;
  let bounds = { left: 0, top: 0, right: 0, bottom: 0 };

  function showCursor(active: boolean) {
    if (cursorActive === active) return;
    cursorActive = active;
    if (active) stage.dataset.lensActive = "true";
    else delete stage.dataset.lensActive;
  }
  function reset() {
    hasPointer = false;
    boundsDirty = true;
    wasInside = false;
    lens.strength = 0;
    if (lastOpacity !== "0") outline.style.opacity = lastOpacity = "0";
    showCursor(false);
  }
  function move(event: PointerEvent) {
    if (event.pointerType !== "mouse" || !event.isPrimary) { reset(); return; }
    hasPointer = true;
    pointer.x = event.clientX; pointer.y = event.clientY;
  }
  function invalidateBounds() { boundsDirty = true; }
  function preference() { lens.enabled = !reduced.matches; reset(); }
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("scroll", invalidateBounds, { passive: true });
  window.addEventListener("blur", reset);
  document.documentElement.addEventListener("pointerleave", reset);
  document.addEventListener("visibilitychange", reset);
  reduced.addEventListener("change", preference);
  finePointer.addEventListener("change", preference);

  return {
    reset,
    resize() {
      bounds = { left: guide.offsetLeft, top: guide.offsetTop,
        right: guide.offsetLeft + guide.offsetWidth, bottom: guide.offsetTop + guide.offsetHeight };
      lens.radius = Math.min(160, Math.max(100, guide.offsetWidth * .105));
      outline.style.width = outline.style.height = `${lens.radius * 2}px`;
      reset();
    },
    update(dt: number) {
      const available = lens.enabled && finePointer.matches && state.expansion === 0 &&
        state.gather > .99 && !stage.classList.contains("chapter-held") && !stage.classList.contains("is-open");
      if (!available) { reset(); return null; }
      if (!hasPointer && lens.strength === 0) return null;
      // Layout is read once after scroll/resize, before this frame's DOM writes.
      if (boundsDirty) { origin = stage.getBoundingClientRect(); boundsDirty = false; }
      const x = (hasPointer ? pointer.x : -1000) - origin.left;
      const y = (hasPointer ? pointer.y : -1000) - origin.top;
      local.x = x; local.y = y;
      const inside = x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
      const follow = 1 - Math.exp(-dt * 18);
      if (inside) {
        if (!wasInside) { lens.x = x; lens.y = y; }
        else { lens.x += (x - lens.x) * follow; lens.y += (y - lens.y) * follow; }
      }
      lens.strength += ((inside ? 1 : 0) - lens.strength) * (1 - Math.exp(-dt * 16));
      if (Math.abs(lens.strength - (inside ? 1 : 0)) < .001) lens.strength = inside ? 1 : 0;
      const transform = `translate3d(${(lens.x - lens.radius).toFixed(2)}px,${(lens.y - lens.radius).toFixed(2)}px,0)`;
      const opacity = lens.strength.toFixed(3);
      if (lastTransform !== transform) outline.style.transform = lastTransform = transform;
      if (lastOpacity !== opacity) outline.style.opacity = lastOpacity = opacity;
      showCursor(inside);
      wasInside = inside;
      return x >= 0 && x <= state.width && y >= 0 && y <= state.height ? local : null;
    },
    dispose() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", invalidateBounds);
      window.removeEventListener("blur", reset);
      document.documentElement.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", reset);
      reduced.removeEventListener("change", preference);
      finePointer.removeEventListener("change", preference);
      reset();
      delete state.colorLens;
    },
  };
}
