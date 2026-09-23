import { useEffect, useRef } from "react";
import type { Skill } from "@/content/skills";
import { experience } from "@/content/experience";
import { workById, type WorkSummary } from "@/content/works/gallery";
import { preloadWorkDetail } from "./works/useWorkDetail";

export default function SkillDetail({
  skill,
  onClose,
  onWork,
}: {
  skill: Skill;
  onClose: () => void;
  onWork: (work: WorkSummary) => void;
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
            const work = workById.get(id);
            return work ? (
              <button key={id} onPointerEnter={preloadWorkDetail} onFocus={preloadWorkDetail} onClick={() => onWork(work)}>
                {/* 复用作品封面，原生 img 让小型预览保持其真实比例。 */}
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
