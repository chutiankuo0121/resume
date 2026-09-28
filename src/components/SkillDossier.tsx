"use client";

import { useId, type ReactNode } from "react";
import type { Skill } from "@/content/skills";
import type { SkillReference as Reference } from "@/content/skillGuides/types";

export function SkillReference({ href, children }: { href: string; children: ReactNode }) {
  return <a className="media-reference" href={href} target="_blank" rel="noopener noreferrer">
    {children}<span aria-hidden="true"> ↗</span>
  </a>;
}

/** 用途分支中的资源只显示名称链接，按行紧凑排列。 */
export function ScenarioResources({ items }: { items: Reference[] }) {
  return <ul className="media-inline-resources">{items.map(item => <li key={item.name}>
    <SkillReference href={item.href}>{item.name}</SkillReference>
  </li>)}</ul>;
}

/** 六项能力共用标题、简介和默认收起的用途分支。 */
export default function SkillDossier({ skill, children }: {
  skill: Skill;
  children: ReactNode;
}) {
  const id = useId();

  return <article className="media-dossier" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="skill-heading">{skill.title}</h2>
      <p className="media-intro">{skill.description}</p>
      <div className="media-panel">{children}</div>
    </article>;
}
