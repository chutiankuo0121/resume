import { createAmbientParticleField } from "../particles/createAmbientParticleField";
import type { BoundaryState } from "./boundaryField";

const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

/** Clip the picture rectangle against one straight half-plane. */
function clipFrame(frame: { left: number; top: number; right: number; bottom: number }, slope: number, intercept: number, below: boolean) {
  const { left, top, right, bottom } = frame;
  const corners = [{ x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom }];
  const result: typeof corners = [];
  const distance = (p: typeof corners[number]) => (p.y - (intercept + slope * p.x)) * (below ? 1 : -1);
  for (let i = 0; i < 4; i++) {
    const a = corners[i], b = corners[(i + 1) % 4];
    const da = distance(a), db = distance(b);
    if (da >= 0) result.push(a);
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db);
      result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return result.length ? `polygon(${result.map(p => `${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`).join(",")})` : "polygon(0 0,0 0,0 0)";
}

/** Dust animates continuously; the fixed line is shared analytically with both GPUs. */
export function createInkBoundary(canvas: HTMLCanvasElement, guide: HTMLElement, state: BoundaryState) {
  const context = canvas.getContext("2d")!;
  const field = createAmbientParticleField();
  const frame = { left: 0, top: 0, right: 0, bottom: 0 };
  const line = state.inkLine = { left: 0, right: 0 };
  const geometry = { frame, workClip: "", skillsClip: "", revision: 0 };
  let drawnExpansion = -1, drawnDestination = state.destination;
  let paintedRevision = -1, paintedMode = "";
  let inset = { left: 0, top: 0, right: 0, bottom: 0 };
  return {
    resize(width: number, height: number) {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      field.resize(width, height);
      inset = { left: guide.offsetLeft, top: guide.offsetTop,
        right: width - guide.offsetLeft - guide.offsetWidth,
        bottom: height - guide.offsetTop - guide.offsetHeight };
      drawnExpansion = -1;
    },
    render(dt: number, pointerX: number, pointerY: number, mode: "animate" | "static" | "freeze") {
      const presence = 1 - state.expansion;
      if (drawnExpansion !== state.expansion || drawnDestination !== state.destination) {
        frame.left = inset.left * presence;
        frame.top = inset.top * presence;
        frame.right = state.width - inset.right * presence;
        frame.bottom = state.height - inset.bottom * presence;
        const width = frame.right - frame.left, height = frame.bottom - frame.top;
        const ordinate = (px: number) => {
          const x = (px - frame.left) / width;
          const base = frame.top + (state.width < 800 ? .6 - x * .2 : 1 - (x - .2) / .6) * height;
          const target = (state.destination === "work" ? 1.4 : -.4) * state.height;
          return base * presence + target * state.expansion;
        };
        const start = ordinate(0), end = ordinate(state.width);
        line.left = start / state.height; line.right = end / state.height;
        const slope = (end - start) / state.width;
        geometry.workClip = clipFrame(frame, slope, start, false);
        geometry.skillsClip = clipFrame(frame, slope, start, true);
        geometry.revision++;
        drawnExpansion = state.expansion; drawnDestination = state.destination;
      }
      if (mode !== "animate" && paintedMode === mode && paintedRevision === geometry.revision) return geometry;
      field.update(dt, pointerX, pointerY, mode);
      paintedMode = mode; paintedRevision = geometry.revision;
      const width = frame.right - frame.left, height = frame.bottom - frame.top;
      context.clearRect(0, 0, state.width, state.height);
      context.save();
      context.fillStyle = "#fff";
      context.beginPath();
      context.rect(0, 0, state.width, state.height);
      context.rect(frame.left, frame.top, width, height);
      context.fill("evenodd");
      // Share the mat's exact cutout so dust never covers the artwork or labels.
      context.save();
      context.clip("evenodd");
      context.fillStyle = "#111111";
      const matAlpha = context.globalAlpha;
      for (const particle of field.particles) {
        context.globalAlpha = matAlpha * particle.alpha;
        context.beginPath();
        context.arc(particle.x + particle.offsetX, particle.y + particle.offsetY, particle.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
      context.strokeStyle = "#171717";
      context.lineWidth = 1;
      context.globalAlpha *= smooth(presence / .15);
      context.strokeRect(frame.left + .5, frame.top + .5, width - 1, height - 1);
      context.beginPath();
      context.rect(frame.left, frame.top, width, height);
      context.clip();
      context.beginPath();
      context.moveTo(0, line.left * state.height);
      context.lineTo(state.width, line.right * state.height);
      context.stroke();
      context.restore();
      return geometry;
    },
    dispose() {
      context.clearRect(0, 0, state.width, state.height);
      field.particles.length = 0;
      delete state.inkLine;
    },
  };
}
