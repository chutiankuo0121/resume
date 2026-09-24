import { boundarySamples, updateBoundaryWake, type BoundaryState } from "../hub/boundaryField";
import type { EdgePoint } from "../chapters/createChapterEdge";

type ContactField = BoundaryState & { active: boolean };
const fields = new WeakMap<HTMLElement, ContactField>();

/** The contact picture and its luminous seam consume the same live contour. */
export function contactTransitionField(stage: HTMLElement): ContactField {
  let field = fields.get(stage);
  if (!field) {
    field = { active: false, expansion: 0, hover: 0, destination: "skills",
      time: 0, width: 1, height: 1, pointerX: -2, pointerY: -2,
      pointerStrength: 0, gather: .5 };
    fields.set(stage, field);
  }
  return field;
}

export function updateContactTransition(
  stage: HTMLElement, points: EdgePoint[], width: number, height: number,
  time: number, strength: number, dt: number,
  pointer: { x: number; y: number; strength: number },
) {
  const field = contactTransitionField(stage);
  field.active = true;
  field.width = width; field.height = height; field.time = time;
  // Reuse the same detail lighting and endpoint fade as the directory.
  field.expansion = (1 - strength) * .45;
  field.pointerX = pointer.x / width; field.pointerY = pointer.y / height;
  field.pointerStrength = pointer.strength;
  const samples = boundarySamples(field);
  points.forEach((point, i) => {
    const y = point.y / height;
    samples.set([y, y, y, 0], i * 4);
  });
  updateBoundaryWake(field, dt);
}
