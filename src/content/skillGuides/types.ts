import type { GuideResourceId } from "./resources";

export type SkillReference = { name: string; href: string };

export type SkillScenario = {
  title: string;
  flow: string;
  skills: GuideResourceId[];
  tools: string[];
};

export type SkillGuide = {
  scenarios: SkillScenario[];
  tools: SkillReference[];
};

export type ResolvedScenario = Omit<SkillScenario, "skills" | "tools"> & {
  skills: SkillReference[];
  tools: SkillReference[];
};
