import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type TextLine = { top: number; bottom: number; stops: number[] };
const SOLIDIFY_DISTANCE = 26;

function documentTop(element: HTMLElement) {
  let top = 0;
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) top += node.offsetTop;
  return top;
}

/** Type the original text in ghosted batches, then solidify each batch with more scroll. */
export function createCareerTextStream(root: HTMLElement) {
  const segmenter = new Intl.Segmenter("zh", { granularity: "grapheme" });
  let fontRevision = 0;
  const invalidateFonts = () => { fontRevision++; };
  document.fonts.addEventListener("loadingdone", invalidateFonts);
  const blocks = [...root.querySelectorAll<HTMLElement>(".career-description,.career-copy-section h3,.career-paragraph")].map(element => {
    const layout = element.closest<HTMLElement>(".career-layout")!;
    const state = { travel: 0 };
    let lines: TextLine[] = [];
    let lineHeight = 32;
    let height = 0;
    let lastMask = "";
    let measurementKey = "";
    let linePositions: string[] = [], lineSizes: string[] = [];

    function measure() {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const key = `${box.width}|${element.offsetHeight}|${style.font}|${style.letterSpacing}|${style.lineHeight}|${fontRevision}`;
      if (key === measurementKey) return;
      measurementKey = key;
      lineHeight = parseFloat(style.lineHeight);
      height = element.offsetHeight;
      lines = [];
      const range = document.createRange();
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.textContent ?? "";
        for (const { index, segment } of segmenter.segment(text)) {
          range.setStart(node, index);
          range.setEnd(node, index + segment.length);
          const rect = range.getBoundingClientRect();
          if (!rect.height || !rect.width) continue;
          const top = rect.top - box.top;
          const bottom = rect.bottom - box.top;
          let line = lines[lines.length - 1];
          if (!line || Math.abs(line.top - top) > lineHeight * .45) {
            line = { top, bottom, stops: [] };
            lines.push(line);
          }
          line.bottom = Math.max(line.bottom, bottom);
          line.stops.push(rect.right - box.left);
        }
      }
      linePositions = []; lineSizes = [];
      lines.forEach((line, index) => {
        const top = index ? (lines[index - 1].bottom + line.top) / 2 : 0;
        const bottom = index + 1 < lines.length ? (line.bottom + lines[index + 1].top) / 2 : height;
        linePositions.push(`0 ${top.toFixed(2)}px`);
        lineSizes.push(`100% ${(bottom - top).toFixed(2)}px`);
      });
      lastMask = "";
    }

    // GSAP owns the original style so matchMedia cleanup restores readable text.
    gsap.set(element, {
      clipPath: "none", maskImage: "none", maskRepeat: "no-repeat",
      maskPosition: "0 0", maskSize: "100% 100%",
    });
    const setImage = gsap.quickSetter(element, "maskImage");
    const setPosition = gsap.quickSetter(element, "maskPosition");
    const setSize = gsap.quickSetter(element, "maskSize");
    function render() {
      if (layout.classList.contains("chapter-held")) return;
      const travel = Math.max(0, state.travel);
      const images: string[] = [], positions: string[] = [], sizes: string[] = [];
      const finished = travel >= lines.length * lineHeight + SOLIDIFY_DISTANCE;
      if (!finished) {
        for (let index = 0; index < lines.length; index++) {
          if (travel <= index * lineHeight) break;
          const line = lines[index];
          if (travel >= (index + 1) * lineHeight + SOLIDIFY_DISTANCE) {
            images.push("linear-gradient(#000, #000)");
          } else {
            const batches = Math.ceil(line.stops.length / 3);
            const stops: string[] = [];
            let left = 0;
            for (let batch = 0; batch < batches; batch++) {
              const bornAt = (index + (batch + 1) / batches) * lineHeight;
              if (travel < bornAt) break;
              const age = Math.min(1, (travel - bornAt) / SOLIDIFY_DISTANCE);
              const ink = .14 + .86 * age * age * (3 - 2 * age);
              const right = line.stops[Math.min(line.stops.length, (batch + 1) * 3) - 1] + .25;
              // Constant alpha across each complete batch keeps glyph edges intact.
              stops.push(`rgba(0,0,0,${ink.toFixed(3)}) ${left.toFixed(2)}px ${right.toFixed(2)}px`);
              left = right;
            }
            if (!stops.length) break;
            stops.push(`transparent ${left.toFixed(2)}px 100%`);
            images.push(`linear-gradient(to right, ${stops.join(",")})`);
          }
          positions.push(linePositions[index]);
          sizes.push(lineSizes[index]);
        }
      }
      const image = finished || !lines.length ? "none"
        : images.length ? images.join(",") : "linear-gradient(transparent, transparent)";
      const position = positions.join(",") || "0 0";
      const size = sizes.join(",") || "100% 100%";
      const mask = `${image}|${position}|${size}`;
      if (mask !== lastMask) {
        setImage(image);
        setPosition(position);
        setSize(size);
        lastMask = mask;
      }
    }

    measure();
    gsap.fromTo(state, { travel: 0 }, {
      travel: () => lines.length * lineHeight + SOLIDIFY_DISTANCE,
      ease: "none",
      onUpdate: render,
      scrollTrigger: {
        trigger: element,
        start: () => documentTop(element) - window.innerHeight * .96,
        end: () => documentTop(element) - window.innerHeight * .96 + lines.length * lineHeight + SOLIDIFY_DISTANCE,
        scrub: .1,
        invalidateOnRefresh: true,
        onRefresh: render,
      },
    });
    render();
    return { measure };
  });

  // Re-measure real line breaks after fonts/viewport changes, never during scrolling.
  const measure = () => blocks.forEach(block => block.measure());
  ScrollTrigger.addEventListener("refreshInit", measure);
  return () => {
    ScrollTrigger.removeEventListener("refreshInit", measure);
    document.fonts.removeEventListener("loadingdone", invalidateFonts);
  };
}
