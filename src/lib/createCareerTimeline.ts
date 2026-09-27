import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createCareerTextStream } from "./career/createCareerTextStream";

function documentTop(element: HTMLElement) {
  let top = 0;
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) top += node.offsetTop;
  return top;
}

/** CSS owns the reading height and sticky header; GSAP only animates its children. */
export function createCareerTimeline(root: HTMLElement) {
  const periods = [...root.querySelectorAll<HTMLElement>(".career-period")];
  const headerGuide = root.querySelector<HTMLElement>(".career-intro")!;
  const media = gsap.matchMedia();
  const headers = periods.map(period => ({
    layout: period.querySelector<HTMLElement>(".career-layout")!,
    headline: period.querySelector<HTMLElement>(".career-headline")!,
    identity: period.querySelector<HTMLElement>(".career-identity")!,
  }));

  function measureHeaders() {
    const mobile = matchMedia("(max-width: 799px)").matches;
    const compactSize = parseFloat(getComputedStyle(root).getPropertyValue("--career-compact-title"));
    // Finish all layout reads before writing any header size.
    const measurements = headers.map(({ layout, headline, identity }) => {
      // Measure untransformed text, including real wrapping after fonts/viewport changes.
      const titleHeight = headline.offsetHeight * compactSize / parseFloat(getComputedStyle(headline).fontSize);
      const contentHeight = mobile ? titleHeight + 12 + identity.offsetHeight : Math.max(titleHeight, identity.offsetHeight);
      const height = Math.ceil(8 + contentHeight + 8 + 1);
      const titleY = mobile ? 0 : height - 9 - titleHeight - headline.offsetTop;
      return { layout, height, titleY };
    });
    for (const { layout, height, titleY } of measurements) {
      if (layout.style.getPropertyValue("--career-header-height") !== `${height}px`)
        layout.style.setProperty("--career-header-height", `${height}px`);
      if (layout.style.getPropertyValue("--career-headline-rest-y") !== `${titleY}px`)
        layout.style.setProperty("--career-headline-rest-y", `${titleY}px`);
    }
  }
  measureHeaders();
  ScrollTrigger.addEventListener("refreshInit", measureHeaders);

  media.add("(prefers-reduced-motion: no-preference)", () => {
    periods.forEach(period => {
      const layout = period.querySelector<HTMLElement>(".career-layout")!;
      const intro = period.querySelector<HTMLElement>(".career-intro")!;
      const headline = period.querySelector<HTMLElement>(".career-headline")!;
      const identity = period.querySelector<HTMLElement>(".career-identity")!;
      const rule = period.querySelector<HTMLElement>(".career-rule")!;
      const opening = period.querySelector<HTMLElement>(".career-opening")!;
      const compactScale = () => parseFloat(getComputedStyle(root).getPropertyValue("--career-compact-title")) / parseFloat(getComputedStyle(headline).fontSize);
      const lineOffset = () => Math.max(48, headline.offsetTop + headline.offsetHeight + 72 + 32 - intro.offsetHeight);

      gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: layout,
          start: () => documentTop(layout) - parseFloat(getComputedStyle(headerGuide).top),
          end: () => "+=" + opening.offsetHeight * .8,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })
        .fromTo(headline, { scale: 1, y: 72 }, {
          scale: compactScale,
          y: () => parseFloat(getComputedStyle(layout).getPropertyValue("--career-headline-rest-y")),
          duration: 1,
        }, 0)
        .fromTo(rule, { scaleX: .08, y: lineOffset }, { scaleX: 1, y: 0, duration: 1 }, 0)
        // Reveal the date and affiliation together, after the title has settled.
        .fromTo(identity, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .18 }, 1);

    });
    return createCareerTextStream(root);
  });

  let disposed = false, refreshFrame = 0;
  const refresh = () => {
    cancelAnimationFrame(refreshFrame);
    refreshFrame = requestAnimationFrame(() => { if (!disposed) ScrollTrigger.refresh(); });
  };
  const observer = new ResizeObserver(refresh);
  periods.forEach(period => observer.observe(period));
  document.fonts.addEventListener("loadingdone", refresh);
  void document.fonts.ready.then(() => { if (!disposed) refresh(); });
  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(refreshFrame);
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", refresh);
      ScrollTrigger.removeEventListener("refreshInit", measureHeaders);
      media.revert();
      for (const { layout } of headers) {
        layout.style.removeProperty("--career-header-height");
        layout.style.removeProperty("--career-headline-rest-y");
      }
    },
  };
}
