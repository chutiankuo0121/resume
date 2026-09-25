import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CAREER_ENTRY, CAREER_PAGE, careerPose, careerPageOpacity, careerRunway, clamp } from "./career/choreography";

/** Scroll owns assembly, reading and departure. Only pointer drift uses time. */
export function createCareerTimeline(root: HTMLElement, scrollTo: (position: number) => void) {
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add("(min-height: 640px) and (prefers-reduced-motion: no-preference)", () => {
    root.dataset.careerMotion = "";
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const saved = new Map<HTMLElement, string | null>();
    const remember = <T extends HTMLElement>(node: T) => { saved.set(node, node.getAttribute("style")); return node; };
    const entries = [...root.querySelectorAll<HTMLElement>(".career-period")].map((period, index, periods) => {
      const query = (selector: string) => remember(period.querySelector<HTMLElement>(selector)!);
      const stage = query(".career-stage"), scene = query(".career-scene");
      const paper = query(".career-paper"), background = query(".career-background");
      const middle = query(".career-piece--middle"), front = query(".career-piece--front");
      const layout = query(".career-layout");
      const pages = [...period.querySelectorAll<HTMLElement>(".career-copy-page")].map(remember);
      const buttons = [...period.querySelectorAll<HTMLButtonElement>("[data-career-page]")];
      const number = period.querySelector<HTMLElement>(".career-page-number")!;
      const entry = { period, stage, scene, paper, background, middle, front, layout, pages, buttons, number,
        first: index === 0, last: index === periods.length - 1, time: 0, height: 1, start: 0,
        runway: careerRunway(pages.length), activePage: -1, trigger: undefined as ScrollTrigger | undefined };
      entry.trigger = ScrollTrigger.create({
        trigger: period, start: "top top", end: "bottom bottom", invalidateOnRefresh: true,
        onUpdate: self => { entry.time = (self.scroll() - self.start) / entry.height; draw(entry); },
        onRefresh: self => {
          entry.height = Math.max(1, stage.clientHeight);
          entry.start = self.start;
          entry.time = (self.scroll() - self.start) / entry.height;
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
      const drift = Math.sin(pose.reading * Math.PI);
      const hover = Math.sin(pose.assembly * Math.PI / 2) * drift;
      gsap.set(entry.middle, {
        y: (1 - pose.assembly) * height * 1.08 - drift * 10 + pointer.y * hover * 7,
        x: (1 - pose.assembly) * height * .035 + pointer.x * hover * 8,
        rotation: (1 - pose.assembly) * -5, opacity: clamp(pose.assembly * 4),
      });
      gsap.set(entry.front, {
        y: (1 - pose.foreground) * height * 1.32 - drift * 25 + pointer.y * hover * 14,
        x: (1 - pose.foreground) * height * -.028 + pointer.x * hover * 17,
        rotation: (1 - pose.foreground) * 4, opacity: clamp(pose.foreground * 4),
      });
      gsap.set(entry.layout, { opacity: pose.text, y: (1 - Math.min(1, time / CAREER_ENTRY)) * 22 });
      pages.forEach((page, index) => {
        const alpha = careerPageOpacity(time, index, pages.length, last);
        gsap.set(page, { opacity: alpha, visibility: alpha < .005 ? "hidden" : "visible", y: (1 - alpha) * 12 });
        page.inert = alpha < .05;
        page.setAttribute("aria-hidden", String(alpha < .05));
      });
      if (entry.activePage !== pose.page) {
        entry.activePage = pose.page;
        entry.buttons.forEach((button, index) => {
          if (index === pose.page) button.setAttribute("aria-current", "step");
          else button.removeAttribute("aria-current");
        });
        entry.number.textContent = `${String(pose.page + 1).padStart(2, "0")} / ${String(pages.length).padStart(2, "0")}`;
      }
    }
    function move(event: PointerEvent) {
      if (event.pointerType === "touch") { leave(); return; }
      pointer.tx = (event.clientX / innerWidth - .5) * 2;
      pointer.ty = (event.clientY / innerHeight - .5) * 2;
    }
    function leave() { pointer.tx = pointer.ty = 0; }
    let lastTime = gsap.ticker.time;
    function tick(time: number) {
      const dt = Math.min(.05, Math.max(0, time - lastTime)); lastTime = time;
      if (document.hidden) return;
      const distance = Math.abs(pointer.tx - pointer.x) + Math.abs(pointer.ty - pointer.y);
      if (distance < .001) return;
      const follow = 1 - Math.exp(-dt * 6);
      pointer.x += (pointer.tx - pointer.x) * follow; pointer.y += (pointer.ty - pointer.y) * follow;
      entries.forEach(entry => { if (entry.time >= 0 && entry.time <= entry.runway) draw(entry); });
    }
    function navigate(event: Event) {
      const button = (event.target as Element).closest<HTMLButtonElement>("[data-career-page]");
      if (!button) return;
      const entry = entries.find(entry => entry.period.contains(button));
      if (!entry) return;
      const page = Number(button.dataset.careerPage);
      scrollTo(entry.start + (CAREER_ENTRY + page * CAREER_PAGE + .2) * entry.height);
    }
    root.addEventListener("pointermove", move, { passive: true });
    root.addEventListener("pointerleave", leave);
    root.addEventListener("click", navigate);
    window.addEventListener("blur", leave);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      root.removeEventListener("pointermove", move); root.removeEventListener("pointerleave", leave);
      root.removeEventListener("click", navigate); window.removeEventListener("blur", leave);
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
