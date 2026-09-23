import { createChapterMist } from "./mist";

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
  canvas: HTMLCanvasElement,
) {
  const main = explore.closest<HTMLElement>(".astra")!;
  const careerStage = career.querySelector<HTMLElement>(".career-period:last-child .career-stage")!;
  const ruler = career.querySelector<HTMLElement>(".career-ruler")!;
  const hub = explore.querySelector<HTMLElement>(".hub-stage")!;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const elements = [careerStage, ruler, hub, contact];
  const inert = new Map<HTMLElement, boolean>();
  let mist: ReturnType<typeof createChapterMist> | undefined;
  let graphicsFailed = false, suspended = false, active = "";
  const positions = { career: 0, entryStart: 0, explore: 0, exitStart: 0, contact: 0 };

  function clear() {
    if (!active) return;
    active = "";
    canvas.style.visibility = "hidden";
    canvas.style.backdropFilter = "none";
    delete canvas.dataset.phase;
    delete canvas.dataset.progress;
    for (const element of elements) {
      element.classList.remove("chapter-held", "chapter-covered", "chapter-contact-reveal");
      for (const property of ["--chapter-y", "--chapter-scale", "--contact-title", "--contact-body"])
        element.style.removeProperty(property);
    }
    for (const [element, previous] of inert) element.inert = previous;
    inert.clear();
  }

  function hold(element: HTMLElement, y: number, scale: number, hidden: boolean) {
    element.classList.add("chapter-held");
    element.classList.toggle("chapter-covered", hidden);
    element.style.setProperty("--chapter-y", `${y}px`);
    element.style.setProperty("--chapter-scale", String(scale));
    if (!inert.has(element)) inert.set(element, element.inert);
    element.inert = true;
  }

  function update(y = window.scrollY) {
    if (suspended || motion.matches) { clear(); return; }
    // 接近经历末尾才分配雾幕上下文；普通浏览、游戏和后台都没有新增逐帧循环。
    if (!mist && !graphicsFailed && y > positions.entryStart - innerHeight && y < positions.contact) {
      try { mist = createChapterMist(canvas); }
      catch { graphicsFailed = true; }
    }
    const entering = y > positions.entryStart && y < positions.explore;
    const exiting = y > positions.exitStart && y < positions.contact;
    if (!entering && !exiting) { clear(); return; }
    const phase = entering ? "entry" : "exit";
    if (active !== phase) { clear(); active = phase; }
    const start = entering ? positions.entryStart : positions.exitStart;
    const end = entering ? positions.explore : positions.contact;
    const p = clamp((y - start) / Math.max(1, end - start));
    // 两个真实章节只在纯黑区间换位；整个过程可逆，没有完成回调锁住滚轮。
    const covered = p >= 0.5;
    const retreat = smooth(0, .42, p);
    if (entering) {
      hold(careerStage, y - start, 1 - retreat * .025, covered);
      hold(ruler, y - start, 1, covered);
      hold(hub, y - end, 1 + .025 * (1 - smooth(.55, 1, p)), !covered);
    } else {
      hold(hub, y - start, 1 - retreat * .025, covered);
      hold(contact, y - end, 1, !covered);
      contact.classList.add("chapter-contact-reveal");
      contact.style.setProperty("--contact-title", String(smooth(.79, .94, p)));
      contact.style.setProperty("--contact-body", String(smooth(.88, 1, p)));
    }
    canvas.dataset.phase = phase;
    canvas.dataset.progress = p.toFixed(4);
    canvas.style.visibility = "visible";
    const blur = 7 * Math.sin(Math.PI * Math.min(smooth(0, .43, p), 1 - smooth(.55, 1, p)));
    canvas.style.backdropFilter = blur > .1 ? `blur(${blur.toFixed(2)}px)` : "none";
    if (mist) mist.draw(p, exiting);
    else {
      // 图形上下文不可用时仍完成遮蔽与交接，不能把访客留在黑场或不可点击状态。
      const alpha = Math.min(smooth(0, .43, p), 1 - smooth(exiting ? .80 : .55, 1, p));
      const light = exiting ? smooth(.54, .80, p) : 0;
      canvas.style.background = `rgba(${238 * light},${238 * light},${233 * light},${alpha})`;
    }
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
      mist?.dispose();
    },
  };
}
