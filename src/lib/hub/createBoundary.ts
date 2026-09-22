import { gsap } from "gsap";
import { boundaryCurve, type BoundaryState } from "./boundaryField";
import { createStarFlow } from "./createStarFlow";
export type { BoundaryState, HubDestination } from "./boundaryField";

/** 中轴只用于拾取；画面由两侧后处理的连续覆盖率混合，星流拥有独立的空间宽度。 */
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
    if (!motion.matches) state.time += dt;
    const follow = 1 - Math.exp(-dt * 3);
    state.pointerX += (pointer.x - state.pointerX) * follow;
    state.pointerY += (pointer.y - state.pointerY) * follow;
    state.pointerStrength +=
      ((motion.matches ? 0 : pointer.strength) - state.pointerStrength) *
      follow;
    const points = Array.from(
      { length: 65 },
      (_, i) =>
        `${((i / 64) * 100).toFixed(3)}% ${(boundaryCurve(i / 64, state) * 100).toFixed(3)}%`,
    );
    workButton.style.clipPath = `polygon(0% 0%,100% 0%,${points.slice().reverse().join(",")})`;
    skillsButton.style.clipPath = `polygon(${points.join(",")},100% 100%,0% 100%)`;
    // 无动态画廊时，静态卡片也保留羽化边界；展开后恢复完整可滚动的卡片。
    const staticGallery = skills.querySelector<HTMLElement>(".skills--static");
    if (staticGallery) {
      const path = `M-1,2 L-1,${boundaryCurve(0, state)} L${points.map((_, i) => `${i / 64},${boundaryCurve(i / 64, state)}`).join(" L")} L2,${boundaryCurve(1, state)} L2,2 Z`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" preserveAspectRatio="none"><filter id="f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".045"/></filter><path fill="white" filter="url(#f)" d="${path}"/></svg>`;
      staticGallery.style.maskImage =
        state.expansion > 0.99 && state.destination === "skills"
          ? "none"
          : `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    }
    stars.render();
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
  stage.addEventListener("pointermove", move);
  stage.addEventListener("pointerleave", leave);
  gsap.ticker.add(draw);
  resize();
  return () => {
    gsap.ticker.remove(draw);
    stage.removeEventListener("pointermove", move);
    stage.removeEventListener("pointerleave", leave);
    observer.disconnect();
    visibility.disconnect();
    stars.dispose();
  };
}
