import { gsap } from "gsap";
import { createChapterEdge, EDGE_SAMPLES } from "./createChapterEdge";
import { createLiquidContour } from "./liquidContour";
import { contactTransitionField, updateContactTransition } from "../contact/transitionField";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (from: number, to: number, value: number) => {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};

/** offset 不受临时运镜 transform 影响，避免把上一帧的位移重新计入滚动边界。 */
function documentTop(element: HTMLElement) {
  let top = 0;
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null)
    top += node.offsetTop;
  return top;
}

export function createChapterHandoffs(
  career: HTMLElement,
  explore: HTMLElement,
  contact: HTMLElement,
  masks: SVGSVGElement,
) {
  const main = explore.closest<HTMLElement>(".astra")!;
  const careerStage = career.querySelector<HTMLElement>(".career-stage")!;
  const careerLayout = career.querySelector<HTMLElement>(".career-period:last-child .career-layout")!;
  const ruler = career.querySelector<HTMLElement>(".career-ruler")!;
  const hub = explore.querySelector<HTMLElement>(".hub-stage")!;
  const contactStage = contact.querySelector<HTMLElement>(".contact-stage")!;
  const contactContent = contactStage.querySelector<HTMLElement>(".signal-content")!;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const elements = [careerStage, careerLayout, ruler, hub, contactStage];
  const collageMask = masks.querySelector<SVGPathElement>("[data-curtain='collage']")!;
  const sparkle = document.createElement("canvas");
  sparkle.className = "chapter-edge-sparkle";
  sparkle.setAttribute("aria-hidden", "true");
  main.appendChild(sparkle);
  let particles: ReturnType<typeof createChapterEdge> | undefined;
  try { particles = createChapterEdge(sparkle); } catch { /* The image reveal still works without the decorative glow. */ }
  let screenWidth = 0, screenHeight = 0, revealProgress = 0;
  const pointer = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, strength: 0, targetStrength: 0 };
  const liquid = createLiquidContour(EDGE_SAMPLES);
  let lastFrame = 0;
  function pointerMove(event: PointerEvent) {
    if (event.pointerType === "touch") { pointer.targetStrength = 0; return; }
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    pointer.targetStrength = 1;
  }
  function pointerLeave() { pointer.targetStrength = 0; }
  let suspended = false, active = "";
  const positions = { career: 0, entryStart: 0, explore: 0, exitStart: 0, contact: 0 };
  function drawCollage(time: number) {
    if (active !== "exit" || document.hidden) return;
    const dt = Math.min(.05, Math.max(0, time - lastFrame));
    lastFrame = time;
    const follow = 1 - Math.exp(-dt * 9);
    pointer.x += (pointer.targetX - pointer.x) * follow;
    pointer.y += (pointer.targetY - pointer.y) * follow;
    pointer.strength += (pointer.targetStrength - pointer.strength) * follow;
    const { points, velocities, flow } = liquid.update(revealProgress, dt, screenWidth, screenHeight, pointer);
    // Reveal below the seam. The outgoing page remains fully visible above it,
    // so the two compositions meet directly instead of fading through paper.
    collageMask.setAttribute("d", `M-128,${screenHeight + 128} L${screenWidth + 128},${screenHeight + 128} L${screenWidth + 128},${points.at(-1)!.y} L${[...points].reverse().map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" L")} L-128,${points[0].y} Z`);
    // SVG masks only change paint. Clip hit testing too, so the transparent
    // part of the contact stage cannot intercept the still-visible hub.
    const clip = `polygon(${points.map(({ x, y }) => `${x.toFixed(2)}px ${y.toFixed(2)}px`).join(",")},100% 100%,0% 100%)`;
    // DOM hit testing and GPU picture details use the same moving seam.
    contactContent.style.clipPath = clip;
    contactStage.style.clipPath = contactStage.dataset.art === "ready" ? "none" : clip;
    const strength = smooth(0, .08, revealProgress) * (1 - smooth(.92, 1, revealProgress));
    updateContactTransition(contactStage, points, screenWidth, screenHeight, time, strength, dt, pointer);
    particles?.render(points, null, time, strength,
      { x: pointer.x, y: pointer.y, strength: pointer.strength, flow, velocities });
  }

  function clear() {
    if (!active) return;
    active = "";
    delete contactStage.dataset.collageReveal;
    contactTransitionField(contactStage).active = false;
    contactContent.style.removeProperty("clip-path");
    contactStage.style.removeProperty("clip-path");
    delete hub.dataset.starGather;
    particles?.clear();
    delete main.dataset.chapterTransition;
    for (const element of elements) {
      element.classList.remove("chapter-held");
      element.style.removeProperty("--chapter-y");
    }
  }

  function hold(element: HTMLElement, y: number) {
    element.classList.add("chapter-held");
    element.style.setProperty("--chapter-y", `${y}px`);
  }

  function update(y = window.scrollY) {
    if (suspended || motion.matches) { clear(); return; }
    const entering = y > positions.entryStart && y < positions.explore;
    const exiting = y > positions.exitStart && y < positions.contact;
    if (!entering && !exiting) { clear(); return; }
    const phase = entering ? "entry" : "exit";
    if (active !== phase) {
      clear();
      active = phase;
      lastFrame = gsap.ticker.time;
      liquid.reset(clamp((y - positions.exitStart) / Math.max(1, positions.contact - positions.exitStart)));
      main.dataset.chapterTransition = phase;
    }
    const start = entering ? positions.entryStart : positions.exitStart;
    const end = entering ? positions.explore : positions.contact;
    const p = clamp((y - start) / Math.max(1, end - start));
    if (entering) {
      // Two seams reveal work from the upper-left and skills from the lower-right.
      // These sticky layers have a negative bottom margin. Translating them by
      // scroll distance double-counts their pin and pushes the scenery away.
      // Their held CSS instead pins the original layers to the viewport.
      hold(careerStage, 0);
      hold(ruler, 0);
      // Transform the existing containing block, not .career-copy: introducing
      // a transform on the copy changes the absolute illustration's container
      // and collapses its computed width to zero on desktop.
      hold(careerLayout, y - start);
      hold(hub, y - end);
      hub.dataset.starGather = p.toFixed(5);
    } else {
      // 保留完整目录作为上一幕，联系页从下向上直接覆盖它。
      hold(hub, y - start);
      hold(contactStage, y - end);
      contactStage.dataset.collageReveal = p.toFixed(5);
      revealProgress = p;
      drawCollage(gsap.ticker.time);
    }
  }

  function refresh() {
    main.style.setProperty("--chapter-entry-background", getComputedStyle(career).backgroundColor);
    if (screenWidth !== innerWidth || screenHeight !== innerHeight) {
      screenWidth = innerWidth; screenHeight = innerHeight;
      particles?.resize(screenWidth, screenHeight);
      liquid.reset(revealProgress);
      const mask = masks.querySelector("#contact-collage-mask")!;
      mask.setAttribute("width", String(screenWidth + 256));
      mask.setAttribute("height", String(screenHeight + 256));
    }
    positions.career = documentTop(career);
    positions.explore = documentTop(explore);
    positions.contact = documentTop(contact);
    positions.entryStart = positions.career + career.offsetHeight - hub.offsetHeight;
    positions.exitStart = positions.explore + explore.offsetHeight - hub.offsetHeight;
    update();
  }
  const observer = new ResizeObserver(refresh);
  for (const element of [career, explore, contact]) observer.observe(element);
  // The collage has its own scroll runway; its height also moves the contact
  // boundary, even when neither neighbouring section changes dimensions.
  main.querySelectorAll(".chapter-gap").forEach(element => observer.observe(element));
  window.addEventListener("resize", refresh);
  window.addEventListener("pointermove", pointerMove, { passive: true, capture: true });
  document.documentElement.addEventListener("pointerleave", pointerLeave);
  window.addEventListener("blur", pointerLeave);
  motion.addEventListener("change", refresh);
  gsap.ticker.add(drawCollage);
  refresh();
  return {
    positions,
    update,
    refresh,
    suspend(value: boolean) {
      suspended = value;
      if (value) clear();
      else update();
    },
    dispose() {
      clear();
      main.style.removeProperty("--chapter-entry-background");
      observer.disconnect();
      window.removeEventListener("resize", refresh);
      window.removeEventListener("pointermove", pointerMove, true);
      document.documentElement.removeEventListener("pointerleave", pointerLeave);
      window.removeEventListener("blur", pointerLeave);
      motion.removeEventListener("change", refresh);
      gsap.ticker.remove(drawCollage);
      particles?.dispose();
      sparkle.remove();
    },
  };
}
