const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Stateless selection also handles fast scroll, reverse scroll and restored positions. */
export function careerReadingState(scroll: number, starts: readonly number[], end: number, height: number) {
  if (!starts.length) return { index: 0, progress: 0 };
  let index = 0;
  // Switch the single date once the next background dominates the crossfade.
  for (let i = 1; i < starts.length; i++) {
    if (scroll >= starts[i] - height * .34) index = i;
    else break;
  }
  const readingStart = starts[index] - (index === 0 ? 0 : height * .12);
  const readingEnd = index + 1 < starts.length ? starts[index + 1] - height * .72 : end;
  return { index, progress: clamp((scroll - readingStart) / Math.max(1, readingEnd - readingStart)) };
}
