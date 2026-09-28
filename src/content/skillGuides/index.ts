import { agentsGuide } from "./agents";
import { deliveryGuide } from "./delivery";
import { designGuide } from "./design";
import { voiceGuide } from "./voice";
import { vibeCodingGuide } from "./vibeCoding";
import { guideResources } from "./resources";
import { mediaScenarios, mediaSkills } from "../mediaSkillLibrary";
import { mediaTools } from "../generativeMedia";
import type { ResolvedScenario, SkillReference } from "./types";

const guides = {
  voice: voiceGuide,
  "agent-workflows": agentsGuide,
  "vibe-coding": vibeCodingGuide,
  "product-development": designGuide,
  cloudflare: deliveryGuide,
};

// 链接在模块加载时解析一次，六类技能共用同一套阅读组件。
function resolve(
  scenarios: { title: string; flow: string; skills: string[]; tools: string[] }[],
  resources: Record<string, SkillReference>,
  tools: SkillReference[],
): ResolvedScenario[] {
  const toolByName = new Map(tools.map(tool => [tool.name, tool]));
  return scenarios.map(item => ({
    ...item,
    skills: item.skills.map(id => resources[id]),
    tools: item.tools.map(name => toolByName.get(name)!),
  }));
}

export const skillScenarios: Record<string, ResolvedScenario[]> = Object.fromEntries([
  ...Object.entries(guides).map(([id, guide]) => [id, resolve(guide.scenarios, guideResources, guide.tools)]),
  ["generative-media", resolve(mediaScenarios, mediaSkills, mediaTools)],
]);
