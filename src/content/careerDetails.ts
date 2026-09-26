import { careerArchive } from "./careerArchive";
import { education } from "./education";

type CareerPage = { heading: string; paragraphs: string[] };

/** 技能详情使用的完整原文，独立于经历页的展示版本。 */
function groupCopy(lines: readonly string[]): CareerPage[] {
  const pages: CareerPage[] = [];
  let heading = "", page: CareerPage | undefined;
  for (const line of lines) {
    if (line.startsWith("**") && line.endsWith("**")) {
      heading = line.slice(2, -2);
      if (page && page.paragraphs.length === 0) page.heading += ` · ${heading}`;
      else { page = { heading, paragraphs: [] }; pages.push(page); }
    } else {
      if (!page || page.paragraphs.length >= 3 || page.paragraphs.join("").length + line.length > 210) {
        page = { heading, paragraphs: [] }; pages.push(page);
      }
      page.paragraphs.push(line);
    }
  }
  return pages.filter(page => page.paragraphs.length > 0);
}

const careerIds: Record<string, string> = {
  "xiamen-ruisheng": "investment-research",
  "green-dahua-futures": "futures",
  "fairylife-health": "data-automation",
  "lanka-bio-techops": "creative-automation",
  "fjsbws-ai-pm": "ai-product",
};

export const careerDetails = [
  {
    id: "university", years: "大学 · 本科", title: education.title, role: education.role,
    pages: groupCopy(education.description),
  },
  ...[...careerArchive].reverse().map(entry => ({
    id: careerIds[entry.id], years: `${entry.startDate}—${entry.endDate}`, title: entry.company,
    role: entry.title,
    pages: [...groupCopy(entry.description),
      { heading: "技术与工具", paragraphs: [entry.technologies.join(" · ")] }],
  })),
  {
    id: "ai-finance-venture", years: "2026.03—今", title: "AI 金融创业", role: "产品与全栈开发",
    pages: [{
      heading: "从策略研究，到日常可用的产品。",
      paragraphs: [
        "围绕投资研究与辅助决策开展 AI 金融创业，将策略研究、数据工程和产品开发连接起来。",
        "落地多资产投资组合系统，实盘规模 120 万元；独立设计开发 TrendML 期货量化平台，模型策略用于 100 万元实盘，模型与因子组合用于 1500 万元模拟盘。覆盖策略计算、交易执行、异常恢复、监控与 Web 前端。",
      ],
    }],
  },
];
