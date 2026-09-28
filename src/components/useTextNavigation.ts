import { useLayoutEffect, useRef } from "react";

/** 共用一条细线标记当前项；窄屏只滚动导航本身。 */
export function useTextNavigation(activeIndex: number) {
  const track = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = track.current;
    if (!element) return;
    const buttons = element.querySelectorAll("button");
    const active = buttons[activeIndex];
    const viewport = element.parentElement;
    if (!active || !viewport) return;

    function position() {
      const left = active.offsetLeft, width = active.offsetWidth;
      const bounds = active.getBoundingClientRect();
      const visible = viewport!.getBoundingClientRect();
      const scrollLeft = viewport!.scrollLeft;
      element!.style.setProperty("--nav-x", `${left}px`);
      element!.style.setProperty("--nav-width", String(width));
      element!.style.setProperty("--nav-opacity", "1");
      // 切换横竖屏或字体加载后，当前分类仍需留在可见的导航区域。
      if (bounds.left < visible.left || bounds.right > visible.right) {
        viewport!.scrollTo({
          left: scrollLeft + (bounds.left < visible.left
            ? bounds.left - visible.left : bounds.right - visible.right),
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
      }
    }
    position();
    const observer = new ResizeObserver(position);
    observer.observe(element);
    observer.observe(viewport);
    buttons.forEach(button => observer.observe(button));
    return () => observer.disconnect();
  }, [activeIndex]);
  return track;
}
