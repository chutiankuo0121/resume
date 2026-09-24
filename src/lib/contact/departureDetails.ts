import { createBoundaryUniforms } from "../hub/boundaryField";
import { contactTransitionField } from "./transitionField";

/** The outgoing directory supplies its own details above the contact seam. */
export function createDepartureDetails(canvas: HTMLCanvasElement) {
  const stage = canvas.closest(".astra")!.querySelector<HTMLElement>(".contact-stage")!;
  const field = contactTransitionField(stage);
  const boundary = createBoundaryUniforms(field);
  const uniforms = {
    uDepartureCurve: boundary.uniforms.uBoundaryCurve,
    uDepartureSize: boundary.uniforms.uBoundarySize,
    uDepartureMotion: boundary.uniforms.uBoundary,
    uDepartureWake: boundary.uniforms.uBoundaryWake,
    uDepartureActive: { value: 0 },
  };
  return {
    uniforms,
    update() {
      uniforms.uDepartureActive.value = field.active ? 1 : 0;
      if (field.active) boundary.update();
    },
    dispose: boundary.dispose,
  };
}

// Included after boundaryGLSL, which supplies the shared detail breakup.
export const departureDetailsGLSL = /* glsl */ `
uniform sampler2D uDepartureCurve;
uniform vec2 uDepartureSize, uDepartureMotion;
uniform vec3 uDepartureWake[6];
uniform float uDepartureActive;
float departureCurve(float x){
  float index=clamp(x*512.,0.,511.999);
  return mix(texture2D(uDepartureCurve,vec2((floor(index)+.5)/513.,.5)).r,
    texture2D(uDepartureCurve,vec2((floor(index)+1.5)/513.,.5)).r,fract(index));
}
vec3 departureDetails(vec3 color,float detail,vec2 uv){
  float left=max(0.,uv.x-8./512.),right=min(1.,uv.x+8./512.);
  float slope=(departureCurve(right)-departureCurve(left))/(right-left)
    *uDepartureSize.y/uDepartureSize.x;
  float distance=((1.-uv.y)-departureCurve(uv.x))*uDepartureSize.y/sqrt(1.+slope*slope);
  float band=(1.-smoothstep(28.,150.,abs(distance)))*smoothstep(2.,10.,abs(distance));
  float hover=0.;
  for(int i=0;i<6;i++){
    vec2 delta=(vec2(uv.x,1.-uv.y)-uDepartureWake[i].xy)*uDepartureSize/105.;
    hover=max(hover,exp(-dot(delta,delta))*uDepartureWake[i].z*(1.-float(i)*.12));
  }
  // Zero on the contact side, including while the pointer deforms the seam.
  float weight=min(1.6,1.+hover*.9)*band*(1.-smoothstep(-2.,0.,distance))
    *(1.-smoothstep(0.,.45,uDepartureMotion.y))*uDepartureActive;
  float emission=pictureGhostEmission(detail,uv,uDepartureSize,uDepartureMotion.x)*weight;
  return color*(1.-weight*.2)+vec3(.9,.96,1.)*emission*.8;
}
`;
