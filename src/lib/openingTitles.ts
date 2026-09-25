import { gsap } from "gsap";

// 破洞延后约三个滚轮刻度；journey 同步延长，保持各阶段的滚动速度。
export const OPENING = {
  crystalStart: 0.5,
  orbitStart: 1.0,
  crystalReading: 1.02,
  exitStart: 2.1,
  portalStart: 2.44,
  portalDuration: .2,
  duration: 2.68,
} as const;

export function addOpeningTitles(timeline: gsap.core.Timeline, stage: HTMLElement) {
  const identity = stage.querySelector<HTMLElement>(".opening-identity-copy")!;
  const phrases = Array.from(stage.querySelectorAll<HTMLElement>(".opening-statement"));
  const context = gsap.context(() => {
    timeline.fromTo(identity,
      { autoAlpha: 1, y: 0, filter: "blur(0px)" },
      { autoAlpha: 0, y: -28, filter: "blur(8px)", duration: 0.1, ease: "sine.in" }, 0.12);

    const starts = [0.78, 1.22, 1.65];
    const exits = [1.1, 1.54, 1.97];
    phrases.forEach((phrase, index) => {
      const letters = Array.from(phrase.querySelectorAll<HTMLElement>(".opening-letter"));
      const subtitle = phrase.querySelector("p")!;
      const start = starts[index];
      // 淡入、停留、淡出彼此分开；无定时播放或滚轮锁，任何中间帧都可倒放。
      timeline.fromTo(phrase, { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.08, ease: "sine.out" }, start);
      timeline.fromTo(subtitle, { opacity: 0, y: 12 },
        { opacity: 0.8, y: 0, duration: 0.09, ease: "sine.out" }, start + 0.12);

      const distance = index === 1 ? 0.48 : index === 2 ? 0.16 : 0.04;
      letters.forEach((letter, position) => {
        timeline.fromTo(letter, {
          // 位移以自身字宽为基准，手机和桌面保持相同的字距节奏。
          xPercent: (position - (letters.length - 1) / 2) * distance * 100,
          yPercent: index === 2 ? 24 : index === 1 ? (position % 2 ? -6 : 6) : 0,
          rotation: index === 1 ? (position % 2 ? 2 : -2) : 0,
          opacity: 0,
          filter: `blur(${index === 0 ? 14 : 6}px)`,
        }, {
          xPercent: 0, yPercent: 0, rotation: 0, opacity: 1,
          filter: "blur(0px)", duration: 0.14, ease: "sine.inOut",
        }, start + position * (index === 2 ? 0.012 : 0.006));
      });
      timeline.to(phrase,
        { autoAlpha: 0, duration: 0.09, ease: "sine.in" }, exits[index]);
    });
  }, stage);
  return () => context.revert();
}
