import type { RefObject } from "react";

/** Contact's liquid seam mask. Explore uses one stage-wide circular portal. */
export default function ChapterMasks({ ref }: { ref: RefObject<SVGSVGElement | null> }) {
  return (
    <svg ref={ref} className="chapter-masks" aria-hidden="true" width="0" height="0">
      <defs>
        <mask id="contact-collage-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="-128" y="-128" width="4096" height="4096" style={{ maskType: "alpha" }}>
          <path data-curtain="collage" fill="#fff" />
        </mask>
      </defs>
    </svg>
  );
}
