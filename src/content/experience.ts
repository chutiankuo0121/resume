import multiAssetPortfolio from "./works/multi-asset-portfolio";
import trendml from "./works/trendml";
import { careerDetails } from "./careerDetails";

/** Chapter introductions augment the original copy. */
const presentation = [
  {
    introduction: "", statement: "",
  },
  {
    introduction: "从金融数据出发，整理净值、持仓与风险指标，为投研分析提供依据。",
    statement: "在数据中，寻找规律。",
  },
  {
    introduction: "连接业务与技术，在客户服务之外探索 Python 量化策略。",
    statement: "把判断，变成可验证的过程。",
  },
  {
    introduction: "整合药品销售流向与费用数据，为商务、财务和销售提供统一报表。",
    statement: "让重复工作，交给自动化。",
  },
  {
    introduction: "将生成式 AI 与运营流程结合，搭建图文、视频的内容生产与发布工作流。",
    statement: "从一张图，到一套生产流程。",
  },
  {
    introduction: "从需求调研、PRD 与原型设计，到模型评估与工作流落地，随后转岗负责 AI 语音项目后端。",
    statement: "把 AI 能力，做成可用的产品。",
  },
  {
    introduction: "", statement: "",
    projects: [
      { label: "多资产投资组合 ↗", href: multiAssetPortfolio.href },
      { label: "TrendML 期货量化 ↗", href: trendml.href },
    ],
  },
] as const;

export const experience = careerDetails.map((entry, index) => {
  const art = presentation[index];
  const sections: { heading: string; paragraphs: string[] }[] = [];
  for (const page of entry.pages) {
    const previous = sections.at(-1);
    if (previous?.heading === page.heading) previous.paragraphs.push(...page.paragraphs);
    else sections.push({ heading: page.heading, paragraphs: [...page.paragraphs] });
  }
  return { ...entry, ...art, sections };
});
