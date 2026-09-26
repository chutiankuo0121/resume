import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Called inside the career matchMedia context, so every tween/trigger reverts with it. */
export function createCareerDiagramMotion(root: HTMLElement) {
  const loops: { timeline: gsap.core.Timeline; trigger: ScrollTrigger }[] = [];
  root.querySelectorAll<SVGSVGElement>(".career-diagram").forEach(svg => {
    const track = svg.closest<HTMLElement>(".career-art-track")!;
    const parts = [...svg.querySelectorAll<SVGGElement>("[data-art-part]")];
    const drawn = [...svg.querySelectorAll<SVGPathElement>("[data-art-draw]")];
    const candles = [...svg.querySelectorAll<SVGGElement>("[data-art-candle]")];

    // The short entrance finishes while the illustration is still visible on a phone.
    // Its parent track, rather than the sticky SVG, is the stable scroll measurement.
    const entrance = gsap.timeline({ scrollTrigger: {
      trigger: track, start: "top 92%", end: "top 36%", scrub: true, invalidateOnRefresh: true,
    } });
    // Labels share these groups, so keep their opacity solid during the entrance.
    entrance.fromTo(parts, { y: 16 }, { y: 0, duration: .65, stagger: .13, ease: "power1.out" }, 0);
    if (drawn.length) entrance.fromTo(drawn, { strokeDasharray: "1 1", strokeDashoffset: 1 }, {
      strokeDashoffset: 0, duration: .8, stagger: .09, ease: "none",
    }, .18);
    if (candles.length) entrance.fromTo(candles, { opacity: .1 }, { opacity: 1, duration: .4, stagger: .02 }, .1);

    const flowing = svg.querySelectorAll<SVGPathElement>("[data-art-flow]");
    const pulses = svg.querySelectorAll<SVGCircleElement | SVGRectElement>("[data-art-pulse]");
    const waves = svg.querySelectorAll<SVGPathElement>("[data-art-wave]");
    if (!flowing.length && !pulses.length && !waves.length) return;

    const loop = gsap.timeline({ paused: true });
    if (flowing.length) {
      const lengths = [...flowing].map(path => path.getTotalLength());
      gsap.set(flowing, { strokeDasharray: (i: number) => `${lengths[i] * .035} ${lengths[i] * .965}` });
      loop.to(flowing, { strokeDashoffset: (i: number) => -lengths[i], duration: 4.8, repeat: -1, ease: "none" }, 0);
    }
    if (pulses.length) loop.fromTo(pulses, { opacity: .4 }, { opacity: 1, duration: 1.6, stagger: .16, repeat: -1, yoyo: true, ease: "sine.inOut" }, 0);
    if (waves.length) loop.fromTo(waves, { scaleY: .5, transformOrigin: "50% 50%" }, {
      scaleY: 1, duration: .9, stagger: { each: .06, from: "center" }, repeat: -1, yoyo: true, ease: "sine.inOut",
    }, 0);
    const trigger = ScrollTrigger.create({
      trigger: track, start: "top bottom", end: "bottom top",
      onToggle: self => loop.paused(!self.isActive || document.hidden),
      onRefresh: self => loop.paused(!self.isActive || document.hidden),
    });
    loops.push({ timeline: loop, trigger });
  });

  const syncVisibility = () => loops.forEach(({ timeline, trigger }) => timeline.paused(document.hidden || !trigger.isActive));
  document.addEventListener("visibilitychange", syncVisibility);
  syncVisibility();
  return () => {
    document.removeEventListener("visibilitychange", syncVisibility);
    loops.forEach(({ timeline }) => timeline.pause());
  };
}
