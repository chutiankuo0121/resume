import type { RefObject } from "react";

/** 目录由两侧光边汇合揭幕；联系页沿单一光边从下向上显露。 */
export default function ChapterMasks({ ref }: { ref: RefObject<SVGSVGElement | null> }) {
  return (
    <svg ref={ref} className="chapter-masks" aria-hidden="true" width="0" height="0">
      <defs>
        <filter id="chapter-entry-feather" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <mask id="contact-collage-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="-128" y="-128" width="4096" height="4096" style={{ maskType: "alpha" }}>
          <path data-curtain="collage" fill="#fff" />
        </mask>
        <mask id="chapter-entry-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="-128" y="-128" width="4096" height="4096" style={{ maskType: "alpha" }}>
          <path data-curtain="entry" fill="#fff" filter="url(#chapter-entry-feather)" />
        </mask>
      </defs>
    </svg>
  );
}
