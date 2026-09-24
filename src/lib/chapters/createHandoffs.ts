import { gsap } from "gsap";
import { createChapterEdge, EDGE_SAMPLES } from "./createChapterEdge";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (from: number, to: number, value: number) => {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};

// Continuous, deterministic noise: both the SVG mask and GPU edge use this
// contour, so the glow cannot drift away from the actual image boundary.
function noise(x: number, y: number) {
  const hash = (a: number, b: number) => {
    const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = smooth(0, 1, x - ix), fy = smooth(0, 1, y - iy);
  const a = hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx;
  const b = hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx;
  return (a * (1 - fy) + b * fy) * 2 - 1;
}

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
  const careerStage = career.querySelector<HTMLElement>(".career-period:last-child .career-stage")!;
  const ruler = career.querySelector<HTMLElement>(".career-ruler")!;
  const hub = explore.querySelector<HTMLElement>(".hub-stage")!;
  const contactStage = contact.querySelector<HTMLElement>(".contact-stage") ?? contact;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const elements = [careerStage, ruler, hub, contactStage];
  const entryMask = masks.querySelector<SVGPathElement>("[data-curtain='entry']")!;
  const collageMask = masks.querySelector<SVGPathElement>("[data-curtain='collage']")!;
  const sparkle = document.createElement("canvas");
  sparkle.className = "chapter-edge-sparkle";
  sparkle.setAttribute("aria-hidden", "true");
  main.appendChild(sparkle);
  let particles: ReturnType<typeof createChapterEdge> | undefined;
  try { particles = createChapterEdge(sparkle); } catch { /* The image reveal still works without the decorative glow. */ }
  let screenWidth = 0, screenHeight = 0, revealProgress = 0;
  const pointer = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, strength: 0, targetStrength: 0 };
  const points = Array.from({ length: EDGE_SAMPLES }, () => ({ x: 0, y: 0 }));
  let lastFrame = 0, lastScroll = window.scrollY, flow = 0;
  function pointerMove(event: PointerEvent) {
    if (event.pointerType === "touch") return;
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    pointer.targetStrength = 1;
  }
  function pointerLeave() { pointer.targetStrength = 0; }
  const inert = new Map<HTMLElement, boolean>();
  let suspended = false, active = "";
  const positions = { career: 0, entryStart: 0, explore: 0, exitStart: 0, contact: 0 };
  // 斜向曲线只控制磨砂遮罩，星链在探索目录中独立流动。
  const edge = Array.from({ length: 65 }, (_, i) => {
    const x = i / 64;
    return { x, y: .91 - .78 * x - .042 * Math.sin(x * Math.PI * 2) + .027 * Math.sin(x * 13.2) };
  });

  function revealEntry(p: number) {
    const width = smooth(.34, 1, p) * 1.15;
    const upper = edge.map(({ x, y }) => `${x},${y - width}`);
    const lower = edge.map(({ x, y }) => `${x},${y + width}`).reverse();
    // 路径延伸到屏幕外，羽化时不会在四周留出灰色细边。
    entryMask.setAttribute("d", `M-.3,${edge[0].y - width} L${upper.join(" L")} L1.3,${edge[64].y - width} L1.3,${edge[64].y + width} L${lower.join(" L")} L-.3,${edge[0].y + width} Z`);
  }

  function drawCollage(time: number) {
    if (active !== "exit" || document.hidden) return;
    const dt = Math.min(.05, Math.max(0, time - lastFrame));
    lastFrame = time;
    const follow = 1 - Math.exp(-dt * 9);
    pointer.x += (pointer.targetX - pointer.x) * follow;
    pointer.y += (pointer.targetY - pointer.y) * follow;
    pointer.strength += (pointer.targetStrength - pointer.strength) * follow;
    if (dt > 0) {
      const speed = Math.min(1, Math.abs(window.scrollY - lastScroll) / dt / 1400);
      flow += (speed - flow) * (1 - Math.exp(-dt * (speed > flow ? 14 : 3)));
      lastScroll = window.scrollY;
    }
    // Track scrolling directly: the seam enters at the bottom and travels up.
    const sweep = revealProgress;
    for (let i = 0; i < EDGE_SAMPLES; i++) {
      const x = i / (EDGE_SAMPLES - 1);
      const px = x * screenWidth;
      const contour = Math.sin(x * 8 + .4) * 20
        + noise(x * 5 + time * .065, time * .22) * 32
        + noise(x * 14 - time * .12, time * .32 + 8) * 14
        + noise(px * .042 + time * .25, time * .55) * (4 + flow * 3)
        + noise(px * .19, time * .7) * 1.6;
      const baseY = screenHeight + 96 - sweep * (screenHeight + 192) + contour;
      const proximity = Math.exp(-Math.pow((px - pointer.x) / 105, 2)
        - Math.pow((baseY - pointer.y) / 135, 2)) * pointer.strength;
      points[i].x = px;
      points[i].y = baseY + proximity * Math.tanh((pointer.y - baseY) / 45) * 24;
    }
    // Reveal below the seam. The outgoing page remains fully visible above it,
    // so the two compositions meet directly instead of fading through paper.
    collageMask.setAttribute("d", `M-128,${screenHeight + 128} L${screenWidth + 128},${screenHeight + 128} L${screenWidth + 128},${points.at(-1)!.y} L${[...points].reverse().map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" L")} L-128,${points[0].y} Z`);
    particles?.render(points, null, time, smooth(0, .08, revealProgress) * (1 - smooth(.92, 1, revealProgress)),
      { x: pointer.x, y: pointer.y, strength: pointer.strength, flow });
  }

  function clear() {
    if (!active) return;
    active = "";
    delete contactStage.dataset.collageReveal;
    particles?.clear();
    delete main.dataset.chapterTransition;
    for (const element of elements) {
      element.classList.remove("chapter-held", "chapter-reveal-entry", "chapter-reveal-exit", "chapter-contact-reveal");
      for (const property of ["--chapter-y", "--chapter-scale", "--chapter-opacity", "--chapter-blur", "--chapter-overscan", "--contact-title", "--contact-body"])
        element.style.removeProperty(property);
    }
    for (const [element, previous] of inert) element.inert = previous;
    inert.clear();
  }

  function hold(element: HTMLElement, y: number, scale = 1, opacity = 1, blur = 0) {
    element.classList.add("chapter-held");
    element.style.setProperty("--chapter-y", `${y}px`);
    element.style.setProperty("--chapter-scale", String(scale));
    element.style.setProperty("--chapter-opacity", String(opacity));
    element.style.setProperty("--chapter-blur", `${blur}px`);
    if (!inert.has(element)) inert.set(element, element.inert);
    element.inert = true;
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
      lastScroll = y;
      flow = 0;
      main.dataset.chapterTransition = phase;
    }
    const start = entering ? positions.entryStart : positions.exitStart;
    const end = entering ? positions.explore : positions.contact;
    const p = clamp((y - start) / Math.max(1, end - start));
    if (entering) {
      const fade = smooth(.16, .72, p);
      const grow = smooth(.06, .54, p);
      hold(careerStage, y - start, 1 / (1 + .08 * grow), 1 - .78 * fade, fade * 9);
      hold(ruler, y - start, 1, 1 - smooth(.06, .5, p), fade * 4);
      hold(hub, y - end, 1 / (1 + .035 * (1 - grow)), 1, 8 * (1 - smooth(.45, 1, p)));
      hub.classList.add("chapter-reveal-entry");
      revealEntry(p);
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
    if (screenWidth !== innerWidth || screenHeight !== innerHeight) {
      screenWidth = innerWidth; screenHeight = innerHeight;
      particles?.resize(screenWidth, screenHeight);
      const mask = masks.querySelector("#contact-collage-mask")!;
      mask.setAttribute("width", String(screenWidth + 256));
      mask.setAttribute("height", String(screenHeight + 256));
    }
    // React 管理 main 的 className；独立属性不会在章节状态更新时被覆盖。
    main.toggleAttribute("data-chapter-handoffs", !motion.matches);
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
      observer.disconnect();
      window.removeEventListener("resize", refresh);
      window.removeEventListener("pointermove", pointerMove, true);
      document.documentElement.removeEventListener("pointerleave", pointerLeave);
      window.removeEventListener("blur", pointerLeave);
      motion.removeEventListener("change", refresh);
      main.removeAttribute("data-chapter-handoffs");
      gsap.ticker.remove(drawCollage);
      particles?.dispose();
      sparkle.remove();
    },
  };
}
