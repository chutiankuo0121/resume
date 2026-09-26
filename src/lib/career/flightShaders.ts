import { particleKernel } from "../shaders/particleKernel";

/** Only add scroll translation. Shape, perspective size and drift are the
 * opening crystal's actual shared code, including its antialiased round core. */
export const flightPointVertex = /* glsl */ `
${particleKernel}
uniform float uTravel;
uniform vec3 uFlightOrigin;
uniform vec3 uFlightAxis;
uniform vec2 uFlightBounds;
void main() {
  float restDepth = dot(position - uFlightOrigin, uFlightAxis);
  float span = uFlightBounds.y - uFlightBounds.x;
  float depth = uFlightBounds.x + mod(restDepth - uFlightBounds.x + uTravel, span);
  vec3 p = position + uFlightAxis * (depth - restDepth);
  drawParticle(position, p);
  // Fade before recycling behind the camera; no jump or long connecting line.
  vFade *= smoothstep(uFlightBounds.x, uFlightBounds.x + 1.2, depth)
    * (1. - smoothstep(uFlightBounds.y - 1.2, uFlightBounds.y, depth));
}
`;
