import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** 正文始终保留完整文档高度，滚动仅负责轻量入场和配图视差。 */
export function createCareerTimeline(root: HTMLElement) {
  const media = gsap.matchMedia();
  media.add("(min-width: 800px) and (prefers-reduced-motion: no-preference)", () => {
    root.querySelectorAll<HTMLElement>(".career-period").forEach(period => {
      const copy = period.querySelector<HTMLElement>(".career-copy")!;
      const visual = period.querySelector<HTMLElement>(".career-visual")!;
      gsap.fromTo(copy, { y: 24, opacity: 0 }, {
        y: 0, opacity: 1, ease: "none",
        scrollTrigger: { trigger: period, start: "top 95%", end: "top 65%", scrub: true, invalidateOnRefresh: true },
      });
      gsap.fromTo(visual, { y: 26 }, {
        y: -20, ease: "none",
        scrollTrigger: { trigger: period, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
      });
    });
  });
  // 字体改变正文换行后重新量取章节位置，保持段落、配图和前后转场一致。
  const refresh = () => ScrollTrigger.refresh();
  document.fonts.addEventListener("loadingdone", refresh);
  return { dispose() { document.fonts.removeEventListener("loadingdone", refresh); media.revert(); } };
}
