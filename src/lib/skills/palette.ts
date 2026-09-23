import { Color, MathUtils } from "three";
import type { SkillPalette } from "@/content/skills";

export function createPaletteUniforms(palette: SkillPalette) {
  return {
    uShadow: { value: new Color(palette.shadow) },
    uTone: { value: new Color(palette.tone) },
    uHighlight: { value: new Color(palette.light) },
  };
}

export type PaletteUniforms = ReturnType<typeof createPaletteUniforms>;

/** 颜色绑定实际翻页角度；中途倒滚与首尾循环都沿同一条连续色带返回。 */
export function createEnvironmentPalette(palettes: SkillPalette[]) {
  const stops = palettes.map(createPaletteUniforms);
  const uniforms = createPaletteUniforms(palettes[0]);
  const keys = ["uShadow", "uTone", "uHighlight"] as const;
  return {
    uniforms,
    update(progress: number) {
      const whole = Math.floor(progress);
      const index = MathUtils.euclideanModulo(whole, stops.length);
      const from = stops[index], to = stops[(index + 1) % stops.length];
      const blend = MathUtils.smoothstep(progress - whole, 0, 1);
      // 预分配 Color，只写 uniform；不触发 React 渲染，也不新增离屏渲染。
      for (const key of keys)
        uniforms[key].value.copy(from[key].value).lerp(to[key].value, blend);
    },
  };
}

/** 在线性光空间给灰度笔触分级上色，保留暗部纹理与高光层次。 */
export const paletteGLSL = /* glsl */ `
uniform vec3 uShadow;
uniform vec3 uTone;
uniform vec3 uHighlight;
vec3 paletteColor(float value){
  float t=clamp(value,0.,1.);
  return t<.5 ? mix(uShadow,uTone,t*2.) : mix(uTone,uHighlight,(t-.5)*2.);
}
`;
