import { assetUrl } from "@/lib/assetUrl";

/** 暗部、主色、高光共同决定卡片与空间的色调。 */
export type SkillPalette = { shadow: string; tone: string; light: string };

/** 技能按应用能力组织，详情与来源在 skillGuides 中维护。 */
export type Skill = {
  id: "generative-media" | "voice" | "agent-workflows" | "vibe-coding" | "product-development" | "cloudflare";
  title: string;
  description: string;
  image: string;
  alt: string;
  palette: SkillPalette;
};

export const skills: Skill[] = [
  {
    id: "vibe-coding",
    title: "Vibe Coding",
    description: "让想法在对话中成为可以使用的产品。通过自然语言、参考图与即时反馈引导 AI 编写和修改代码，边预览、边试用、边迭代；结合 Codex、Claude Code、Cursor 与应用生成平台，将需求、设计、前后端和数据库串联起来，再完成调试验证与上线交付。",
    image: assetUrl("/skills/python.webp"),
    alt: "蓝金色 Python 图形悬浮于薄雾中",
    palette: { shadow: "#0a1b32", tone: "#438eac", light: "#ffe3a2" },
  },
  {
    id: "agent-workflows",
    title: "智能体与自动化",
    description: "使用 Codex、Claude Code、Cursor 组织代码理解、开发与验证；通过 Skills、MCP 和工作流连接模型与业务工具。结合影刀 RPA、n8n、Dify、脚本及浏览器自动化，把重复操作整理为可复用、可追踪、可恢复的流程。",
    image: "/skills/openai-agents.webp",
    alt: "珊瑚红光晕中的暖白陶瓷 OpenAI 标志",
    palette: { shadow: "#290d18", tone: "#dc6866", light: "#ffe0c5" },
  },
  {
    id: "cloudflare",
    title: "部署与交付",
    description: "将网站、API、数据库和后台任务交付为持续运行的服务。结合 Cloudflare、Vercel、GitHub、Linux 与容器工具，组织环境、发布、监控、备份和故障恢复，让每次迭代都可以验证、追踪和回退。",
    image: assetUrl("/skills/cloudflare.webp"),
    alt: "由琥珀色光雾构成的 Cloudflare 图形",
    palette: { shadow: "#281207", tone: "#d67c32", light: "#ffe8b9" },
  },
  {
    id: "product-development",
    title: "产品设计",
    description: "从用户任务、信息架构和交互流程出发，结合 Google Stitch、Figma、Figma Make 与 Spline 探索产品方案。将 AI 生成、设计系统、可运行原型和工程交付连接起来，兼顾视觉表达、真实内容、响应式和使用体验。",
    image: assetUrl("/skills/figma.webp"),
    alt: "青绿色磨砂质感的 Figma 图形",
    palette: { shadow: "#071e1c", tone: "#319e88", light: "#cef4d8" },
  },
  {
    id: "generative-media",
    title: "AI 图片与视频",
    description: "熟悉生成式图像与视频从策划、脚本、视觉设定到生成、剪辑和交付的完整流程。根据电商、短剧、漫剧、品牌与知识内容的不同需求，组合模型、无限画布和 Agent Skills，将创作方法沉淀为可复用的工作流。",
    image: assetUrl("/skills/comfyui.webp"),
    alt: "冰蓝色厚涂质感的 ComfyUI 图形",
    palette: { shadow: "#070e29", tone: "#3977ce", light: "#c5eaff" },
  },
  {
    id: "voice",
    title: "AI 语音应用",
    description: "将 AI 音乐、文字转语音、语音转文字、角色配音、译配与实时对话连接到同一套音频工作流。根据短剧、漫剧、广告、课程与交互产品的需要，完成从脚本、声音设计到字幕、混音和交付的制作，也能将模型封装为可调用的语音服务。",
    image: assetUrl("/skills/voice.webp"),
    alt: "紫色光雾中的乐谱与音符",
    palette: { shadow: "#160b2d", tone: "#9063ca", light: "#ebd6ff" },
  }
];
