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
  title: Rect;
  cells: Rect[];
  items: { key: string; media: Rect }[];
};

export const GRID = { radius: 0.12, seam: 0.012, inset: 0.018 };

/** 中央文字等比排入标题格；作品封面由 shader 按 cover 规则铺满。 */
export function contain(rect: Rect, aspect: number): Rect {
  const width = Math.min(rect.width, rect.height * aspect);
  return { x: rect.x, y: rect.y, width, height: width / aspect };
}
