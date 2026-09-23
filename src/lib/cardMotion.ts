/** 屏幕坐标让 DOM 详情能从三维卡片或普通按钮的位置展开。 */
export type CardOrigin = { left: number; top: number; width: number; height: number };

export function cardOrigin(element: Element): CardOrigin {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}
