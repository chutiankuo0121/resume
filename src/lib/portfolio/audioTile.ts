import { CanvasTexture, SRGBColorSpace } from "three";
import type { AudioWork } from "@/content/works";
import { canvasFont } from "../typography";

/** SBS 的音频入口是横向文字流；单份文字贴图循环采样，不逐帧重绘 Canvas。 */
export function createAudioTile(work: AudioWork) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const text = `${work.title}   ·   ${work.source?.author ?? "Sound"}   /   `;
  const font = canvasFont("heading", 54);
  ctx.font = font;
  canvas.width = Math.ceil(ctx.measureText(text).width + 60);
  canvas.height = 128;
  ctx.font = font;
  ctx.fillStyle = "#252521";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 30, 64);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, textWidth: canvas.width / canvas.height };
}

export const audioFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uSize;
uniform float uRadius;
uniform float uHover;
uniform float uTime;
uniform float uDirection;
uniform float uTextWidth;
varying vec2 vUv;
void main() {
  vec2 p = (vUv - .5) * uSize;
  vec2 corner = abs(p) - uSize * .5 + uRadius;
  float d = length(max(corner, 0.)) + min(max(corner.x, corner.y), 0.) - uRadius;
  float mask = 1. - smoothstep(-fwidth(d), fwidth(d), d);
  // 字体以世界尺寸保持稳定，不随每个横带的长宽被拉扁。
  float textHeight = min(.62, uSize.y * .78);
  vec2 uv = vec2(fract((vUv.x * uSize.x + uTime * .12 * uDirection) /
    (uTextWidth * textHeight)), p.y / textHeight + .5);
  vec4 text = texture2D(uMap, uv);
  float inside = step(0., uv.y) * step(uv.y, 1.);
  float edge = smoothstep(.07, .24, uSize.x * .5 - abs(p.x));
  vec3 colour = mix(vec3(.93, .93, .905), vec3(.985), uHover * .5);
  colour = mix(colour, text.rgb, text.a * inside * edge);
  // 两端的细竖线收住滚动文字，与相邻彩色影像共用圆角和白色细缝。
  float cap = (1. - smoothstep(.009, .018, abs(abs(p.x) - uSize.x * .5 + .075))) *
    (1. - smoothstep(uSize.y * .16, uSize.y * .2, abs(p.y)));
  colour = mix(colour, vec3(.18), cap);
  gl_FragColor = vec4(colour, mask);
}`;
