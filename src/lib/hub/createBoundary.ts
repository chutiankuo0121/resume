import { gsap } from "gsap";
import type { BoundaryState } from "./boundaryField";
import { createInkBoundary } from "./createInkBoundary";
import { createColorLens } from "./createColorLens";
export type { BoundaryState, HubDestination } from "./boundaryField";

/** Paint, GPU masks and hit regions share one straight line. */
export function createBoundary(
  canvas: HTMLCanvasElement,
  frameGuide: HTMLElement,
  work: HTMLElement,
  skills: HTMLElement,
  workButton: HTMLElement,
  skillsButton: HTMLElement,
  state: BoundaryState,
) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const stage = canvas.parentElement!;
  const skillRoot = skills.querySelector<HTMLElement>("#skills")!;
  let lastRevision = -1, lastStatic = false;
  const ink = createInkBoundary(canvas, frameGuide, state);
  const lens = createColorLens(stage, frameGuide, state);
  let visible = false,
    previous = 0,
    drawnExpansion = -1;
  function draw(seconds: number) {
    if (!visible || document.hidden) {
      previous = 0;
      return;
    }
    // The mat and seam have cleared the fullscreen view; sleep until it closes.
    if (state.expansion === 1 && drawnExpansion === 1) {
      previous = 0;
      return;
    }
    const dt = previous ? Math.max(0, Math.min(seconds - previous, 0.05)) : 0;
    previous = seconds;
    const pointer = lens.update(dt);
    if (!motion.matches) state.time += dt;
    const mode = motion.matches ? "static" : stage.classList.contains("chapter-held") ? "freeze" : "animate";
    const seams = ink.render(dt, pointer ? pointer.x - state.width / 2 : 0,
      pointer ? pointer.y - state.height / 2 : 0, mode);
    const isStatic = skillRoot.classList.contains("skills--static");
    if (lastRevision !== seams.revision || lastStatic !== isStatic) {
      workButton.style.clipPath = seams.workClip;
      skillsButton.style.clipPath = seams.skillsClip;
      if (isStatic) skillRoot.style.clipPath = seams.skillsClip;
      else skillRoot.style.removeProperty("clip-path");
      lastRevision = seams.revision;
      lastStatic = isStatic;
    }
    drawnExpansion = state.expansion;
  }
  function resize() {
    state.width = Math.max(1, canvas.clientWidth);
    state.height = Math.max(1, canvas.clientHeight);
    ink.resize(state.width, state.height);
    lens.resize();
    previous = 0;
    drawnExpansion = -1;
    draw(gsap.ticker.time);
    work.querySelector("#work")?.dispatchEvent(new Event("portal-update"));
  }
  function refresh() { previous = 0; lens.reset(); }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    refresh();
  });
  visibility.observe(canvas);
  document.addEventListener("visibilitychange", refresh);
  motion.addEventListener("change", refresh);
  gsap.ticker.add(draw);
  resize();
  return () => {
    gsap.ticker.remove(draw);
    observer.disconnect();
    visibility.disconnect();
    document.removeEventListener("visibilitychange", refresh);
    motion.removeEventListener("change", refresh);
    skillRoot.style.removeProperty("clip-path");
    ink.dispose();
    lens.dispose();
  };
}
