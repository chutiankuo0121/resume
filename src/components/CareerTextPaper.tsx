// Broad hand-torn contours sit outside the text's safe area. Fine fibers come
// from the shared paper filter; neither effect is applied to the live text.
const outlines = [
  "M45 30 L119 18 L187 25 L261 11 L343 23 L421 16 L502 28 L589 14 L664 23 L738 12 L812 25 L895 17 L949 33 L979 72 L971 155 L987 227 L974 303 L984 388 L971 461 L987 547 L977 622 L989 706 L974 778 L982 862 L970 928 L936 974 L860 982 L789 969 L710 984 L633 976 L547 990 L472 976 L391 985 L315 970 L235 986 L162 976 L88 982 L31 956 L18 886 L27 811 L12 736 L25 656 L16 579 L28 502 L14 425 L24 349 L12 269 L27 190 L18 116 Z",
  "M39 48 L96 22 L174 31 L250 17 L324 27 L403 13 L481 24 L557 16 L638 29 L714 18 L792 29 L871 15 L945 29 L974 64 L983 139 L972 217 L987 294 L976 371 L985 445 L973 530 L985 608 L973 689 L988 766 L976 844 L983 925 L948 971 L877 985 L797 976 L721 989 L641 973 L561 985 L489 975 L409 990 L329 978 L254 987 L178 972 L104 985 L46 966 L24 904 L13 824 L28 747 L17 665 L29 589 L14 507 L25 432 L16 349 L27 272 L13 192 L29 116 Z",
];

export default function CareerTextPaper({ id, index }: { id: string; index: number }) {
  const outline = outlines[index % outlines.length];
  return (
    <svg className="career-note-paper" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`${id}-note-clip`}><path d={outline} /></clipPath>
        <filter id={`${id}-note-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" seed={index + 23} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <g filter={`url(#${id}-torn)`}>
        <path d={outline} fill="#f8f3e8" />
        <g clipPath={`url(#${id}-note-clip)`} opacity=".065">
          <rect width="1000" height="1000" filter={`url(#${id}-note-grain)`} />
        </g>
      </g>
    </svg>
  );
}
