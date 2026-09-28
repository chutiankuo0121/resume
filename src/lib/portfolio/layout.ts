// 格线、媒体、拾取和循环边界都从这一份布局取坐标。
export type Rect = { x: number; y: number; width: number; height: number };
export type LayoutMedia = {
  key: string;
  width: number;
  height: number;
  main: boolean;
  kind: string;
};
export type PortfolioLayout = {
  width: number;
  height: number;
  cells: Rect[];
  items: { key: string; media: Rect }[];
};

export const GRID = { radius: 0.22, seam: 0.012, inset: 0.018 };
