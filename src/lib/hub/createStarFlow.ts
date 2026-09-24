import { createChapterEdge, EDGE_SAMPLES } from "../chapters/createChapterEdge";
import { starBoundaryCurve, starSeparation, type BoundaryState } from "./boundaryField";

/** The two incoming seams converge onto the persistent work/skills boundary. */
export function createStarFlow(canvas: HTMLCanvasElement, state: BoundaryState) {
  const light = createChapterEdge(canvas);
  const upper = Array.from({ length: EDGE_SAMPLES }, () => ({ x: 0, y: 0 }));
  const lower = Array.from({ length: EDGE_SAMPLES }, () => ({ x: 0, y: 0 }));
  return {
    resize(width: number, height: number) { light.resize(width, height); },
    render() {
      const t = Math.max(0, Math.min(1, state.gather));
      const separation = starSeparation(t, state.height);
      const presence = 1 - Math.min(1, state.expansion / .82);
      for (let i = 0; i < EDGE_SAMPLES; i++) {
        const x = i / (EDGE_SAMPLES - 1), px = x * state.width;
        const base = starBoundaryCurve(x, state) * state.height;
        upper[i].x = lower[i].x = px;
        upper[i].y = base - separation;
        lower[i].y = base + separation;
      }
      light.render(upper, t < 1 ? lower : null, state.time, presence,
        { x: state.pointerX * state.width, y: state.pointerY * state.height,
          strength: state.pointerStrength, flow: 0 });
      return { upper, lower };
    },
    dispose() { light.dispose(); },
  };
}
