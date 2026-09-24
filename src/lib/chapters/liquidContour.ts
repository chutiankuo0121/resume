import type { EdgePoint } from "./createChapterEdge";

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
function noise(x: number, y: number) {
  const hash = (a: number, b: number) => {
    const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(x - ix), fy = smooth(y - iy);
  const a = hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx;
  const b = hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx;
  return (a * (1 - fy) + b * fy) * 2 - 1;
}

/** Solve a moving 2D threshold, rather than translating a fixed wavy line.
 * Its vertical derivative stays positive (> .47), so each column has one
 * continuous boundary: no branch jumps or disconnected click regions. */
export function createLiquidContour(count: number) {
  const columns = 97;
  const heights = new Float64Array(columns);
  const lag = new Float64Array(columns), springVelocity = new Float64Array(columns);
  const previous = new Float64Array(count).fill(NaN);
  const points: EdgePoint[] = Array.from({ length: count }, () => ({ x: 0, y: 0 }));
  const velocities = new Float32Array(count);
  const result = { points, velocities, flow: 0 };
  let phase = 0, lastProgress = 0, speed = 0;
  return {
    reset(progress: number) {
      lastProgress = progress; speed = 0; result.flow = 0;
      lag.fill(0); springVelocity.fill(0); previous.fill(NaN); velocities.fill(0);
    },
    update(progress: number, elapsed: number, width: number, height: number,
      pointer: { x: number; y: number; strength: number }) {
      const dt = clamp(elapsed, 0, .05);
      if (dt > 0) {
        phase += dt;
        const input = clamp((progress - lastProgress) / dt, -3, 3);
        speed += (input - speed) * (1 - Math.exp(-dt * 10));
        lastProgress = progress;
        result.flow += (Math.min(1, Math.abs(speed)) - result.flow) * (1 - Math.exp(-dt * 5));
      }
      const envelope = smooth(progress / .14) * smooth((1 - progress) / .14);
      const sweep = .75 * smooth(progress) + .25 * progress;
      const level = 1.35 - 1.7 * sweep;
      for (let i = 0; i < columns; i++) {
        const x = i / (columns - 1);
        const warp = noise(x * 1.2 + 3.7, phase * .1) * .7;
        const broadPhase = x * 5.3 + warp + phase * .19;
        const secondaryPhase = x * 10.9 + warp * 1.2 - phase * .13;
        const offset = noise(x * 4.1 + warp, phase * .08) * .035;
        let low = level - .3, high = level + .3;
        for (let j = 0; j < 12; j++) {
          const y = (low + high) * .5;
          const field = y + Math.sin(broadPhase + y * 1.8) * .125
            + Math.sin(secondaryPhase - y * 3) * .065 + offset
            + noise(x * 19 + phase * .11, y * 2.1 + phase * .15) * .017;
          if (field < level) low = y; else high = y;
        }
        // Local drag depends on position; stopping releases it without moving
        // the entire page away from the user's chosen scroll position.
        const viscosity = .65 + noise(x * 3.4 + 7, phase * .06) * .35;
        const target = speed * height * .04 * viscosity * envelope;
        const steps = Math.max(1, Math.ceil(dt * 120)), step = dt / steps;
        for (let j = 0; j < steps; j++) {
          springVelocity[i] += ((target - lag[i]) * 130 - springVelocity[i] * 23) * step;
          lag[i] += springVelocity[i] * step;
        }
        heights[i] = (low + high) * .5 * height + lag[i] * envelope;
      }
      const sample = (i: number) => heights[clamp(i, 0, columns - 1)];
      for (let i = 0; i < count; i++) {
        const x = i / (count - 1), px = x * width;
        const index = x * (columns - 1), k = Math.floor(index), t = index - k;
        const a = sample(k - 1), b = sample(k), c = sample(k + 1), d = sample(k + 2);
        const base = .5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t
          + (-a + 3 * b - 3 * c + d) * t * t * t);
        const grain = noise(px * .042 + phase * .25, phase * .55) * (3 + result.flow * 3)
          + noise(px * .19, phase * .7) * 1.2;
        // Halve deformation around the travelling baseline, including local drag
        // and fine ripples; scrolling distance and the animation clock stay intact.
        const contour = level * height + (base + grain - level * height) * .5;
        const local = Math.exp(-(((px - pointer.x) / 105) ** 2) - ((contour - pointer.y) / 135) ** 2)
          * pointer.strength;
        const y = contour + local * Math.tanh((pointer.y - contour) / 45) * 24;
        points[i].x = px; points[i].y = y;
        if (Number.isFinite(previous[i]) && dt > 0) {
          const velocity = clamp((y - previous[i]) / dt, -1600, 1600);
          velocities[i] += (velocity - velocities[i]) * (1 - Math.exp(-dt * 9));
        }
        if (dt > 0 || !Number.isFinite(previous[i])) previous[i] = y;
      }
      return result;
    },
  };
}
