import type { Skill } from "@/content/skills";
import { experience } from "@/content/experience";
import { workById, type WorkSummary } from "@/content/works/gallery";
import { cardOrigin, type CardOrigin } from "@/lib/cardMotion";
import { preloadWorkDetail } from "./works/useWorkDetail";
import { SkillArtwork } from "./SkillArtwork";
import DetailDialog from "./cards/DetailDialog";
import CardArtwork from "./cards/CardArtwork";

export default function SkillDetail({ skill, origin, onClose, onWork }: {
  skill: Skill;
  origin?: CardOrigin;
  onClose: () => void;
  onWork: (work: WorkSummary, origin: CardOrigin) => void;
}) {
  const related = skill.works.map(id => workById.get(id)).filter(work => work !== undefined);
  const practice = skill.experiences.map(id => experience.find(period => period.id === id)).filter(period => period !== undefined);
  return (
    <DetailDialog className="skill-dialog" labelledBy="skill-detail-title" label="能力 / Skills" origin={origin} onClose={onClose}>
      <div className="skill-detail">
        <div className="skill-detail-hero">
          <div><span className="card-chip">{skill.family}</span><h3 id="skill-detail-title">{skill.title}</h3></div>
          <CardArtwork><SkillArtwork className="skill-detail-art" skill={skill} /></CardArtwork>
        </div>
        <p className="skill-description">{skill.description}</p>
        <ul className="card-tags" aria-label="使用的工具">{skill.tools.map(tool => <li key={tool}>{tool}</li>)}</ul>
        {related.length > 0 && <section className="skill-related" aria-label="关联作品">
          <p className="card-eyebrow">关联作品 / Selected work</p>
          <div className="skill-evidence">{related.map(work => (
            <button key={work.id} type="button" onPointerEnter={preloadWorkDetail} onFocus={preloadWorkDetail}
              onClick={event => onWork(work, cardOrigin(event.currentTarget))}>
              <img src={work.cover} alt={work.alt} loading="lazy" />
              <span>{work.title}<span aria-hidden="true">↗</span></span>
            </button>
          ))}</div>
        </section>}
        {practice.length > 0 && <section className="skill-practice" aria-label="相关实践">{practice.map(period => (
          <article className="card-practice" key={period.id}>
            <div className="card-practice-meta"><span>相关实践</span><span>{period.years}</span></div>
            <h4>{period.title}</h4><p>{period.role}</p>
            <details><summary>工作内容</summary><p>{period.description}</p></details>
          </article>
        ))}</section>}
      </div>
    </DetailDialog>
  );
}
