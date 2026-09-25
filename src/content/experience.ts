import { careerArchive } from "./careerArchive";
import { education } from "./education";
import multiAssetPortfolio from "./works/multi-asset-portfolio";
import trendml from "./works/trendml";

export type CareerPage = { heading: string; paragraphs: string[] };
export type CareerEntry = {
  id: string;
  years: string;
  title: string;
  role: string;
  location?: string;
  imageAlt: string;
  ink: string;
  pages: CareerPage[];
  technologies: readonly string[];
  projects?: { label: string; href: string }[];
};

/** 按原有小标题分页，正文逐字保留；同一场景中留出完整阅读时间。 */
export function paginateCareerCopy(lines: readonly string[]): CareerPage[] {
  const pages: CareerPage[] = [];
  let heading = "", page: CareerPage | undefined;
  for (const line of lines) {
    if (line.startsWith("**") && line.endsWith("**")) {
      heading = line.slice(2, -2);
      if (page && page.paragraphs.length === 0) {
        page.heading += ` · ${heading}`;
      } else {
        page = { heading, paragraphs: [] };
        pages.push(page);
      }
    } else {
      if (!page || page.paragraphs.length >= 3 ||
          page.paragraphs.join("").length + line.length > 210) {
        page = { heading, paragraphs: [] };
        pages.push(page);
      }
      page.paragraphs.push(line);
    }
  }
  return pages.filter(page => page.paragraphs.length > 0);
}

const artwork: Record<string, { id: string; imageAlt: string; ink: string }> = {
  "xiamen-ruisheng": { id: "investment-research", imageAlt: "全景书房线稿中，地球仪、台灯与研究笔记逐一落位", ink: "#2b5873" },
  "green-dahua-futures": { id: "futures", imageAlt: "全景海港线稿中，灯塔、望远镜与近景礁石逐一落位", ink: "#935239" },
  "fairylife-health": { id: "data-automation", imageAlt: "全景工坊线稿中，打字机、卷纸装置与纸带逐一落位", ink: "#37645e" },
  "lanka-bio-techops": { id: "creative-automation", imageAlt: "全景影像工作室线稿中，摄影机、灯具与照片胶片逐一落位", ink: "#954d40" },
  "fjsbws-ai-pm": { id: "ai-product", imageAlt: "全景声音工作室线稿中，麦克风、录音机与调音台逐一落位", ink: "#435984" },
};

export const experience: CareerEntry[] = [
  {
    id: "university", years: "大学 · 本科", title: education.title, role: education.role,
    imageAlt: "全景校园线稿中，教学楼、高楼与湖畔植物逐一飞入，组成彩色校园拼贴",
    ink: "#335f80", pages: paginateCareerCopy(education.description), technologies: [],
  },
  ...[...careerArchive].reverse().map(entry => ({
    id: artwork[entry.id].id, years: `${entry.startDate}—${entry.endDate}`, title: entry.company,
    role: entry.title, location: entry.location,
    imageAlt: artwork[entry.id].imageAlt, ink: artwork[entry.id].ink,
    pages: [...paginateCareerCopy(entry.description),
      { heading: "技术与工具", paragraphs: [entry.technologies.join(" · ")] }],
    technologies: entry.technologies,
  })),
  {
    id: "ai-finance-venture", years: "2026.03—今", title: "AI 金融创业", role: "产品与全栈开发",
    imageAlt: "全景海岸线稿中，天文台、望远镜与前景花园逐一落位",
    ink: "#385e57",
    pages: [
      { heading: "从策略研究，到日常可用的产品。", paragraphs: ["围绕投资研究与辅助决策开展 AI 金融创业，将策略研究、数据工程和产品开发连接起来。", "落地多资产投资组合系统，实盘规模 120 万元；独立设计开发 TrendML 期货量化平台，模型策略用于 100 万元实盘，模型与因子组合用于 1500 万元模拟盘。覆盖策略计算、交易执行、异常恢复、监控与 Web 前端。"] },
    ],
    technologies: [],
    projects: [
      { label: "多资产投资组合 ↗", href: multiAssetPortfolio.href },
      { label: "TrendML 期货量化 ↗", href: trendml.href },
    ],
  },
];
