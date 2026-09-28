import { careerArchive } from "./careerArchive";
import { education } from "./education";
import { trendmlCareerPages } from "./trendmlCareer";
import { portfolioCareerPages } from "./portfolioCareer";

type CareerPage = { heading: string; paragraphs: string[] };

/** 将原始经历文本中的标题归组，保留原文顺序。 */
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
    id: "university", years: `${education.startDate}—${education.endDate}`, title: education.title, role: education.role,
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
    pages: [
      ...trendmlCareerPages,
      ...portfolioCareerPages,
    ],
  },
];
