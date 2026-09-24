import { createChapterEdge, EDGE_SAMPLES } from "../chapters/createChapterEdge";
import { boundarySamples, starSeparation, type BoundaryState } from "./boundaryField";
import { createLiquidContour } from "../chapters/liquidContour";

/** The two incoming seams converge onto the persistent work/skills boundary. */
export function createStarFlow(canvas: HTMLCanvasElement, state: BoundaryState) {
  const light = createChapterEdge(canvas);
  const upper = Array.from({ length: EDGE_SAMPLES }, () => ({ x: 0, y: 0 }));
  const lower = Array.from({ length: EDGE_SAMPLES }, () => ({ x: 0, y: 0 }));
  const samples = boundarySamples(state);
  const liquid = createLiquidContour(EDGE_SAMPLES);
  const velocities = new Float32Array(EDGE_SAMPLES), lowerVelocities = new Float32Array(EDGE_SAMPLES);
  const previousUpper = new Float64Array(EDGE_SAMPLES).fill(NaN);
  const previousLower = new Float64Array(EDGE_SAMPLES).fill(NaN);
  const noPointer = { x: 0, y: 0, strength: 0 };
  return {
    resize(width: number, height: number) {
      light.resize(width, height);
      liquid.reset(.35 + .3 * state.gather);
      previousUpper.fill(NaN); previousLower.fill(NaN);
      velocities.fill(0); lowerVelocities.fill(0);
    },
    render(dt: number) {
      const t = Math.max(0, Math.min(1, state.gather));
      const separation = starSeparation(t, state.height);
      const presence = 1 - Math.min(1, state.expansion / .82);
      const field = liquid.update(.35 + .3 * t, dt, state.width, state.height, noPointer);
      // Remove bulk vertical travel but retain the changing lobes and local drag.
      // After convergence, time keeps evolving the same field without a reset.
      const mean = field.points.reduce((sum, point) => sum + point.y, 0) / EDGE_SAMPLES;
      const pointerY = state.pointerY * state.height;
      const follow = 1 - Math.exp(-dt * 9);
      for (let i = 0; i < EDGE_SAMPLES; i++) {
        const x = i / (EDGE_SAMPLES - 1), px = x * state.width;
        const wave = (field.points[i].y - mean) * .65;
        const base = (.91 - x * .82 + state.hover * .022 * Math.sin(Math.PI * x)) * state.height + wave;
        // Positive local spacing lets sections catch up at different rates without
        // ever crossing. Both sides become exactly the same curve at t=1.
        const drag = 1 + Math.sin(Math.PI * t) * (Math.sin(x * 8.3 + state.time * .19 + t * 4) * .1
          + Math.sin(x * 17.1 - state.time * .13 - t * 5) * .05);
        const gap = separation * drag;
        const displace = (y: number) => {
          const dx = (px - state.pointerX * state.width) / 105;
          const dy = (y - pointerY) / 135;
          const push = Math.exp(-dx * dx - dy * dy) * state.pointerStrength
            * Math.tanh((pointerY - y) / 45) * 24 * presence;
          return (y + push) * (1 - state.expansion)
            + (state.destination === "work" ? 1.4 : -.4) * state.height * state.expansion;
        };
        upper[i].x = lower[i].x = px;
        const top = displace(base - gap), bottom = displace(base + gap);
        upper[i].y = top; lower[i].y = bottom;
        samples.set([top / state.height, bottom / state.height, (top + bottom) / (2 * state.height), 0], i * 4);
        if (dt > 0 && Number.isFinite(previousUpper[i])) {
          velocities[i] += (Math.max(-1600, Math.min(1600, (top - previousUpper[i]) / dt)) - velocities[i]) * follow;
          lowerVelocities[i] += (Math.max(-1600, Math.min(1600, (bottom - previousLower[i]) / dt)) - lowerVelocities[i]) * follow;
        }
        if (dt > 0 || !Number.isFinite(previousUpper[i])) {
          previousUpper[i] = top; previousLower[i] = bottom;
        }
      }
      light.render(upper, t < 1 ? lower : null, state.time, presence,
        { x: state.pointerX * state.width, y: state.pointerY * state.height,
          strength: state.pointerStrength, flow: field.flow, velocities, lowerVelocities });
      return { upper, lower };
    },
    dispose() { light.dispose(); },
  };
}
