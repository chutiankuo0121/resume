/** Canvas 不继承 CSS；读取同一套变量，避免画布文字与 DOM 各用一份字体配置。 */
export function canvasFont(role: "heading" | "body", size: number) {
  return `400 ${size}px ${getComputedStyle(document.documentElement).getPropertyValue(`--font-${role}`)}`;
}

/** 纹理只绘制一次，必须先加载真实字形，不能把临时后备字体烘焙进画布。 */
export async function loadTypography(text: string) {
  await Promise.all([
    document.fonts.load(canvasFont("heading", 54), text),
    document.fonts.load(canvasFont("body", 24), text),
  ]);
}
