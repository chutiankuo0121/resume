import { gsap } from "gsap";
import { starBoundaryCurve, type BoundaryState } from "./boundaryField";
import { createStarFlow } from "./createStarFlow";
export type { BoundaryState, HubDestination } from "./boundaryField";

/** Paint, masks and hit regions share the same animated seam samples. */
export function createBoundary(
  canvas: HTMLCanvasElement,
  work: HTMLElement,
  skills: HTMLElement,
  workButton: HTMLElement,
  skillsButton: HTMLElement,
  state: BoundaryState,
) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const stage = canvas.parentElement!;
  const skillRoot = skills.querySelector<HTMLElement>("#skills")!;
  let lastWorkClip = "", lastSkillsClip = "", lastMask = "";
  const stars = createStarFlow(canvas, state);
  let visible = false,
    previous = 0,
    drawnExpansion = -1;
  const pointer = { x: 0.5, y: 0.5, strength: 0 };
  function draw(seconds: number) {
    if (!visible || document.hidden) {
      previous = 0;
      return;
    }
    // 全屏时边界已离开视口，透明粒子层清空一次后休眠。
    if (state.expansion === 1 && drawnExpansion === 1) {
      previous = 0;
      return;
    }
    const dt = previous ? Math.max(0, Math.min(seconds - previous, 0.05)) : 0;
    previous = seconds;
    const gather = stage.dataset.starGather;
    // No late blur switch: image softening follows the two moving seams.
    state.gather = gather === undefined ? 1 : Number(gather);
    if (!motion.matches) state.time += dt;
    const follow = 1 - Math.exp(-dt * 9);
    state.pointerX += (pointer.x - state.pointerX) * follow;
    state.pointerY += (pointer.y - state.pointerY) * follow;
    state.pointerStrength +=
      ((motion.matches ? 0 : pointer.strength) - state.pointerStrength) *
      follow;
    const seams = stars.render();
    const pixels = (point: { x: number; y: number }) => `${point.x.toFixed(2)}px ${point.y.toFixed(2)}px`;
    const workClip = `polygon(0% 0%,100% 0%,${seams.upper.map(pixels).reverse().join(",")})`;
    const skillsClip = `polygon(${seams.lower.map(pixels).join(",")},100% 100%,0% 100%)`;
    if (lastWorkClip !== workClip) workButton.style.clipPath = lastWorkClip = workClip;
    if (lastSkillsClip !== skillsClip) skillsButton.style.clipPath = lastSkillsClip = skillsClip;
    // 无动态画廊时，静态卡片也保留羽化边界；展开后恢复完整可滚动的卡片。
    const staticGallery = skillRoot.classList.contains("skills--static") ? skillRoot : null;
    if (staticGallery) {
      const path = `M-1,2 L-1,${starBoundaryCurve(0, state)} L${seams.lower.map(p => `${p.x / state.width},${p.y / state.height}`).join(" L")} L2,${starBoundaryCurve(1, state)} L2,2 Z`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" preserveAspectRatio="none"><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${3.5 / state.width} ${3.5 / state.height}"/></filter><path fill="white" filter="url(#f)" d="${path}"/></svg>`;
      const mask =
        state.expansion > 0.99 && state.destination === "skills"
          ? "none"
          : `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
      if (lastMask !== mask) staticGallery.style.maskImage = lastMask = mask;
    }
    if (gather !== undefined) {
      const mask = document.querySelector<SVGMaskElement>("#chapter-entry-mask");
      const path = mask?.querySelector("[data-curtain='entry']");
      if (mask && path) {
        mask.setAttribute("width", String(state.width + 256));
        mask.setAttribute("height", String(state.height + 256));
        const upper = seams.upper.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
        const lower = seams.lower.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`);
        path.setAttribute("d", `M-128,-128 L${state.width + 128},-128 L${state.width + 128},${seams.upper.at(-1)!.y} L${upper.reverse().join(" L")} L-128,${seams.upper[0].y} Z M-128,${state.height + 128} L${state.width + 128},${state.height + 128} L${state.width + 128},${seams.lower.at(-1)!.y} L${lower.reverse().join(" L")} L-128,${seams.lower[0].y} Z`);
      }
    }
    drawnExpansion = state.expansion;
  }
  function resize() {
    state.width = Math.max(1, canvas.clientWidth);
    state.height = Math.max(1, canvas.clientHeight);
    stars.resize(state.width, state.height);
    previous = 0;
    drawnExpansion = -1;
    draw(gsap.ticker.time);
    work.querySelector("#work")?.dispatchEvent(new Event("portal-update"));
  }
  function move(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width;
    pointer.y = (event.clientY - rect.top) / rect.height;
    pointer.strength = event.pointerType === "mouse" ? 1 : 0;
  }
  function leave() {
    pointer.strength = 0;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  visibility.observe(canvas);
  // Track input across all visible chapters, including the gap between seams.
  window.addEventListener("pointermove", move, { passive: true });
  stage.addEventListener("pointerleave", leave);
  gsap.ticker.add(draw);
  resize();
  return () => {
    gsap.ticker.remove(draw);
    window.removeEventListener("pointermove", move);
    stage.removeEventListener("pointerleave", leave);
    observer.disconnect();
    visibility.disconnect();
    stars.dispose();
  };
}
