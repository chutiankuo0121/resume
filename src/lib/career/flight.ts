/** Scroll is the source of truth, so revisiting a chapter restores its space. */
// Crystal assets use a much smaller world scale than the former tunnel.
export const FLIGHT_PER_SCREEN = 2.4;

export function flightTarget(scroll: number, start: number, end: number, height: number) {
  return (Math.max(start, Math.min(Math.max(start, end), scroll)) - start)
    / Math.max(1, height) * FLIGHT_PER_SCREEN;
}

export function advanceFlight(position: number, target: number, dt: number, snap = false) {
  const elapsed = Math.min(.05, Math.max(0, dt));
  // Anchor jumps and restoring a hidden tab must not turn into a long warp burst.
  if (snap || Math.abs(target - position) > FLIGHT_PER_SCREEN * 2.5) {
    return { position: target, velocity: 0 };
  }
  const delta = (target - position) * (1 - Math.exp(-10 * elapsed));
  return { position: position + delta, velocity: elapsed ? delta / elapsed : 0 };
}
