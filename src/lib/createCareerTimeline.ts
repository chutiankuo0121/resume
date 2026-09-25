import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CAREER_ENTRY, CAREER_PAGE, careerPose, careerPageOpacity, careerRunway, clamp, smooth } from "./career/choreography";

/** Scroll owns assembly, reading and departure; landed pieces stay registered. */
export function createCareerTimeline(root: HTMLElement, scrollTo: (position: number) => void) {
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add("(min-height: 640px) and (prefers-reduced-motion: no-preference)", () => {
    root.dataset.careerMotion = "";
    const saved = new Map<HTMLElement, string | null>();
    const remember = <T extends HTMLElement>(node: T) => { saved.set(node, node.getAttribute("style")); return node; };
    const entries = [...root.querySelectorAll<HTMLElement>(".career-period")].map((period, index, periods) => {
      const query = (selector: string) => remember(period.querySelector<HTMLElement>(selector)!);
      const stage = query(".career-stage"), scene = query(".career-scene");
      const paper = query(".career-paper"), background = query(".career-background");
      const pieces = ["middle", "subject", "front"].map(name => query(`.career-piece--${name}`));
      const guides = ["middle", "subject", "front"].map(name => query(`[data-guide='${name}']`));
      const layout = query(".career-layout");
      const story = query(".career-story");
      const pages = [...period.querySelectorAll<HTMLElement>(".career-copy-page")].map(remember);
      const buttons = [...period.querySelectorAll<HTMLButtonElement>("[data-career-page]")];
      const number = period.querySelector<HTMLElement>(".career-page-number")!;
      const entry = { period, stage, scene, paper, background, pieces, guides, layout, story, pages, buttons, number,
        first: index === 0, last: index === periods.length - 1, time: 0, height: 1, start: 0,
        runway: careerRunway(pages.length), activePage: -1, trigger: undefined as ScrollTrigger | undefined };
      entry.trigger = ScrollTrigger.create({
        trigger: period, start: "top top", end: "bottom bottom", invalidateOnRefresh: true,
        onUpdate: self => { entry.time = (self.scroll() - self.start) / entry.height; draw(entry); },
        onRefresh: self => {
          entry.height = Math.max(1, stage.clientHeight);
          entry.start = self.start;
          entry.time = (self.scroll() - self.start) / entry.height;
          const tallest = Math.max(...pages.map(page => {
            const display = page.style.display;
            page.style.display = "block";
            const height = page.offsetHeight;
            page.style.display = display;
            return height;
          }));
          const css = getComputedStyle(layout);
          const reading = period.querySelector<HTMLElement>(".career-reading")!;
          const cardHeight = period.querySelector<HTMLElement>(".career-intro")!.offsetHeight + tallest +
            reading.offsetHeight + parseFloat(getComputedStyle(reading).marginTop) +
            parseFloat(getComputedStyle(story).marginTop) + parseFloat(css.paddingTop) + parseFloat(css.paddingBottom) + 8;
          layout.style.setProperty("--career-card-height", `${Math.ceil(cardHeight)}px`);
          draw(entry);
        },
      });
      return entry;
    });
    type Entry = typeof entries[number];

    function draw(entry: Entry) {
      const { time, first, last, pages, height } = entry;
      const pose = careerPose(time, pages.length, first, last);
      const visible = (first || time >= 0) && (last || time <= entry.runway);
      gsap.set(entry.scene, { opacity: pose.opacity, visibility: visible ? "visible" : "hidden" });
      entry.stage.inert = !visible || pose.text < .02;
      gsap.set([entry.paper, entry.background], { opacity: pose.background });
      [pose.assembly, pose.subject, pose.foreground].forEach((progress, layer) => {
        gsap.set(entry.pieces[layer], {
          y: (1 - progress) * height * (1.05 + layer * .12),
          x: (1 - progress) * height * (layer % 2 ? -.035 : .03),
          rotation: (1 - progress) * (layer % 2 ? 4 : -3), opacity: clamp(progress * 5),
        });
        // Replace the matching sketch guide as the painted piece lands.
        // At progress 1 every transform is zero, matching the background exactly.
        gsap.set(entry.guides[layer], { opacity: pose.background * (1 - smooth(.25, .9, progress)) });
      });
      // Paper and live text enter as one collage fragment and land at identity.
      gsap.set(entry.layout, {
        opacity: pose.text,
        y: (1 - pose.note) * height * 1.04,
        x: (1 - pose.note) * height * .025,
        rotation: (1 - pose.note) * -3.5,
      });
      pages.forEach((page, index) => {
        const alpha = careerPageOpacity(time, index, pages.length, last);
        gsap.set(page, { opacity: alpha, visibility: alpha < .005 ? "hidden" : "visible", display: alpha < .005 ? "none" : "block", y: (1 - alpha) * 12 });
        page.inert = alpha < .05;
        page.setAttribute("aria-hidden", String(alpha < .05));
      });
      if (entry.activePage !== pose.page) {
        entry.activePage = pose.page;
        entry.story.scrollTop = 0;
        entry.buttons.forEach((button, index) => {
          if (index === pose.page) button.setAttribute("aria-current", "step");
          else button.removeAttribute("aria-current");
        });
        entry.number.textContent = `${String(pose.page + 1).padStart(2, "0")} / ${String(pages.length).padStart(2, "0")}`;
      }
    }
    // A short viewport may need to scroll a long original paragraph inside the
    // card. Consume only that part; at its edges normal chapter scrolling resumes.
    function readWheel(event: WheelEvent) {
      const story = (event.target as Element).closest<HTMLElement>(".career-story");
      if (!story || !event.deltaY) return;
      const page = story.querySelector<HTMLElement>('.career-copy-page[aria-hidden="false"]');
      const max = Math.max(0, (page?.offsetHeight ?? 0) - story.clientHeight);
      if ((event.deltaY > 0 && story.scrollTop < max - 1) || (event.deltaY < 0 && story.scrollTop > 1)) {
        event.preventDefault(); event.stopPropagation();
        const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? story.clientHeight : 1);
        story.scrollTop = Math.max(0, Math.min(max, story.scrollTop + delta));
      }
    }
    function navigate(event: Event) {
      const button = (event.target as Element).closest<HTMLButtonElement>("[data-career-page]");
      if (!button) return;
      const entry = entries.find(entry => entry.period.contains(button));
      if (!entry) return;
      const page = Number(button.dataset.careerPage);
      scrollTo(entry.start + (CAREER_ENTRY + page * CAREER_PAGE + .2) * entry.height);
    }
    root.addEventListener("click", navigate);
    root.addEventListener("wheel", readWheel, { passive: false });
    const refreshFonts = () => ScrollTrigger.refresh();
    document.fonts.addEventListener("loadingdone", refreshFonts);
    return () => {
      document.fonts.removeEventListener("loadingdone", refreshFonts);
      root.removeEventListener("click", navigate);
      root.removeEventListener("wheel", readWheel);
      entries.forEach(entry => {
        entry.trigger?.kill(); entry.stage.inert = false;
        entry.pages.forEach(page => { page.inert = false; page.removeAttribute("aria-hidden"); });
        entry.buttons.forEach(button => button.removeAttribute("aria-current"));
      });
      saved.forEach((style, node) => { if (style === null) node.removeAttribute("style"); else node.setAttribute("style", style); });
      delete root.dataset.careerMotion;
    };
  });
  return { dispose: () => media.revert() };
}
