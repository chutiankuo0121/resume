import { useEffect, type RefObject } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";

export function useSkillScroll({ root, content, reader, readingContent, active, category }: {
  root: RefObject<HTMLElement | null>;
  content: RefObject<HTMLDivElement | null>;
  reader: RefObject<HTMLDivElement | null>;
  readingContent: RefObject<HTMLDivElement | null>;
  active: boolean;
  category: string;
}) {
  useEffect(() => {
    if (!active) return;
    const mobile = matchMedia("(max-width: 900px)");
    let dispose: (() => void) | undefined;
    function setup() {
      dispose?.();
      const wrapper = mobile.matches ? root.current : reader.current;
      const scrollContent = mobile.matches ? content.current : readingContent.current;
      if (!wrapper || !scrollContent) return;
      const lenis = new Lenis({
        wrapper,
        content: scrollContent,
        autoRaf: false,
        autoResize: false,
        lerp: 0.12,
        overscroll: false,
        syncTouch: false,
      });
      // 折叠内容变化后只更新尺寸缓存；lenis.resize() 会重置滚动目标、打断惯性。
      const dimensions = new ResizeObserver(() => lenis.dimensions.resize());
      dimensions.observe(wrapper);
      dimensions.observe(scrollContent);
      const tick = (seconds: number) => lenis.raf(seconds * 1000);
      gsap.ticker.add(tick, false, true);
      dispose = () => {
        gsap.ticker.remove(tick);
        dimensions.disconnect();
        lenis.destroy();
      };
    }
    setup();
    mobile.addEventListener("change", setup);
    return () => {
      mobile.removeEventListener("change", setup);
      dispose?.();
    };
  }, [root, content, reader, readingContent, active, category]);
}
