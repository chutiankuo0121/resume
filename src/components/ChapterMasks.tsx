import type { RefObject } from "react";

/** 磨砂只遮罩真实页面，不截屏、不复制作品场景，也不占用额外 WebGL 上下文。 */
export default function ChapterMasks({ ref }: { ref: RefObject<SVGSVGElement | null> }) {
  return (
    <svg ref={ref} className="chapter-masks" aria-hidden="true" width="0" height="0">
      <defs>
        <filter id="chapter-frost-edge" x="-100%" y="-100%" width="300%" height="300%">
          <feTurbulence type="fractalNoise" baseFrequency="38 52" numOctaves="2" seed="17" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale=".045" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation=".025" />
        </filter>
        <mask id="chapter-entry-mask" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1" style={{ maskType: "alpha" }}>
          <path data-curtain="entry" fill="#fff" filter="url(#chapter-frost-edge)" />
        </mask>
        <mask id="chapter-exit-mask" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1" style={{ maskType: "alpha" }}>
          <path data-curtain="exit" fill="#fff" filter="url(#chapter-frost-edge)" />
        </mask>
      </defs>
    </svg>
  );
}
