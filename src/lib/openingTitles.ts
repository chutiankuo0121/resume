import { gsap } from "gsap";

// 三幕黑洞读完再推进镜头；后续晶体与破洞整体顺延，保留原有运镜速度。
const STORY_EXTENSION = 0.62;
export const OPENING = {
  approachStart: 0.22 + STORY_EXTENSION,
  crystalStart: 0.5 + STORY_EXTENSION,
  lightStart: 0.58 + STORY_EXTENSION,
  orbitStart: 1.0 + STORY_EXTENSION,
  crystalReading: 1.02 + STORY_EXTENSION,
  exitStart: 2.1 + STORY_EXTENSION,
  portalStart: 2.39 + STORY_EXTENSION,
  portalDuration: 0.2,
  duration: 2.63 + STORY_EXTENSION,
} as const;

const BEATS = [
  { enter: 0, leave: 0.19 },
  { enter: 0.28, leave: 0.47 },
  { enter: 0.56, leave: 0.75 },
  { enter: OPENING.crystalStart + 0.28, leave: OPENING.crystalStart + 0.6 },
  { enter: OPENING.crystalStart + 0.72, leave: OPENING.crystalStart + 1.04 },
  { enter: OPENING.crystalStart + 1.15, leave: OPENING.crystalStart + 1.47 },
] as const;

/** 字体加载后只测量一次；容器单位处理后续缩放，不在滚动时读取布局。 */
export function fitOpeningTitles(stage: HTMLElement) {
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return;
  const measurements = Array.from(stage.querySelectorAll<HTMLElement>(".opening-beat"), beat => {
    let widthInEm = 0;
    const fragments = beat.querySelectorAll<HTMLElement>(".opening-fragment");
    const lines = fragments.length ? fragments : beat.querySelectorAll<HTMLElement>(".opening-chinese, .opening-translation");
    lines.forEach(line => {
      const style = getComputedStyle(line);
      const text = line.textContent ?? "";
      context.font = `${style.fontWeight} 100px ${style.fontFamily}`;
      const tracking = (parseFloat(style.letterSpacing) || 0) / parseFloat(style.fontSize);
      widthInEm = Math.max(widthInEm, context.measureText(text).width / 100 + tracking * text.length);
    });
    // 留少量余量，避免不同像素密度下末尾标点被裁掉。
    return { beat, lineEm: Math.max(1, widthInEm * 1.02) };
  });
  // 晶体三幕共用最长中文行的尺寸，切换文案时字号保持一致。
  const crystalLineEm = Math.max(1, ...measurements
    .filter(({ beat }) => beat.dataset.world === "crystal")
    .map(({ lineEm }) => lineEm));
  measurements.forEach(({ beat, lineEm }) => {
    beat.style.setProperty("--opening-line-em", String(beat.dataset.world === "crystal" ? crystalLineEm : lineEm));
  });
}

export function addOpeningTitles(timeline: gsap.core.Timeline, stage: HTMLElement) {
  // CSS 锚点留在外层；动画只改内层，旋转手机或改变宽度时不会缓存旧锚点。
  const beats = Array.from(stage.querySelectorAll<HTMLElement>(".opening-beat-copy"));
  const context = gsap.context(() => {
    beats.forEach((beat, index) => {
      const timing = BEATS[index];
      if (index === 0) {
        timeline.set(beat, { autoAlpha: 1, y: 0 }, 0);
      } else {
        timeline.fromTo(beat,
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.08, ease: "sine.out" },
          timing.enter);
      }
      // 淡入、阅读、淡出、短暂留白；不交叠两幕，反向滚动沿同一轨迹回放。
      timeline.to(beat,
        { autoAlpha: 0, y: -8, duration: 0.065, ease: "sine.in" },
        timing.leave);
    });
  }, stage);
  return () => context.revert();
}
