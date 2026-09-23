import { boundaryGLSL } from "../hub/boundaryField";

export const tileVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

export const tileFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uFit;
uniform vec2 uSize;
uniform float uRadius;
uniform float uHover;
varying vec2 vUv;
void main() {
  // 圆角写在网格材质里，后处理会连边缘一起弯曲。
  vec2 p = abs((vUv - .5) * uSize) - uSize * .5 + uRadius;
  float d = length(max(p, 0.0)) + min(max(p.x, p.y), 0.0) - uRadius;
  float aa = max(fwidth(d), .0005);
  float mask = 1.0 - smoothstep(-aa, aa, d);
  vec2 uv = (vUv - .5) / uFit + .5;
  if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) discard;
  vec4 sampleColor = texture2D(uMap, uv);
  // 界面仍用黑白纸纹；作品保留原色，避免抹掉海报和绘画的配色信息。
  vec3 colour = mix(sampleColor.rgb, vec3(1.0), uHover * .045);
  gl_FragColor = vec4(colour, sampleColor.a * mask);
}`;

export const screenVertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const gridFragment = /* glsl */ `
varying vec2 vSize;
varying vec2 vUv;
uniform float uRadius;
uniform float uSeam;
void main() {
  vec2 p = abs((vUv - .5) * vSize) - vSize * .5 + uSeam * .5 + uRadius;
  float d = length(max(p, 0.0)) + min(max(p.x, p.y), 0.0) - uRadius;
  float aa = max(fwidth(d), .0005);
  // 格内完全透明，只保留白色接缝与圆角；媒体占据的整个格子不再细分。
  gl_FragColor = vec4(vec3(1.0), smoothstep(-aa, aa, d));
}`;

export const lensFragment = /* glsl */ `
uniform sampler2D uScene;
uniform float uStrength;
varying vec2 vUv;
${boundaryGLSL}
void main() {
  // Brown–Conrady 径向畸变。Storyline 参数 -0.02 × 5.5 = -0.11。
  // 浏览与拖拽共用整屏曲面，预览媒体不改变底下的浏览构图。
  vec2 p = vUv * 2.0 - 1.0;
  vec2 sampleUv = p * (1.0 - .11 * uStrength * dot(p, p)) * .5 + .5;
  vec3 boundary=boundaryField(vUv);
  vec4 layer=boundarySample(uScene,sampleUv,vUv,boundary.y);
  // 边缘散射降低局部反差，与技能的透明雾层共同完成灰阶过渡。
  layer.rgb=mix(layer.rgb,vec3(.42),boundary.y*.18);
  gl_FragColor=vec4(boundaryGrain(layer.rgb,vUv,boundary.y),1.);
  #include <colorspace_fragment>
}`;
