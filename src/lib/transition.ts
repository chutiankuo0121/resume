import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createCareerTimeline } from "./createCareerTimeline";
import { addOpeningTitles, OPENING } from "./openingTitles";
import { createChapterHandoffs } from "./chapters/createHandoffs";
import { axisChapters, createChapterAxis } from "./chapters/createChapterAxis";

export type Chapter = "intro" | "crystal" | "career" | "explore" | "contact";

export type TransitionState = {
  progress: number;
  holeApproach: number;
  crystalReveal: number;
  pointerWeight: number;
  crystalEntry: number;
  cameraTravel: number;
  cameraOrbit: number;
  lightReveal: number;
  focus: number;
  exit: number;
  portalReveal: number;
};
export type FrameClock = {
  subscribe: (callback: (timestamp: number) => void) => () => void;
};
const CRYSTAL_START = OPENING.crystalStart;
const DURATION = OPENING.duration;

export function createTransitionTimeline(
  root: HTMLElement,
  stage: HTMLElement,
  axis: HTMLElement,
  careerRoot: HTMLElement,
  exploreRoot: HTMLElement,
  contactRoot: HTMLElement,
  chapterMasks: SVGSVGElement,
  onChapterChange: (chapter: Chapter) => void,
) {
  gsap.registerPlugin(ScrollTrigger);
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const previousCareerInert = careerRoot.inert;
  const state: TransitionState = {
    progress: 0,
    holeApproach: 0,
    crystalReveal: 0,
    pointerWeight: 1,
    crystalEntry: 0,
    cameraTravel: 0,
    cameraOrbit: 0,
    lightReveal: 0,
    focus: 0,
    exit: 0,
    portalReveal: 0,
  };
  const lenis = new Lenis({
    autoRaf: false,
    lerp: 0.08,
    syncTouch: false,
    smoothWheel: !media.matches,
  });
  // 全部阶段由滚动进度决定，正向和反向滚动严格对称。
  const timeline = gsap.timeline({ paused: true, defaults: { ease: "none" } });
  timeline
    .to(state, { progress: 1, duration: DURATION }, 0)
    // 时间线 0～0.22 留给序章文字；推进时收回鼠标偏移，对准洞口中心。
    .to(state, { pointerWeight: 0, duration: 0.12, ease: "sine.inOut" }, 0.22)
    .to(state, { holeApproach: 1, duration: 0.24, ease: "power2.in" }, 0.22)
    // 0.46～0.5 保持黑场，两幅画面不交叉叠化；随后才显露晶石。
    .to(
      state,
      { crystalReveal: 1, duration: 0.2, ease: "sine.out" },
      CRYSTAL_START,
    )
    .to(
      state,
      { crystalEntry: 1, duration: 0.37, ease: "sine.inOut" },
      CRYSTAL_START,
    )
    .to(state, { cameraTravel: 1, duration: OPENING.orbitStart - CRYSTAL_START }, CRYSTAL_START)
    .to(state, { cameraOrbit: 1, duration: OPENING.exitStart - OPENING.orbitStart }, OPENING.orbitStart)
    .to(state, { lightReveal: 1, duration: 0.32, ease: "sine.inOut" }, 0.58)
    // 晶石只剩视野边缘时开始破洞，与原始退出运镜的末段重叠。
    .to(state, { focus: 1, duration: 0.18, ease: "sine.inOut" }, OPENING.exitStart)
    .to(state, { exit: 1, duration: 0.48 }, OPENING.exitStart)
    .to(state, { portalReveal: 1, duration: OPENING.portalDuration }, OPENING.portalStart);
  const disposeTitles = addOpeningTitles(timeline, stage);
  let chapter: Chapter | undefined;
  let trigger: ScrollTrigger | undefined;
  const chapterAxis = createChapterAxis(axis);
  function publish() {
    handoffs.update();
    const portal = !media.matches && state.exit > 0;
    const careerStart = handoffs.positions.career;
    const arriving = portal && window.scrollY < careerStart;
    root.toggleAttribute("data-crystal-exit", portal);
    careerRoot.classList.toggle("career-arriving", arriving);
    careerRoot.style.setProperty("--timeline-reveal", media.matches || portal ? "1" : "0");
    careerRoot.style.setProperty("--arrival-y", `${Math.min(0, window.scrollY - careerStart)}px`);
    const settle = gsap.utils.clamp(0, 1, (state.portalReveal - .2) / .65);
    careerRoot.style.setProperty("--arrival-focus", String(1 - settle * settle * (3 - 2 * settle)));
    careerRoot.inert = previousCareerInert || (!media.matches && state.portalReveal < 1);
    // 提示随入洞退场，晶石显露时回来；终点不再提示向下滚动。
    const hintVisibility =
      state.progress * DURATION < CRYSTAL_START
        ? 1 - state.holeApproach
        : state.crystalReveal;
    stage.style.setProperty(
      "--scroll-hint-opacity",
      String(hintVisibility * (1 - state.focus)),
    );
    const { entryStart, explore: exploreStart, exitStart, contact: contactStart } = handoffs.positions;
    const inContact = window.scrollY >= contactStart - 1;
    const inExplore = window.scrollY >= exploreStart - 1;
    const inCareer = window.scrollY >= careerStart - 1;
    const settledChapter = inContact
      ? "contact"
      : inExplore
        ? "explore"
        : inCareer
          ? "career"
          : state.progress * DURATION < CRYSTAL_START
            ? "intro"
            : "crystal";
    const clamp = gsap.utils.clamp(0, 1);
    const range = (start: number, end: number) => clamp((window.scrollY - start) / Math.max(1, end - start));
    // Use the scene's own camera/portal progress and the exact chapter handoff
    // ranges. Adjacent sections share one unit of expansion at every frame.
    const crystal = state.cameraTravel;
    const journey = state.portalReveal;
    const explore = range(entryStart, exploreStart);
    const contact = range(exitStart, contactStart);
    const openness = media.matches
      ? axisChapters.map(id => Number(id === settledChapter))
      : [1 - crystal, crystal * (1 - journey), journey * (1 - explore), explore * (1 - contact), contact];
    const time = state.progress * DURATION;
    chapterAxis.update(openness, [
      clamp(time / CRYSTAL_START),
      clamp((time - CRYSTAL_START) / (OPENING.portalStart - CRYSTAL_START)),
      range(careerStart, entryStart),
      range(exploreStart, exitStart),
      range(contactStart, contactStart + contactRoot.offsetHeight - window.innerHeight),
    ]);
    // aria-current follows the dominant chapter; it no longer triggers animation.
    const next = axisChapters[openness.indexOf(Math.max(...openness))];
    if (next !== chapter) {
      chapter = next;
      onChapterChange(next);
    }
  }
  const career = createCareerTimeline(careerRoot);
  const handoffs = createChapterHandoffs(careerRoot, exploreRoot, contactRoot, chapterMasks);
  ScrollTrigger.addEventListener("refresh", handoffs.refresh);
  function configure() {
    trigger?.kill();
    root.classList.toggle("reduced-journey", media.matches);
    if (media.matches) {
      timeline.time(OPENING.crystalReading);
      publish();
    } else {
      trigger = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          timeline.progress(self.progress);
          publish();
        },
        onRefresh: (self) => {
          timeline.progress(self.progress);
          publish();
        },
      });
      timeline.progress(trigger.progress);
      publish();
    }
    lenis.options.smoothWheel = !media.matches;
    lenis.resize();
    ScrollTrigger.refresh();
  }
  configure();
  media.addEventListener("change", configure);
  lenis.on("scroll", () => {
    ScrollTrigger.update();
    publish();
  });
  // Lenis、滚动状态和 WebGL 共用一个时钟，避免各自 RAF 导致帧间错位。
  const callbacks = new Set<(timestamp: number) => void>();
  const tick = (seconds: number) => {
    lenis.raf(seconds * 1000);
    callbacks.forEach((callback) => callback(seconds * 1000));
  };
  gsap.ticker.add(tick);
  let prepareOpening: gsap.core.Tween | undefined;
  const clock: FrameClock = {
    subscribe(callback) {
      callbacks.add(callback);
      return () => {
        callbacks.delete(callback);
      };
    },
  };
  return {
    state,
    clock,
    setExploring: handoffs.suspend,
    prepareExploreOpen(complete: () => void) {
      const y = window.scrollY;
      const { entryStart, explore, exitStart, contact } = handoffs.positions;
      const exiting = y > exitStart && y < contact;
      const entering = y > entryStart && y < explore;
      if (media.matches || (!exiting && !entering)) { complete(); return; }
      // Drive the existing scroll-owned seam to its endpoint before suspending
      // it. Contact retreats downward; an arriving directory finishes gathering.
      lenis.stop();
      const position = { y };
      const destination = exiting ? Math.floor(exitStart) : Math.ceil(explore);
      const remaining = exiting ? (y-exitStart)/(contact-exitStart) : (explore-y)/(explore-entryStart);
      prepareOpening?.kill();
      const tween = gsap.to(position, {
        y: destination,
        duration: .45 + .35 * Math.sqrt(remaining),
        ease: "power2.inOut",
        onUpdate: () => {
          lenis.scrollTo(position.y, { immediate: true, force: true });
          ScrollTrigger.update();
          publish();
        },
        onComplete: () => {
          prepareOpening = undefined;
          complete();
        },
      });
      prepareOpening = tween;
      return () => {
        tween.kill();
        if (prepareOpening === tween) prepareOpening = undefined;
      };
    },
    prepareExploreReturn() {
      // Remain paused and keep chapter masks cleared until the fixed view closes.
      handoffs.suspend(true);
      handoffs.refresh();
      lenis.scrollTo(Math.ceil(handoffs.positions.explore), { immediate: true, force: true });
      ScrollTrigger.update();
      publish();
    },
    // 查看作品时暂停页面惯性；弹窗内部使用原生滚动和媒体控件。
    setPaused(paused: boolean) {
      if (paused) lenis.stop();
      else lenis.start();
    },
    scrollTo(position: number) {
      // 拖动与键盘定位直接同步 Lenis，终止尚未结束的惯性，避免滑块回弹。
      lenis.scrollTo(position, { immediate: true });
    },
    seek(chapter: Chapter, immediate = false) {
      if (immediate) handoffs.refresh();
      if (chapter === "contact" || chapter === "explore") {
        const start = handoffs.positions[chapter];
        lenis.scrollTo(start, { duration: media.matches ? 0 : 2.4, lerp: 0, immediate });
        return;
      }
      if (chapter === "career") {
        const start = careerRoot.getBoundingClientRect().top + window.scrollY;
        // 直接落到第一段已有内容的位置，保留正常滚动时的留白开场。
        lenis.scrollTo(
          start +
            (media.matches || window.innerWidth < 800
              ? 0
              : window.innerHeight * 0.75),
          { duration: 2.4, lerp: 0, immediate },
        );
        return;
      }
      if (media.matches) {
        lenis.scrollTo(0, { immediate: true });
        return;
      }
      if (!trigger) return;
      const end = chapter === "crystal";
      lenis.scrollTo(
        end
          ? trigger.start + (trigger.end - trigger.start) * OPENING.crystalReading / DURATION
          : trigger.start,
        {
          duration: end ? 2.4 : 2,
          lerp: 0,
          immediate,
        },
      );
    },
    dispose() {
      prepareOpening?.kill();
      gsap.ticker.remove(tick);
      callbacks.clear();
      media.removeEventListener("change", configure);
      trigger?.kill();
      disposeTitles();
      timeline.kill();
      career.dispose();
      ScrollTrigger.removeEventListener("refresh", handoffs.refresh);
      handoffs.dispose();
      chapterAxis.dispose();
      root.removeAttribute("data-crystal-exit");
      careerRoot.classList.remove("career-arriving");
      careerRoot.style.removeProperty("--arrival-y");
      careerRoot.style.removeProperty("--arrival-focus");
      careerRoot.style.removeProperty("--timeline-reveal");
      careerRoot.inert = previousCareerInert;
      lenis.destroy();
    },
  };
}
