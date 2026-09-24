import type { RefObject } from "react";

/** 经历保留原版磨砂；联系页以单一颗粒边界揭露完整拼贴场景。 */
export default function ChapterMasks({ ref }: { ref: RefObject<SVGSVGElement | null> }) {
  return (
    <svg ref={ref} className="chapter-masks" aria-hidden="true" width="0" height="0">
      <defs>
        <mask id="contact-collage-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="-128" y="-128" width="4096" height="4096" style={{ maskType: "alpha" }}>
          <path data-curtain="collage" fill="#fff" />
        </mask>
        <filter id="chapter-entry-frost-edge" x="-100%" y="-100%" width="300%" height="300%">
          <feTurbulence type="fractalNoise" baseFrequency="38 52" numOctaves="2" seed="17" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale=".045" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation=".025" />
        </filter>
        <mask id="chapter-entry-mask" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1" style={{ maskType: "alpha" }}>
          <path data-curtain="entry" fill="#fff" filter="url(#chapter-entry-frost-edge)" />
        </mask>
      </defs>
    </svg>
  );
}
