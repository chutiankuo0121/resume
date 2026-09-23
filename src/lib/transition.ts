import Lenis from "lenis";
import { elimarPaperReveal } from "./elimarExit";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createCareerTimeline } from "./createCareerTimeline";
import { addOpeningTitles, OPENING } from "./openingTitles";
import { createChapterHandoffs } from "./chapters/createHandoffs";

export type Chapter = "intro" | "crystal" | "career" | "explore" | "contact";

export type TransitionState = {
  progress: number;
  holeApproach: number;
  crystalReveal: number;
  pointerWeight: number;
  crystalEntry: number;
  cameraTravel: number;
  lightReveal: number;
  focus: number;
  exit: number;
  whiteout: number;
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
  const state: TransitionState = {
    progress: 0,
    holeApproach: 0,
    crystalReveal: 0,
    pointerWeight: 1,
    crystalEntry: 0,
    cameraTravel: 0,
    lightReveal: 0,
    focus: 0,
    exit: 0,
    whiteout: 0,
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
    .to(state, { cameraTravel: 1, duration: 0.5 }, CRYSTAL_START)
    .to(state, { lightReveal: 1, duration: 0.32, ease: "sine.inOut" }, 0.58)
    // 晶石停留承载三组大字；最后一组消隐后，才进入原站的擦出轨迹。
    .to(state, { focus: 1, duration: 0.18, ease: "sine.inOut" }, OPENING.exitStart)
    .to(state, { exit: 1, duration: 0.48 }, OPENING.exitStart);
  const disposeTitles = addOpeningTitles(timeline, stage);
  let chapter: Chapter | undefined;
  let trigger: ScrollTrigger | undefined;
  function publish() {
    handoffs.update();
    state.whiteout = elimarPaperReveal(state.exit);
    // 白页与场景最后一屏重叠；只在白场完成时显露内容，避免白色方块提前上推。
    careerRoot.style.setProperty(
      "--timeline-reveal",
      String(
        media.matches
          ? 1
          : gsap.utils.clamp(0, 1, (state.whiteout - 0.97) / 0.03),
      ),
    );
    // 提示随入洞退场，晶石显露时回来；终点不再提示向下滚动。
    const hintVisibility =
      state.progress * DURATION < CRYSTAL_START
        ? 1 - state.holeApproach
        : state.crystalReveal;
    stage.style.setProperty(
      "--scroll-hint-opacity",
      String(hintVisibility * (1 - state.focus)),
    );
    const { career: careerStart, explore: exploreStart, contact: contactStart } = handoffs.positions;
    const inContact = window.scrollY >= contactStart - 1;
    const inExplore = window.scrollY >= exploreStart - 1;
    const inCareer = window.scrollY >= careerStart - 1;
    const next = inContact
      ? "contact"
      : inExplore
        ? "explore"
        : inCareer
          ? "career"
          : state.progress * DURATION < CRYSTAL_START
            ? "intro"
            : "crystal";
    const progress = inContact
      ? gsap.utils.clamp(
          0,
          1,
          (window.scrollY - contactStart) /
            Math.max(1, contactRoot.offsetHeight - window.innerHeight),
        )
      : inExplore
        ? gsap.utils.clamp(
            0,
            1,
            (window.scrollY - exploreStart) /
              Math.max(1, exploreRoot.offsetHeight - window.innerHeight),
          )
        : inCareer
          ? gsap.utils.clamp(
              0,
              1,
              (window.scrollY - careerStart) /
                Math.max(1, careerRoot.offsetHeight - window.innerHeight),
            )
          : next === "intro"
            ? (state.progress * DURATION) / CRYSTAL_START
            : (state.progress * DURATION - CRYSTAL_START) /
              (DURATION - CRYSTAL_START);
    // 连续进度直接写 CSS，仅跨章节时更新 React，避免滚动中反复渲染组件。
    axis.style.setProperty("--chapter-progress", String(progress));
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
      gsap.ticker.remove(tick);
      callbacks.clear();
      media.removeEventListener("change", configure);
      trigger?.kill();
      disposeTitles();
      timeline.kill();
      career.dispose();
      ScrollTrigger.removeEventListener("refresh", handoffs.refresh);
      handoffs.dispose();
      lenis.destroy();
    },
  };
}
