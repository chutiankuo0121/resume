export const CAREER_ENTRY = 1.65;
export const CAREER_PAGE = 1.05;
export const CAREER_EXIT = .9;

export const careerRunway = (pages: number) => CAREER_ENTRY + pages * CAREER_PAGE + CAREER_EXIT;
export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function smooth(from: number, to: number, value: number) {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
}

/** Scroll distance is in stage heights; direct evaluation also handles jumps,
 * reverse scrolling and resize without waiting for an enter/leave callback. */
export function careerPose(time: number, pages: number, first: boolean, last: boolean) {
  const readingEnd = CAREER_ENTRY + pages * CAREER_PAGE;
  const exit = last ? 0 : smooth(readingEnd, readingEnd + CAREER_EXIT, time);
  return {
    background: first ? 1 : smooth(0, .55, time),
    assembly: smooth(.30, 1.18, time),
    subject: smooth(.48, 1.36, time),
    foreground: smooth(.68, 1.54, time),
    text: smooth(1.22, 1.62, time) * (1 - (last ? 0 : smooth(readingEnd - .12, readingEnd + .28, time))),
    opacity: 1 - exit,
    page: Math.max(0, Math.min(pages - 1, Math.floor((time - CAREER_ENTRY) / CAREER_PAGE))),
  };
}

export function careerPageOpacity(time: number, index: number, pages: number, last: boolean) {
  const local = (time - CAREER_ENTRY) / CAREER_PAGE - index;
  const appear = index === 0 ? 1 : smooth(0, .13, local);
  const disappear = index === pages - 1 ? 0 : smooth(.83, .98, local);
  if (index === 0 && local < 0) return 1;
  if (index === pages - 1 && last && local >= 0) return appear;
  return appear * (1 - disappear);
}
