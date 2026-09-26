import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { careerReadingState } from "./careerReadingState";
import { createCareerDiagramMotion } from "./createCareerDiagramMotion";

/** Pin only the scenery with CSS; real text height determines each chapter's duration. */
export function createCareerTimeline(root: HTMLElement) {
  const periods = [...root.querySelectorAll<HTMLElement>(".career-period")];
  const date = root.querySelector<HTMLElement>(".career-years")!;
  const dateSlot = root.querySelector<HTMLElement>(".career-date")!;
  const media = gsap.matchMedia();
  let dustDisposed = false;
  let stopDust: (() => void) | undefined;
  void import("./career/createCareerFlight").then(({ createCareerFlight }) => {
    if (!dustDisposed) stopDust = createCareerFlight(root);
  }).catch(() => { /* The dark CSS backdrop remains readable without WebGL. */ });

  media.add({ animated: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" }, context => {
    const animated = Boolean(context.conditions?.animated);
    let active = -1;
    let starts: number[] = [];
    let end = 0;
    let height = 1;
    let dateTween: gsap.core.Tween | undefined;
    const stopDiagramMotion = animated ? createCareerDiagramMotion(root) : undefined;

    function sync(instant = false) {
      const state = careerReadingState(window.scrollY, starts, end, height);
      if (state.index === active || !periods[state.index]) return;
      active = state.index;
      dateTween?.kill();
      date.textContent = periods[active].dataset.years!;
      // One text node is replaced, never two dates painted on top of each other.
      // Animate the outer slot so the original CSS rotation remains untouched.
      if (animated && !instant) dateTween = gsap.fromTo(dateSlot, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: .24, ease: "power2.out" });
      else gsap.set(dateSlot, { clearProps: "opacity,transform" });
    }

    function measure() {
      // Articles stay in normal flow; background and handoff transforms cannot alter these bounds.
      height = root.querySelector<HTMLElement>(".career-stage")!.offsetHeight;
      starts = periods.map(period => period.getBoundingClientRect().top + window.scrollY);
      end = root.getBoundingClientRect().top + window.scrollY + root.offsetHeight - height;
      sync(true);
    }

    if (animated) {
      periods.forEach((period, index) => {
        // The first heading must already be readable through the incoming crystal portal.
        const parts = period.querySelectorAll<HTMLElement>(
          index === 0 ? ".career-copy-section:not(:first-child)" : ".career-intro,.career-statement,.career-copy-section,.career-projects",
        );
        parts.forEach(part => {
          // Keep long paragraphs fully readable even if scrolling stops mid-entry.
          gsap.fromTo(part, { y: 18 }, {
            y: 0, ease: "none",
            scrollTrigger: { trigger: part, start: "top 97%", end: "top 80%", scrub: true, invalidateOnRefresh: true },
          });
        });
      });
    }

    ScrollTrigger.create({
      trigger: root, start: "top bottom", end: "bottom top",
      onUpdate: () => sync(), onRefresh: measure,
    });
    measure();
    return () => {
      stopDiagramMotion?.();
      dateTween?.kill();
      gsap.set(dateSlot, { clearProps: "opacity,transform" });
    };
  });

  let disposed = false, refreshFrame = 0;
  const refresh = () => {
    cancelAnimationFrame(refreshFrame);
    refreshFrame = requestAnimationFrame(() => { if (!disposed) ScrollTrigger.refresh(); });
  };
  const observer = new ResizeObserver(refresh);
  // Font loading and responsive wrapping change the reading runway, including deep-link restores.
  periods.forEach(period => observer.observe(period));
  document.fonts.addEventListener("loadingdone", refresh);
  void document.fonts.ready.then(() => { if (!disposed) refresh(); });
  return {
    dispose() {
      disposed = true;
      dustDisposed = true;
      stopDust?.();
      cancelAnimationFrame(refreshFrame);
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", refresh);
      media.revert();
    },
  };
}
