import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { careerReadingState } from "./careerReadingState";
import { createCareerDiagramMotion } from "./createCareerDiagramMotion";

/** Pin only the scenery with CSS; real text height determines each chapter's duration. */
export function createCareerTimeline(root: HTMLElement) {
  const periods = [...root.querySelectorAll<HTMLElement>(".career-period")];
  const layers = [...root.querySelectorAll<HTMLElement>(".career-backdrop")];
  const date = root.querySelector<HTMLElement>(".career-years")!;
  const era = root.querySelector<HTMLElement>(".career-era")!;
  const current = root.querySelector<HTMLElement>(".career-current")!;
  const media = gsap.matchMedia();

  media.add({ animated: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" }, context => {
    const animated = Boolean(context.conditions?.animated);
    let active = -1;
    let starts: number[] = [];
    let end = 0;
    let height = 1;
    let dateTween: gsap.core.Tween | undefined;
    const stopDiagramMotion = animated ? createCareerDiagramMotion(root) : undefined;
    gsap.set(layers, { autoAlpha: 0 });
    gsap.set(layers[0], { autoAlpha: 1 });

    function sync(instant = false) {
      const state = careerReadingState(window.scrollY, starts, end, height);
      root.style.setProperty("--career-progress", state.progress.toFixed(4));
      if (state.index === active || !periods[state.index]) return;
      if (!animated) {
        if (active >= 0) layers[active].style.visibility = "hidden";
        layers[state.index].style.visibility = "visible";
        layers[state.index].style.opacity = "1";
      }
      active = state.index;
      root.dataset.careerScene = layers[active].dataset.scene;
      dateTween?.kill();
      date.textContent = periods[active].dataset.years!;
      era.textContent = periods[active].dataset.era!;
      current.textContent = String(active + 1).padStart(2, "0");
      // One text node is replaced, never two dates painted on top of each other.
      if (animated && !instant) dateTween = gsap.fromTo(date, { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: .24, ease: "power2.out" });
      else gsap.set(date, { clearProps: "opacity,transform" });
    }

    function measure() {
      // Articles stay in normal flow; background and handoff transforms cannot alter these bounds.
      height = root.querySelector<HTMLElement>(".career-stage")!.offsetHeight;
      starts = periods.map(period => period.getBoundingClientRect().top + window.scrollY);
      end = root.getBoundingClientRect().top + window.scrollY + root.offsetHeight - height;
      sync(true);
    }

    if (animated) {
      periods.slice(1).forEach((period, i) => {
        const next = layers[i + 1];
        // Fade the next opaque scene over the previous one. Its remaining
        // contribution is 1 - opacity, keeping the blend free of white flashes.
        gsap.fromTo(next, { autoAlpha: 0 }, {
          autoAlpha: 1, ease: "sine.inOut", immediateRender: false,
          scrollTrigger: {
            trigger: period, start: "top 72%", end: "top 12%",
            scrub: true, invalidateOnRefresh: true,
          },
        });
      });
      periods.forEach((period, index) => {
        // The first heading must already be readable through the incoming crystal portal.
        const parts = period.querySelectorAll<HTMLElement>(
          index === 0 ? ".career-copy-section:not(:first-child)" : ".career-intro,.career-statement,.career-copy-section,.career-projects",
        );
        parts.forEach(part => {
          gsap.fromTo(part, { y: 18, opacity: .15 }, {
            y: 0, opacity: 1, ease: "none",
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
      gsap.set(date, { clearProps: "opacity,transform" });
      delete root.dataset.careerScene;
      root.style.removeProperty("--career-progress");
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
      cancelAnimationFrame(refreshFrame);
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", refresh);
      media.revert();
    },
  };
}
