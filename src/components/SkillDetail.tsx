"use client";

import type { Skill } from "@/content/skills";
import { skillScenarios } from "@/content/skillGuides";
import SkillDossier, { ScenarioResources } from "./SkillDossier";
import SkillDisclosure from "./SkillDisclosure";

export default function SkillDetail({ skill }: { skill: Skill }) {
  return <SkillDossier skill={skill}>
    <div className="media-scenarios">{skillScenarios[skill.id].map(item => <SkillDisclosure key={item.title} title={item.title}>
      <dl className="media-scenario-body">
        <div><dt>流程</dt><dd><p>{item.flow}</p></dd></div>
        <div><dt>Skills</dt><dd><ScenarioResources items={item.skills} /></dd></div>
        <div><dt title="模型与工具推荐截至 2026 年 9 月 27 日">工具</dt><dd><ScenarioResources items={item.tools} /></dd></div>
      </dl>
    </SkillDisclosure>)}</div>
  </SkillDossier>;
}
