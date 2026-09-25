import * as THREE from "three";

const COUNT = 88, TRAIL = 5, SIZE = 1024;
const smooth = (a: number, b: number, x: number) => {
  const v = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return v * v * (3 - 2 * v);
};

/** Closed-form inspiral: r^(3/2) falls linearly, angular speed grows as r^(-3/2).
 * Equivalent at any refresh rate. Invisible life boundaries reset the tail. */
export function infallOrbit(time: number, index: number) {
  const seed = ((index * 0.61803398875) % 1);
  const duration = 26 + ((index * .38196601125) % 1) * 22;
  const life = time / duration + seed;
  const age = life - Math.floor(life);
  const outer = 7.3 + ((index * .754877666) % 1) * 3.5;
  const start = outer ** 1.5, end = .96 ** 1.5;
  const radial = start + (end - start) * age;
  const radius = radial ** (2 / 3);
  const angle = index * 2.39996323 + 3.7 * Math.log(start / radial);
  return {
    x: Math.cos(angle) * radius, z: Math.sin(angle) * radius,
    alpha: smooth(0, .09, age) * (1 - smooth(.965, 1, age)),
    cycle: Math.floor(life), radius,
  };
}

export function createInfallDust() {
  const target = new THREE.WebGLRenderTarget(SIZE, SIZE, {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    depthBuffer: false, stencilBuffer: false,
  });
  target.texture.name = "Contact orbital dust in disk coordinates";
  const positions = new Float32Array(COUNT * TRAIL * 3);
  const strengths = new Float32Array(COUNT * TRAIL);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("aStrength", new THREE.BufferAttribute(strengths, 1).setUsage(THREE.DynamicDrawUsage));
  const material = new THREE.ShaderMaterial({
    name: "ContactInfallDust", transparent: true, blending: THREE.AdditiveBlending,
    depthTest: false, depthWrite: false, toneMapped: false,
    vertexShader: /* glsl */`
      attribute float aStrength;
      varying float vStrength;
      void main() {
        vStrength = aStrength;
        gl_Position = vec4(position.xy / 12., 0., 1.);
        gl_PointSize = 3.2;
      }
    `,
    fragmentShader: /* glsl */`
      varying float vStrength;
      void main() {
        vec2 d = gl_PointCoord * 2. - 1.;
        float a = exp(-dot(d, d) * 4.) * vStrength;
        gl_FragColor = vec4(vec3(a), 1.);
      }
    `,
  });
  const scene = new THREE.Scene(), camera = new THREE.Camera();
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  return {
    texture: target.texture,
    render(renderer: THREE.WebGLRenderer, time: number, mobile: boolean) {
      const count = mobile ? 36 : COUNT;
      geometry.setDrawRange(0, count * TRAIL);
      for (let i = 0; i < count; i++) {
        const head = infallOrbit(time, i);
        for (let j = 0; j < TRAIL; j++) {
          const sample = j === 0 ? head : infallOrbit(time - j * .06, i);
          const k = i * TRAIL + j;
          positions[k * 3] = sample.x;
          positions[k * 3 + 1] = sample.z;
          strengths[k] = sample.cycle === head.cycle ? sample.alpha * Math.exp(-j * .65) : 0;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aStrength.needsUpdate = true;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
    },
    dispose() { target.dispose(); material.dispose(); geometry.dispose(); },
  };
}
