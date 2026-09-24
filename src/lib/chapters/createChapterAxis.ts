import type { Chapter } from "../transition";

export const axisChapters: Chapter[] = ["intro", "crystal", "career", "explore", "contact"];

/** No independent tween: a stopped/reversed handoff must stop/reverse the rail. */
export function createChapterAxis(axis: HTMLElement) {
  const links = axisChapters.map(id => axis.querySelector<HTMLElement>(`[data-chapter="${id}"]`)!);
  let disposed = false;
  function measure() {
    for (const link of links) {
      const style = getComputedStyle(link);
      const label = link.querySelector<HTMLElement>(":scope > .axis-label")!;
      const width = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
        + 22 + parseFloat(style.columnGap) + label.scrollWidth;
      link.style.setProperty("--axis-expanded-size", `${Math.ceil(width)}px`);
    }
  }
  const observer = new ResizeObserver(measure);
  observer.observe(axis);
  document.fonts.addEventListener("loadingdone", measure);
  void document.fonts.ready.then(() => { if (!disposed) measure(); });
  measure();
  return {
    update(openness: number[], progress: number[]) {
      links.forEach((link, index) => {
        link.style.setProperty("--axis-open", openness[index].toFixed(5));
        link.style.setProperty("--chapter-progress", progress[index].toFixed(5));
      });
    },
    dispose() {
      disposed = true;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", measure);
      for (const link of links) {
        for (const name of ["--axis-open", "--axis-expanded-size", "--chapter-progress"])
          link.style.removeProperty(name);
      }
    },
  };
}
