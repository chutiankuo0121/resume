import { assetUrl } from "@/lib/assetUrl";

/** 技能按应用能力组织；作品 ID 关联案例，经历 ID 补充尚无公开媒体的实践。 */
export type Skill = {
  id: string;
  family: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  tools: string[];
  works: string[];
  experiences: string[];
};

export const skills: Skill[] = [
  {
    id: "generative-media",
    family: "01 / GENERATIVE MEDIA",
    title: "图像与视频",
    description: "使用 ComfyUI 与生成式 AI 工具进行图像、视频创作，组合提示词、模型与处理节点，搭建适合内容生产的工作流。将生成环节与素材管理、视频处理连接起来。",
    image: assetUrl("/skills/comfyui.webp"),
    alt: "黑白质感的 ComfyUI 图形",
    tools: [
      "ComfyUI",
      "Stable Diffusion",
      "可灵",
      "即梦",
      "FFmpeg"
    ],
    works: [],
    experiences: [
      "creative-automation"
    ]
  },
  {
    id: "voice",
    family: "02 / VOICE SYSTEMS",
    title: "语音应用",
    description: "应用 Whisper 等语音识别模型，搭建 TTS 推理服务。将模型与 Web API、任务队列和对象存储连接，处理语音任务的提交、调度与音频交付。",
    image: assetUrl("/skills/voice.webp"),
    alt: "乐谱与音符构成的黑白语音概念图",
    tools: [
      "ASR / TTS",
      "Whisper",
      "Go",
      "Python",
      "RabbitMQ",
      "OSS"
    ],
    works: [],
    experiences: [
      "ai-product"
    ]
  },
  {
    id: "agent-workflows",
    family: "03 / CONNECTED WORKFLOWS",
    title: "智能体与自动化",
    description: "通过模型 API、Dify、扣子和 n8n 组织任务流程，配合 Python 与浏览器自动化，连接内容生成、数据采集和业务操作。将重复步骤沉淀为可复用的工作流。",
    image: assetUrl("/skills/n8n.webp"),
    alt: "黑白质感的 n8n 节点图形",
    tools: [
      "Dify",
      "扣子",
      "n8n",
      "Playwright",
      "Selenium",
      "模型 API"
    ],
    works: [],
    experiences: [
      "creative-automation",
      "ai-product"
    ]
  },
  {
    id: "python",
    family: "04 / PYTHON ENGINEERING",
    title: "Python 工程",
    description: "使用 Python 开发 API、数据管线和量化交易服务。在多资产组合中完成策略计算与历史回放，在 TrendML 中实现异步交易链路、SQLite 事务账本、增量状态与异常恢复。",
    image: assetUrl("/skills/python.webp"),
    alt: "白色 Python 图形悬浮于薄雾中",
    tools: [
      "FastAPI",
      "Pandas",
      "NumPy",
      "asyncio",
      "SQLite",
      "OpenPyXL",
      "PyQt",
      "FFmpeg"
    ],
    works: ["multi-asset-portfolio", "trendml"],
    experiences: [
      "data-automation",
      "ai-finance-venture"
    ]
  },
  {
    id: "product-development",
    family: "05 / PRODUCT DEVELOPMENT",
    title: "产品与应用",
    description: "从需求梳理与原型设计开始，使用 React、Next.js 和 TypeScript 完成界面与服务联调。通过 ECharts 展示投资净值、绩效归因与风险，结合 WebSocket 提供实时持仓，让策略与交易结果可查询、可解释。",
    image: assetUrl("/skills/figma.webp"),
    alt: "磨砂白色 Figma 图形",
    tools: [
      "PRD",
      "Figma",
      "React",
      "Next.js",
      "TypeScript",
      "ECharts",
      "Tauri"
    ],
    works: [
      "astra",
      "multi-asset-portfolio",
      "trendml"
    ],
    experiences: [
      "ai-product",
      "ai-finance-venture"
    ]
  },
  {
    id: "cloudflare",
    family: "06 / DELIVERY & INFRASTRUCTURE",
    title: "部署与交付",
    description: "使用 Cloudflare Workers 交付前端与同源 API 网关，以 Vercel、Supabase 和 Turso 承接云端数据链路。为 TrendML 建立 Linux / systemd 七服务部署、分层健康检查、数据校验与回滚流程。",
    image: assetUrl("/skills/cloudflare.webp"),
    alt: "由白色光雾构成的 Cloudflare 图形",
    tools: [
      "Docker",
      "Linux / systemd",
      "Cloudflare Workers",
      "Vercel",
      "Supabase",
      "Turso",
      "D1 / R2",
      "Redis",
      "MySQL",
      "RabbitMQ"
    ],
    works: ["multi-asset-portfolio", "trendml"],
    experiences: [
      "ai-product",
      "ai-finance-venture"
    ]
  }
];
