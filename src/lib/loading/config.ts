/** 圆角进度条 → C → 穿过笔画揭幕；长度为设计像素，时间为秒。 */
export const LOADING_PRELUDE = {
  barLength: 240,
  strokeWidth: 30,
  arcSweep: Math.PI * 1.5,
  completeHold: 0.12,
  morphDuration: 0.86,
  letterHold: 0.18,
  zoomDuration: 1.55,
} as const;
