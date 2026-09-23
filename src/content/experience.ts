import multiAssetPortfolio from "./works/multi-asset-portfolio";
import trendml from "./works/trendml";
import { assetUrl } from "@/lib/assetUrl";

/** 按实际时间排列；任职与创业内容来自本人补充及项目介绍，配图逐项标明用途。 */
const records = [
  {
    id: "investment-research",
    years: "2021.10—2022.04",
    title: "厦门瑞晟投资",
    role: "数据分析师 · 厦门",
    introduction: "从金融数据出发，整理净值、持仓与风险指标，为投研分析提供依据。",
    statement: "在数据中，寻找规律。",
    description: "跟踪 MOM 投资组合中的私募产品表现，使用 Python 进行数据采集、清洗与可视化，参与策略回测和信号研究。",
    image: "/timeline/foundations.webp",
    imageAlt: "细密的矿物枝条从晶石中生长的概念图",
    caption: "01 / 数据与分析 · 概念配图",
    background: "/timeline/archive-background.webp",
    width: 1024,
    height: 1536,
    compact: true
  },
  {
    id: "futures",
    years: "2022.06—2023.02",
    title: "格林大华期货 · 福建分公司",
    role: "期货客户经理 · 厦门",
    introduction: "连接业务与技术，在客户服务之外探索 Python 量化策略。",
    statement: "把判断，变成可验证的过程。",
    description: "负责客户维护与投教，在无限易平台编写策略，开展行情采集、指标计算和回测。任职期间取得期货从业资格证。",
    image: "/timeline/systems.webp",
    imageAlt: "银色丝线交织成环形结构的概念图",
    caption: "02 / 策略与验证 · 概念配图",
    background: "/timeline/archive-background.webp",
    width: 1536,
    height: 1024,
    compact: true
  },
  {
    id: "data-automation",
    years: "2023.09—2024.09",
    title: "厦门飞瑞来健康科技有限公司",
    role: "数据专员 · 厦门",
    introduction: "整合药品销售流向与费用数据，为商务、财务和销售提供统一报表。",
    statement: "让重复工作，交给自动化。",
    description: "使用 Python、Pandas 和 Excel 工具链，串联清洗、匹配、汇总与校验；将月度、季度报表整理成可重复执行的流程，并沉淀模板与 SOP。",
    image: "/timeline/foundations.webp",
    imageAlt: "矿物枝条汇聚成结构的概念图",
    caption: "03 / Python · 数据处理 · 报表自动化",
    background: "/timeline/laboratory-background.webp",
    width: 1024,
    height: 1536,
    compact: false
  },
  {
    id: "creative-automation",
    years: "2024.11—2025.02",
    title: "厦门蓝咖生物科技有限公司",
    role: "新媒体技术运营 · 厦门",
    introduction: "将生成式 AI 与运营流程结合，搭建图文、视频的内容生产与发布工作流。",
    statement: "从一张图，到一套生产流程。",
    description: "使用 Stable Diffusion、ComfyUI 生成视觉素材，以 Dify、扣子辅助文案生产，结合 Python、FFmpeg 与浏览器自动化完成素材处理、视频混剪和定时发布。",
    image: "/timeline/systems.webp",
    imageAlt: "交织的银色环形网络，作为工作流的概念配图",
    caption: "04 / ComfyUI · Python · FFmpeg",
    background: "/timeline/laboratory-background.webp",
    width: 1536,
    height: 1024,
    compact: false
  },
  {
    id: "ai-product",
    years: "2025.03—2025.10",
    title: "福建数版卫士数字科技有限公司",
    role: "AI 产品经理 → AI 模型后端开发 · 厦门",
    introduction: "从需求调研、PRD 与原型设计，到模型评估与工作流落地，随后转岗负责 AI 语音项目后端。",
    statement: "把 AI 能力，做成可用的产品。",
    description: "以 Go 构建 Web 服务、Python 承接 TTS 推理，整合 RabbitMQ、OSS 与 MySQL，完成用户管理、任务调度和音频存储；同时研发 RPA 工具与可复用的 AI 工作流。",
    image: "/timeline/practice.webp",
    imageAlt: "悬浮晶石从白色粒子雾中浮现的概念图",
    caption: "05 / Go · Python · TTS · RabbitMQ",
    background: "/timeline/observatory-background.webp",
    width: 1024,
    height: 1536,
    compact: false
  },
  {
    id: "ai-finance-venture",
    years: "2026.03—今",
    title: "AI 金融创业",
    role: "创业 · 产品与全栈开发",
    introduction: "围绕投资研究与辅助决策开展 AI 金融创业，将策略研究、数据工程和产品开发连接起来。",
    statement: "从策略研究，到日常可用的产品。",
    description: "落地多资产投资组合系统，实盘规模 120 万元；独立设计开发 TrendML 期货量化平台，模型策略用于 100 万元实盘，模型与因子组合用于 1500 万元模拟盘。覆盖策略计算、交易执行、异常恢复、监控与 Web 前端。",
    image: "/portfolio/multi-asset-portfolio/net-value.webp",
    imageAlt: "多资产量化投资组合系统的每日净值实机界面",
    caption: "06 / 多资产量化投资组合 · 前端实机截图",
    projects: [
      { label: "多资产投资组合 ↗", href: multiAssetPortfolio.href },
      { label: "TrendML 期货量化 ↗", href: trendml.href },
    ],
    background: "/timeline/observatory-background.webp",
    width: 1920,
    height: 1080,
    compact: false
  }
] as const;

export const experience = records.map((entry) => ({
  ...entry,
  image: assetUrl(entry.image),
  background: assetUrl(entry.background),
}));
