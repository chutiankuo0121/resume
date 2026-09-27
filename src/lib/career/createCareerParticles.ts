import type { FrameClock } from "../transition";
import { createAmbientParticleField } from "../particles/createAmbientParticleField";

/** Portfolio's slow Canvas dust and eased pointer drift, adapted to white paper. */
export function createCareerParticles(root: HTMLElement, clock: FrameClock) {
  const stage = root.querySelector<HTMLElement>(".career-stage")!;
  const canvas = stage.querySelector<HTMLCanvasElement>(".career-particles")!;
  const context = canvas.getContext("2d");
  if (!context) return { dispose() {} };

  const main = root.closest<HTMLElement>(".astra")!;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0 };
  let width = 0, height = 0, pixelRatio = 1, previousTime = 0;
  let visible = false, dirty = true;
  const field = createAmbientParticleField();

  function resize() {
    const nextWidth = stage.clientWidth, nextHeight = stage.clientHeight;
    const nextRatio = Math.min(window.devicePixelRatio || 1, 2);
    if (!nextWidth || !nextHeight || (width === nextWidth && height === nextHeight && pixelRatio === nextRatio)) return;
    field.resize(nextWidth, nextHeight);
    width = nextWidth; height = nextHeight; pixelRatio = nextRatio;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    dirty = true;
  }

  function move(event: PointerEvent) {
    if (!visible || motion.matches || event.pointerType === "touch") return;
    const box = stage.getBoundingClientRect();
    const x = event.clientX - box.left, y = event.clientY - box.top;
    pointer.x = x >= 0 && x <= width ? x - width / 2 : 0;
    pointer.y = y >= 0 && y <= height ? y - height / 2 : 0;
  }
  function resetPointer() { pointer.x = 0; pointer.y = 0; }
  function refresh() { previousTime = 0; dirty = true; resetPointer(); }

  const unsubscribe = clock.subscribe(timestamp => {
    const frozen = stage.classList.contains("chapter-held");
    if (!visible || document.hidden || main.dataset.exploring === "true" || (frozen && !dirty)) {
      previousTime = 0;
      return;
    }
    const dt = previousTime ? (timestamp - previousTime) / 1000 : 1 / 60;
    previousTime = timestamp;
    if (motion.matches && !dirty) return;
    field.update(dt, pointer.x, pointer.y, motion.matches ? "static" : frozen ? "freeze" : "animate");
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#111111";

    for (const particle of field.particles) {
      const x = particle.x + particle.offsetX, y = particle.y + particle.offsetY;
      context.globalAlpha = particle.alpha;
      context.beginPath();
      context.arc(x, y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    dirty = false;
  });

  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  const intersection = new IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    previousTime = 0;
  });
  intersection.observe(stage);
  window.addEventListener("pointermove", move, { passive: true });
  document.documentElement.addEventListener("pointerleave", resetPointer);
  window.addEventListener("blur", resetPointer);
  document.addEventListener("visibilitychange", refresh);
  motion.addEventListener("change", refresh);
  resize();

  return {
    dispose() {
      unsubscribe();
      observer.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", resetPointer);
      window.removeEventListener("blur", resetPointer);
      document.removeEventListener("visibilitychange", refresh);
      motion.removeEventListener("change", refresh);
      context.clearRect(0, 0, width, height);
      field.particles.length = 0;
    },
  };
}
