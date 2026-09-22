/** 相对于首页黑洞的倍率；只改变尺寸，不改雾场、光晕与粒子算法。 */
export const LOADING_HOLE = {
  initialScale: 0.14,
  loadedScale: 0.32,
  completeHold: 0.2,
  expansionDuration: 0.72,
} as const;

export function loadingHoleScale(progress: number, expansion: number) {
  const small = LOADING_HOLE.initialScale
    + (LOADING_HOLE.loadedScale - LOADING_HOLE.initialScale) * progress;
  return small + (1 - small) * expansion;
}
