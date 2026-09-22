import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** 每段独立占用滚动距离；所有图层由同一进度求值，反滚动自然还原。 */
export function createCareerTimeline(root: HTMLElement) {
  const media = gsap.matchMedia();
  media.add(
    "(min-width: 800px) and (prefers-reduced-motion: no-preference)",
    () => {
      const periods = root.querySelectorAll<HTMLElement>(".career-period");
      periods.forEach((period) => {
        const intro = period.querySelector<HTMLElement>(".career-intro")!;
        const story = period.querySelector<HTMLElement>(".career-story")!;
        const visual = period.querySelector<HTMLElement>(".career-visual")!;
        const background =
          period.querySelector<HTMLElement>(".career-background")!;
        // 延续原站 Main Event / Event 的分层时序：简介先出现，正文和图片跟进。
        // vh 位移只负责运镜感，字体仍采用固定 CSS px。
        const sequence = gsap.timeline({
          paused: true,
          defaults: { ease: "none" },
        });
        sequence
          .fromTo(intro, { y: "40vh", opacity: 0 }, { y: 0, duration: 10 }, 0)
          .to(intro, { opacity: 1, duration: 0.767 }, 0)
          .fromTo(
            story,
            { y: "58vh", opacity: 0 },
            { y: "-1vh", duration: 10 },
            0,
          )
          .to(story, { opacity: 1, duration: 0.766 }, 1.367)
          .fromTo(
            visual,
            { y: "74vh", opacity: 0 },
            { y: "-12vh", duration: 10 },
            0,
          )
          .to(visual, { opacity: 1, duration: 0.767 }, 1.133);
        function draw(progress: number) {
          sequence.progress(progress);
          // 原站背景使用 top bottom → bottom top 的整段进度。
          // 三屏高的章节停留时，局部 0～1 正好对应整段的 0.25～0.75。
          const sectionProgress = 0.25 + progress * 0.5;
          background.style.opacity = String(
            Math.max(0, 0.125 - (sectionProgress - 0.5) ** 2 * 2),
          );
        }
        ScrollTrigger.create({
          trigger: period,
          start: "top top",
          end: "bottom bottom",
          invalidateOnRefresh: true,
          onUpdate: ({ progress }) => draw(progress),
          onRefresh: (self) => {
            sequence.invalidate();
            draw(self.progress);
          },
        });
      });
      // matchMedia 自动回收时间线和 ScrollTrigger；手写样式也在断点切换时归还 CSS。
      return () => {
        root
          .querySelectorAll<HTMLElement>(".career-background")
          .forEach((element) => {
            element.style.removeProperty("opacity");
          });
      };
    },
  );
  return { dispose: () => media.revert() };
}
