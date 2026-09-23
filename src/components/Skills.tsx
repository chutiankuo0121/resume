import { useEffect, useRef, useState } from "react";
import { skills, type Skill } from "@/content/skills";
import dynamic from "next/dynamic";
import { useWorkDetail } from "./works/useWorkDetail";
const SkillDetail = dynamic(() => import("./SkillDetail"));
import type { PortalPresentation } from "@/lib/hub/presentation";


export default function Skills({
  presentation,
  active: enabled,
}: {
  presentation: PortalPresentation;
  active: boolean;
}) {
  const root = useRef<HTMLElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState<Skill | null>(null);
  const { detail, error: detailError, open, clear } = useWorkDetail();
  const [staticMode, setStaticMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let abort = new AbortController();
    let cancelled = false,
      loading = false;
    let control: { dispose: () => void } | undefined;
    async function load() {
      if (loading || control || motion.matches || cancelled) return;
      loading = true;
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
          });
          if (cancelled || motion.matches || signal.aborted) {
            controller.dispose();
            return;
          }
          control = controller;
          setReady(true);
        }
      } catch (error) {
        if (!cancelled && !signal.aborted) {
          console.error("Skills scene could not initialize", error);
          setStaticMode(true);
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
      setReady(false);
      setStaticMode(motion.matches);
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
    };
  }, [presentation]);

  useEffect(() => { if (!enabled) { clear(); setActive(null); } }, [enabled, clear]);

  function close() {
    const id = active?.id;
    setActive(null);
    clear();
    if (id)
      root.current
        ?.querySelector<HTMLButtonElement>(
          `${staticMode ? ".skill-static-card" : ".skills-hit"}[data-skill="${id}"]`,
        )
        ?.focus({ preventScroll: true });
  }

  return (
    <section
      id="skills"
      ref={root}
      inert={!enabled}
      data-lenis-prevent={staticMode ? true : undefined}
      className={`skills ${staticMode ? "skills--static" : ""}`}
      aria-label="Skills"
    >
      <div className="skills-stage">
        <canvas ref={canvas} className="skills-canvas" aria-hidden="true" />
        <nav className="skills-index" aria-label="Skill index">
          {skills.map((skill, index) => (
            <button
              key={skill.id}
              type="button"
              data-skill-index={index}
              aria-current={index === 0 ? "true" : undefined}
            >
              {skill.title}
            </button>
          ))}
        </nav>
        {!ready && !staticMode && (
          <p className="skills-loading" role="status">
            Gathering light…
          </p>
        )}
        <button
          className="skills-hit"
          aria-label={`Explore ${skills[0].title}`}
          data-skill={skills[0].id}
          onClick={(event) => {
            const skill = skills.find(
              (item) => item.id === event.currentTarget.dataset.skill,
            );
            if (skill) setActive(skill);
          }}
        />
        {staticMode && (
          <div className="skills-static-grid">
            {skills.map((skill) => (
              <button
                className="skill-static-card"
                data-skill={skill.id}
                key={skill.id}
                onClick={() => setActive(skill)}
                aria-label={`Explore ${skill.title}`}
              >
                <img src={skill.image} alt={skill.alt} loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
      {active && !detail && (
        <SkillDetail
          key={active.id}
          skill={active}
          onClose={close}
          onWork={work => { void open(work.id); }}
        />
      )}
      {detailError && <p className="skills-loading" role="alert">{detailError}</p>}
      {detail && <detail.Component key={detail.work.id} work={detail.work} onClose={clear} />}
    </section>
  );
}
