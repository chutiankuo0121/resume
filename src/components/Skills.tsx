import { useEffect, useRef, useState } from "react";
import { skills } from "@/content/skills";
import dynamic from "next/dynamic";
import { SkillArtwork } from "./SkillArtwork";
import { useTextNavigation } from "./useTextNavigation";
import { useSkillScroll } from "./useSkillScroll";
import type { PortalPresentation } from "@/lib/hub/presentation";

const SkillDetail = dynamic(() => import("./SkillDetail"), {
  loading: () => <p className="skills-reader-loading" role="status">正在载入技能内容…</p>,
});
type SceneController = { dispose: () => void; select: (index: number) => void };

export default function Skills({
  presentation,
  active: enabled,
  expanded,
}: {
  presentation: PortalPresentation;
  active: boolean;
  expanded: boolean;
}) {
  const root = useRef<HTMLElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const reader = useRef<HTMLDivElement>(null);
  const readingContent = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigation = useTextNavigation(selectedIndex);
  const selected = useRef(0);
  const scene = useRef<SceneController | undefined>(undefined);
  const skill = skills[selectedIndex];
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useSkillScroll({ root, content, reader, readingContent, active: enabled && expanded, category: skill.id });

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let abort = new AbortController();
    let cancelled = false,
      loading = false;
    let control: SceneController | undefined;
    async function load() {
      if (loading || control || motion.matches || cancelled) return;
      loading = true;
      setError("");
      const signal = abort.signal;
      try {
        const { createSkillsScene } = await import("@/lib/skills/createScene");
        if (!cancelled && !motion.matches && !signal.aborted) {
          const controller = await createSkillsScene({
            root: root.current!,
            canvas: canvas.current!,
            skills,
            presentation,
            signal,
            onSelect(index) {
              selected.current = index;
              setSelectedIndex(index);
            },
          });
          if (cancelled || motion.matches || signal.aborted) {
            controller.dispose();
            return;
          }
          control = controller;
          scene.current = controller;
          controller.select(selected.current);
          setReady(true);
        }
      } catch (error) {
        if (!cancelled && !signal.aborted) {
          console.error("Skills scene could not initialize", error);
          setError("技能画面加载失败，请刷新页面重试。");
        }
      } finally {
        loading = false;
        if (signal.aborted && !cancelled && !motion.matches) void load();
      }
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void load();
      },
      { rootMargin: "1600px" },
    );
    observer.observe(root.current!);
    function preference() {
      abort.abort();
      abort = new AbortController();
      control?.dispose();
      control = undefined;
      scene.current = undefined;
      setReady(false);
      setError("");
      setReducedMotion(motion.matches);
      if (
        !motion.matches &&
        root.current!.getBoundingClientRect().top < window.innerHeight + 1600
      )
        void load();
    }
    preference();
    motion.addEventListener("change", preference);
    return () => {
      cancelled = true;
      abort.abort();
      observer.disconnect();
      motion.removeEventListener("change", preference);
      control?.dispose();
      scene.current = undefined;
    };
  }, [presentation]);

  function select(index: number) {
    selected.current = index;
    setSelectedIndex(index);
    scene.current?.select(index);
  }

  return (
    <section
      id="skills"
      ref={root}
      inert={!enabled}
      data-lenis-prevent
      data-reading={expanded ? "true" : undefined}
      className={`skills ${expanded ? "skills--reading" : ""} ${reducedMotion ? "skills--static" : ""}`}
      aria-label="Skills"
    >
      <div className="skills-backdrop" aria-hidden="true">
        <canvas ref={canvas} className="skills-canvas" />
      </div>
      <div ref={content} className="skills-content">
        <nav className="skills-index" aria-label="技能分类">
          <div ref={navigation} className="text-navigation">
          {skills.map((item, index) => <button key={item.id} type="button"
            aria-current={selectedIndex === index ? "true" : undefined}
            aria-controls="skill-reading-area" onClick={() => select(index)}>
            {item.title}
          </button>)}
            <span className="text-navigation-indicator" aria-hidden="true" />
          </div>
        </nav>
        <div className="skills-stage" data-cursor={reducedMotion ? undefined : "drag"}
          role="group" aria-label={`${skill.title}立体方块，左右拖动或使用方向键切换技能`}
          tabIndex={enabled && !reducedMotion ? 0 : -1}>
          {!ready && !reducedMotion && !error && (
            <p className="skills-loading" role="status">
              Gathering light…
            </p>
          )}
          {error && <p className="skills-loading" role="alert">{error}</p>}
          {(reducedMotion || error) && <div className="skills-still"><SkillArtwork skill={skill} /></div>}
        </div>
        {expanded && <div ref={reader} key={skill.id} id="skill-reading-area" className="skills-reader"
          role="region" aria-label={`${skill.title}讲解`} tabIndex={0}>
          <div ref={readingContent}>
            <SkillDetail skill={skill} />
          </div>
        </div>}
      </div>
    </section>
  );
}
