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
  const careerStage = career.querySelector<HTMLElement>(".career-period:last-child .career-stage")!;
  const ruler = career.querySelector<HTMLElement>(".career-ruler")!;
  const hub = explore.querySelector<HTMLElement>(".hub-stage")!;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const elements = [careerStage, ruler, hub, contact];
  const entryMask = masks.querySelector<SVGPathElement>("[data-curtain='entry']")!;
  const exitMask = masks.querySelector<SVGPathElement>("[data-curtain='exit']")!;
  const inert = new Map<HTMLElement, boolean>();
  let suspended = false, active = "";
  const positions = { career: 0, entryStart: 0, explore: 0, exitStart: 0, contact: 0 };
  // 沿上一版分镜的斜向曲线揭幕；这条曲线只控制磨砂遮罩，不牵动星链。
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

  function revealExit(p: number) {
    const sweep = -.2 + smooth(0, .88, p) * 1.85;
    const line = (x: number) => (.4 * x + .62 - sweep) / .62;
    exitMask.setAttribute("d", `M-.3,${line(-.3)} L1.3,${line(1.3)} L1.3,2 L-.3,2 Z`);
  }

  function clear() {
    if (!active) return;
    active = "";
    delete main.dataset.chapterTransition;
    delete masks.dataset.phase;
    delete masks.dataset.progress;
    for (const element of elements) {
      element.classList.remove("chapter-held", "chapter-reveal-entry", "chapter-reveal-exit", "chapter-contact-reveal");
      for (const property of ["--chapter-y", "--chapter-scale", "--chapter-opacity", "--chapter-blur", "--contact-title", "--contact-body"])
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
      main.dataset.chapterTransition = phase;
    }
    const start = entering ? positions.entryStart : positions.exitStart;
    const end = entering ? positions.explore : positions.contact;
    const p = clamp((y - start) / Math.max(1, end - start));
    // 两个章节同时停留在视口里，由磨砂边缘逐渐交接；进度完全可逆。
    if (entering) {
      const fade = smooth(.16, .72, p);
      const grow = smooth(.06, .54, p);
      hold(careerStage, y - start, 1 / (1 + .08 * grow), 1 - .78 * fade, fade * 9);
      hold(ruler, y - start, 1, 1 - smooth(.06, .5, p), fade * 4);
      hold(hub, y - end, 1 / (1 + .035 * (1 - grow)), 1, 8 * (1 - smooth(.45, 1, p)));
      hub.classList.add("chapter-reveal-entry");
      revealEntry(p);
    } else {
      hold(hub, y - start, 1 / (1 + .03 * smooth(.05, .9, p)), 1, 8 * smooth(.075, .775, p));
      hold(contact, y - end, 1, 1, 7 * (1 - smooth(.325, 1, p)));
      contact.classList.add("chapter-reveal-exit", "chapter-contact-reveal");
      contact.style.setProperty("--contact-title", String(smooth(.325, .88, p)));
      contact.style.setProperty("--contact-body", String(smooth(.5, 1, p)));
      revealExit(p);
    }
    masks.dataset.phase = phase;
    masks.dataset.progress = p.toFixed(4);
  }

  function refresh() {
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
  window.addEventListener("resize", refresh);
  motion.addEventListener("change", refresh);
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
      motion.removeEventListener("change", refresh);
      main.removeAttribute("data-chapter-handoffs");
    },
  };
}
