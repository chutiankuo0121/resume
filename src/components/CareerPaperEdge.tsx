/** A static torn-paper backing made from the cutout's alpha. The artwork itself
 * stays untouched and registered; the backing travels with its parent piece. */
export default function CareerPaperEdge({ id, seed }: { id: string; seed: number }) {
  return (
    <filter id={id} x="-3%" y="-3%" width="106%" height="106%" colorInterpolationFilters="sRGB">
      <feComponentTransfer in="SourceAlpha" result="solid">
        <feFuncA type="discrete" tableValues="0 0 1 1" />
      </feComponentTransfer>
      <feMorphology in="solid" operator="dilate" radius="7" result="paper" />
      <feTurbulence type="fractalNoise" baseFrequency=".075 .14" numOctaves="3" seed={seed} result="tear" />
      <feDisplacementMap in="paper" in2="tear" scale="10" xChannelSelector="R" yChannelSelector="G" result="torn" />
      <feTurbulence type="fractalNoise" baseFrequency=".62 .38" numOctaves="2" seed={seed + 17} result="fibers" />
      <feDisplacementMap in="torn" in2="fibers" scale="2" xChannelSelector="R" yChannelSelector="G" result="edge" />
      <feOffset in="edge" dx=".5" dy="1.5" result="under" />
      <feFlood floodColor="#6b573a" floodOpacity=".18" result="shadowColor" />
      <feComposite in="shadowColor" in2="under" operator="in" result="shadow" />
      <feColorMatrix in="fibers" type="matrix" values=".12 0 0 0 .91  0 .12 0 0 .87  0 0 .14 0 .77  0 0 0 0 1" result="paperGrain" />
      <feComposite in="paperGrain" in2="edge" operator="in" result="paperSurface" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="paperSurface" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}
