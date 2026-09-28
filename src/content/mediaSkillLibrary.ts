import type { SkillReference } from "./skillGuides/types";

/** 来源链接核对于 2026-09-27。 */
export const mediaSkills: Record<string, SkillReference> = {
  "imagegen": {"name":"imagegen","href":"https://github.com/openai/skills/blob/main/skills/.system/imagegen/SKILL.md"},
  "canvas-design": {"name":"canvas-design","href":"https://github.com/anthropics/skills/blob/main/skills/canvas-design/SKILL.md"},
  "cover": {"name":"baoyu-cover-image","href":"https://github.com/JimLiu/baoyu-skills/blob/main/skills/baoyu-cover-image/SKILL.md"},
  "illustrator": {"name":"baoyu-article-illustrator","href":"https://github.com/JimLiu/baoyu-skills/blob/main/skills/baoyu-article-illustrator/SKILL.md"},
  "infographic": {"name":"baoyu-infographic","href":"https://github.com/JimLiu/baoyu-skills/blob/main/skills/baoyu-infographic/SKILL.md"},
  "xhs": {"name":"baoyu-xhs-images","href":"https://github.com/JimLiu/baoyu-skills/blob/main/skills/baoyu-xhs-images/SKILL.md"},
  "comic": {"name":"baoyu-comic","href":"https://github.com/JimLiu/baoyu-skills/blob/main/skills/baoyu-comic/SKILL.md"},
  "ad-creative": {"name":"ad-creative","href":"https://github.com/coreyhaines31/marketingskills/blob/main/skills/ad-creative/SKILL.md"},
  "copywriting": {"name":"copywriting","href":"https://github.com/coreyhaines31/marketingskills/blob/main/skills/copywriting/SKILL.md"},
  "marketing-video": {"name":"video","href":"https://github.com/coreyhaines31/marketingskills/blob/main/skills/video/SKILL.md"},
  "short-drama": {"name":"short-drama","href":"https://github.com/0xsline/short-drama/blob/main/SKILL.md"},
  "dialogue": {"name":"sw-dialogue","href":"https://github.com/jtydhr88/screenwriting-skills/blob/main/plugins/screenwriting/skills/sw-dialogue/SKILL.md"},
  "scene-craft": {"name":"sw-scene-craft","href":"https://github.com/jtydhr88/screenwriting-skills/blob/main/plugins/screenwriting/skills/sw-scene-craft/SKILL.md"},
  "assets": {"name":"short-drama-assets","href":"https://github.com/zenstory-ai/drama-skills/blob/main/skills/short-drama-assets/SKILL.md"},
  "storyboard": {"name":"short-drama-storyboard","href":"https://github.com/zenstory-ai/drama-skills/blob/main/skills/short-drama-storyboard/SKILL.md"},
  "video-prompts": {"name":"short-drama-video-prompts","href":"https://github.com/zenstory-ai/drama-skills/blob/main/skills/short-drama-video-prompts/SKILL.md"},
  "remotion": {"name":"remotion-best-practices","href":"https://github.com/remotion-dev/skills/blob/main/skills/remotion-best-practices/SKILL.md"},
  "captions": {"name":"remotion-captions","href":"https://github.com/remotion-dev/skills/blob/main/skills/remotion-captions/SKILL.md"},
  "render": {"name":"remotion-render","href":"https://github.com/remotion-dev/skills/blob/main/skills/remotion-render/SKILL.md"},
  "openmontage": {"name":"OpenMontage","href":"https://github.com/calesthio/OpenMontage/blob/main/skills/INDEX.md"},
};

export const mediaScenarios = [
  {
    title: "电商与品牌广告",
    flow: "从产品资料和目标受众中提炼卖点，编写脚本与分镜，锁定商品参考后生成场景图和动态镜头，再完成配音、字幕与剪辑，核对商品细节，导出适合不同渠道的图文和短视频。",
    skills: ["ad-creative", "imagegen", "marketing-video", "remotion", "captions"],
    tools: ["Lovart","FLORA","GPT Image 2.5","Seedance 2.5"],
  },
  {
    title: "真人短剧",
    flow: "围绕题材和人物关系编写分集剧本，拆解角色、场景与道具，再设计分镜和关键帧，逐镜生成素材；核对人物与镜头衔接后完成配音、音效和剪辑，组织为连贯的短剧。",
    skills: ["short-drama", "dialogue", "scene-craft", "assets", "storyboard", "video-prompts"],
    tools: ["FLORA","GPT Image 2.5","Seedance 2.5"],
  },
  {
    title: "漫剧与 IP 内容",
    flow: "将故事改编为分镜，确定角色、画风和色彩后生成关键帧，再按镜头编写动作与运镜，制作动态片段；统一人物和场景细节，配合对白、音效与字幕剪成漫剧。",
    skills: ["comic", "assets", "storyboard", "video-prompts", "captions"],
    tools: ["FLORA","GPT Image 2.5","Seedance 2.5"],
  },
  {
    title: "品牌视觉与社媒图文",
    flow: "根据品牌资料、内容主题和发布尺寸确定视觉方向，统一配色、构图与字级，再生成封面和系列配图，逐步修正主体与文字细节，完成多页排版和不同画幅的适配。",
    skills: ["canvas-design", "cover", "illustrator", "xhs", "imagegen"],
    tools: ["Lovart","GPT Image 2.5"],
  },
  {
    title: "知识科普与行业解读",
    flow: "先核对资料与数据，提炼知识结构并编写讲解脚本，再制作信息图、示意画面和动画，配合旁白与字幕组织节奏，校验数字和标注后输出图解或讲解视频。",
    skills: ["infographic", "illustrator", "comic", "remotion", "captions"],
    tools: ["Lovart","FLORA","GPT Image 2.5","Seedance 2.5"],
  },
  {
    title: "产品演示与企业培训",
    flow: "从真实使用路径编写演示脚本，录制操作并补充界面标注与示意素材，再按时间线编排旁白、动画和字幕，核对操作步骤与阅读节奏，导出培训、教程及多语言版本。",
    skills: ["copywriting", "marketing-video", "openmontage", "remotion", "captions", "render"],
    tools: ["Lovart","FLORA","GPT Image 2.5","Seedance 2.5"],
  },
];
