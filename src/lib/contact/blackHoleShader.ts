/** Light bending and escaped-ray sampling adapted from Dan Greenheck (MIT).
 * https://github.com/dgreenheck/webgpu-black-hole (cf2fca7)
 * Full attribution: /licenses/black-hole.txt. This is an art-directed lens model,
 * not a general-relativistic geodesic or matter solver. */
export const blackHoleFragment = /* glsl */`
  varying vec2 vUv;
  uniform sampler2D uNoise, uDust;
  uniform vec2 uResolution, uCenter, uOrbit;
  uniform float uTime, uRadius, uApproach;
  const float PI = 3.14159265359;
  const float TAU = 6.28318530718;
  float random(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float noise(vec2 p) { return texture2D(uNoise, p / 256.).r; }
  // Two fields crossfade before their phases wrap, preventing unbounded shear.
  float filaments(float radius, float angle, float phase) {
    float speed = .40 * pow(3. / radius, 1.5);
    float a = angle - phase * 80. * speed;
    vec2 orbit = vec2(cos(a), sin(a));
    radius += (noise(orbit * 8. + radius * .7) - .5) * .14;
    float broad = noise(vec2(radius * 3.5, 0.) + orbit * 4.);
    float fine = noise(vec2(radius * 28., 19.) + orbit * 18. + broad * 3.);
    float silk = noise(vec2(radius * 52., 73.) + orbit * 38. + broad * 6.);
    return pow(.38 * broad + .38 * fine + .24 * silk, 2.) * 3.3;
  }
  float gasTexture(float r, float angle) {
    float phase = fract(uTime / 80.);
    return mix(filaments(r, angle, phase), filaments(r, angle, fract(phase + .5)), .5 + .5 * cos(TAU * phase));
  }
  // Integrated Gaussian thickness prevents the thin disk flickering between steps.
  float erfApprox(float x) {
    float s = sign(x); x = abs(x);
    float t = 1. / (1. + .3275911 * x);
    return s * (1. - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741)
      * t - .284496736) * t + .254829592) * t * exp(-x * x));
  }
  float columnDensity(float a, float b, float h, float ds) {
    float dy = b - a;
    if (abs(dy) < .0001) return exp(-pow((a + b) * .5 / h, 2.)) * ds;
    return abs(erfApprox(b / h) - erfApprox(a / h)) * .8862269 * h * ds / abs(dy);
  }
  vec3 stars(vec3 direction, float footprint) {
    vec2 sphere = vec2(atan(direction.z, direction.x) / TAU + .5, asin(clamp(direction.y, -1., 1.)) / PI + .5);
    vec2 grid = sphere * vec2(720., 360.);
    vec2 cell = floor(grid), f = fract(grid);
    vec3 light = vec3(0.);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 offset = vec2(float(i), float(j));
        vec2 id = cell + offset;
        id.x = mod(id.x, 720.);
        float seed = random(id);
        vec2 spot = vec2(random(id + 8.7), random(id + 32.6));
        vec2 d = f - offset - spot;
        float variance = .0016 + footprint * footprint;
        float point = exp(-dot(d, d) / variance) * .0016 / variance;
        light += vec3(.82, .85, .9) * point * step(.994, seed) * (.5 + random(id + 9.) * 2.5);
      }
    }
    return light;
  }
  void main() {
    vec2 p = (vUv * uResolution - uCenter) / uRadius;
    float tilt = .40;
    p = vec2(cos(tilt) * p.x + sin(tilt) * p.y, -sin(tilt) * p.x + cos(tilt) * p.y);
    float pitch = .085 + uOrbit.y;
    float yaw = uOrbit.x;
    float distanceToCenter = 22. - uApproach * 1.4;
    vec3 origin = vec3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch)) * distanceToCenter;
    vec3 forward = normalize(-origin);
    vec3 right = normalize(cross(forward, vec3(0., 1., 0.)));
    vec3 up = cross(right, forward);
    vec3 direction = normalize(forward * 22. + (right * p.x + up * p.y) * 2.55);
    vec3 position = origin;
    vec3 color = vec3(0.);
    float transmission = 1.;
    bool escaped = false;
    for (int i = 0; i < 200; i++) {
      float r = length(position);
      if (r < 1.015 || transmission < .005) break;
      if (r > 30. && dot(position, direction) > 0.) { escaped = true; break; }
      // Midpoint integration reduces directional error on the secondary image.
      float ds = clamp(r * .075, .055, 1.2);
      if (abs(position.y) < .45 && r < 12.) ds = min(ds, .18);
      vec3 halfDirection = normalize(direction - position / (r * r * r) * ds * .5);
      vec3 mid = position + halfDirection * ds * .5;
      float mr = length(mid);
      vec3 nextDirection = normalize(direction - mid / (mr * mr * mr) * ds);
      vec3 nextPosition = position + normalize(direction + nextDirection) * ds;
      float t = abs(nextPosition.y - position.y) > .00001
        ? clamp(-position.y / (nextPosition.y - position.y), 0., 1.) : .5;
      vec3 diskPoint = mix(position, nextPosition, t);
      float diskR = length(diskPoint.xz);
      if (diskR > 1.05 && diskR < 11.5 && min(abs(position.y), abs(nextPosition.y)) < .8) {
        float thickness = .017 + diskR * .002;
        float column = columnDensity(position.y, nextPosition.y, thickness, ds);
        if (column > .00001) {
          float angle = atan(diskPoint.z, diskPoint.x);
          float structure = gasTexture(diskR, angle);
          float inner = smoothstep(2.45, 3.15, diskR);
          float outer = exp(-pow(diskR / 7.2, 4.)) * (1. - smoothstep(8., 11.5, diskR));
          float density = inner * outer * (.08 + structure * 1.3);
          float dust = texture2D(uDust, diskPoint.xz / 24. + .5).r;
          float opacity = 1. - exp(-(density * 8. + dust * 1.8) * column);
          float hot = pow(3. / max(diskR, 3.), 3.3);
          vec3 emission = mix(vec3(.50, .39, .30), vec3(1., .95, .86), hot);
          vec3 tangent = normalize(vec3(-diskPoint.z, 0., diskPoint.x));
          float doppler = clamp(1. + dot(tangent, -direction) * .35, .65, 1.35);
          emission *= (.12 + hot * 3.8) * (.45 + structure * .95) * doppler;
          color += transmission * (emission * opacity + vec3(.92, .96, 1.) * dust * column * 30.);
          transmission *= 1. - opacity;
        }
        // A low-density atmosphere softens the rim without flattening the disc.
        float hazeColumn = columnDensity(position.y, nextPosition.y, thickness * 5., ds);
        float haze = hazeColumn * smoothstep(2.8, 3.5, diskR) * exp(-diskR * .65) * .3;
        color += transmission * vec3(.8, .72, .62) * haze;
      }
      position = nextPosition;
      direction = nextDirection;
    }
    // A ray that exhausted its budget is not necessarily an escaped ray.
    vec3 background = vec3(.00182, .00212, .00243);
    float footprint = min(.5, length(fwidth(direction)) * 80.);
    if (escaped) color += transmission * (stars(direction, footprint) + background);
    else color += transmission * background * .28;
    gl_FragColor = vec4(color, 1.);
  }
`;
