import { useId } from "react";
import type { Skill } from "@/content/skills";

/** 静态视图共用卡片的三段调色；SVG 在浏览器内处理，不下载另一套彩色素材。 */
export function SkillArtwork({
  skill,
  className,
  loading,
}: {
  skill: Skill;
  className?: string;
  loading?: "lazy";
}) {
  const filterId = `skill-color-${useId()}`;
  // 与 Three.Color 的 sRGB → 线性光转换一致，让详情与 Shader 的颜色保持统一。
  const stops = [skill.palette.shadow, skill.palette.tone, skill.palette.light].map(hex =>
    [1, 3, 5].map(offset => {
      const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }),
  );
  const table = (channel: number) => stops.map(stop => stop[channel]).join(" ");
  return (
    <>
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <filter id={filterId} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="linearRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="table" tableValues={table(0)} />
              <feFuncG type="table" tableValues={table(1)} />
              <feFuncB type="table" tableValues={table(2)} />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <img className={className} src={skill.image} alt={skill.alt} loading={loading} style={{ filter: `url(#${filterId})` }} />
    </>
  );
}
