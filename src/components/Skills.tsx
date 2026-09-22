import { useEffect, useRef, useState } from "react";
import { skills, type Skill } from "@/content/skills";
import { experience } from "@/content/experience";
import { works, type Work } from "@/content/works";
import WorkDetail from "./works/WorkDetail";
import type { PortalPresentation } from "@/lib/hub/presentation";

function SkillDetail({
  skill,
  onClose,
  onWork,
}: {
  skill: Skill;
  onClose: () => void;
  onWork: (work: Work) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="skill-dialog"
      aria-labelledby="skill-detail-title"
      data-lenis-prevent
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
    >
      <div className="skill-detail">
        <header>
          <span>{skill.family}</span>
          <button
            onClick={() => dialog.current?.close()}
            autoFocus
            aria-label="Close skill"
          >
            Close ×
          </button>
        </header>
        <img className="skill-detail-art" src={skill.image} alt={skill.alt} />
        <h3 id="skill-detail-title">{skill.title}</h3>
        <p>{skill.description}</p>
        <ul className="skill-tools">
          {skill.tools.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
        {skill.works.length > 0 && <p className="skill-evidence-label">关联作品 / Selected work</p>}
        <div className="skill-evidence">
          {skill.works.map((id) => {
            const work = works.find((item) => item.id === id);
            return work ? (
              <button key={id} onClick={() => onWork(work)}>
                {/* 复用本地作品封面，原生 img 让小型预览保持其真实比例。 */}
                <img src={work.cover} alt={work.alt} loading="lazy" />
                <span>
                  {work.title}
                  <span aria-hidden="true">↗</span>
                </span>
              </button>
            ) : null;
          })}
        </div>
        <div className="skill-practice">
          <p className="skill-evidence-label">相关实践 / Experience</p>
          {skill.experiences.map((id) => {
            const period = experience.find((item) => item.id === id);
            return period ? (
              <article key={id}>
                <span>{period.years}</span>
                <h4>{period.title}</h4>
                <p>{period.role}</p>
                <p>{period.description}</p>
              </article>
            ) : null;
          })}
        </div>
      </div>
    </dialog>
  );
}

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
  const [work, setWork] = useState<Work | null>(null);
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

  function close() {
    const id = active?.id;
    setActive(null);
    setWork(null);
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
      {active && !work && (
        <SkillDetail
          key={active.id}
          skill={active}
          onClose={close}
          onWork={setWork}
        />
      )}
      {work && (
        <WorkDetail key={work.id} work={work} onClose={() => setWork(null)} />
      )}
    </section>
  );
}
