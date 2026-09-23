import data from "./gallery.generated.json";
import type { WorkKind } from "./types";
import type { PortfolioLayout } from "@/lib/portfolio/layout";

/** 墙面只携带可见信息；完整说明、影音地址和项目长文在点击时加载。 */
export type WorkSummary = {
  id: string;
  kind: WorkKind;
  title: string;
  cover: string;
  alt: string;
  author?: string;
};

export const works = data.works as WorkSummary[];
export const workById = new Map(works.map(work => [work.id, work]));
export const portfolioLayout: PortfolioLayout = data.layout;
export const portfolioMedia = data.media.map(item => ({
  ...item,
  kind: item.kind as WorkKind,
  work: workById.get(item.id)!,
}));
export type PortfolioMedia = typeof portfolioMedia[number];
