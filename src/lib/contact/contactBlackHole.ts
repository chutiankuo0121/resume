import * as THREE from "three";
import { blackHoleFragment } from "./blackHoleShader";
import { createInfallDust } from "./infallDust";

const vertex = /* glsl */`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }
`;
const blurFragment = /* glsl */`
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform vec2 uStep;
  uniform float uExtract;
  vec3 tap(vec2 uv) {
    vec3 c = texture2D(uMap, uv).rgb;
    float peak = max(c.r, max(c.g, c.b));
    return c * mix(1., max(0., peak - .65) / max(peak, .001), uExtract);
  }
  void main() {
    vec3 c = tap(vUv) * .227027;
    c += (tap(vUv + uStep * 1.384615) + tap(vUv - uStep * 1.384615)) * .316216;
    c += (tap(vUv + uStep * 3.230769) + tap(vUv - uStep * 3.230769)) * .070270;
    gl_FragColor = vec4(c, 1.);
  }
`;

/** One linear HDR image supplies both the mountains and the existing handoff.
 * Lensing adapts Dan Greenheck's MIT light integrator; see public/licenses/.
 * All gas, particles, bloom and composition code here is authored for this page. */
export function createContactBlackHole() {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const camera = new THREE.Camera();
  const passScene = new THREE.Scene();
  const target = (name: string) => {
    const rt = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      depthBuffer: false, stencilBuffer: false,
    });
    rt.texture.name = name;
    return rt;
  };
  const frame = target("Contact black hole HDR");
  const smallA = target("Contact bloom small horizontal"), smallB = target("Contact bloom small");
  const wideA = target("Contact bloom wide horizontal"), wideB = target("Contact bloom wide");
  const targets = [frame, smallA, smallB, wideA, wideB];
  const dust = createInfallDust();
  let seed = 83147;
  const noiseBytes = new Uint8Array(256 * 256 * 4);
  for (let i = 0; i < noiseBytes.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    noiseBytes[i] = seed >>> 24;
  }
  const noise = new THREE.DataTexture(noiseBytes, 256, 256);
  noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
  noise.magFilter = noise.minFilter = THREE.LinearFilter;
  noise.needsUpdate = true;
  const ray = new THREE.ShaderMaterial({
    name: "ContactCurvedLight", vertexShader: vertex, fragmentShader: blackHoleFragment,
    depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: {
      uTime: { value: 0 }, uResolution: { value: new THREE.Vector2(1, 1) },
      uCenter: { value: new THREE.Vector2() }, uRadius: { value: 1 },
      uOrbit: { value: new THREE.Vector2() }, uApproach: { value: 0 },
      uNoise: { value: noise }, uDust: { value: dust.texture },
    },
  });
  const blur = new THREE.ShaderMaterial({
    name: "ContactEmissionBloom", vertexShader: vertex, fragmentShader: blurFragment,
    depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { uMap: { value: frame.texture }, uStep: { value: new THREE.Vector2() }, uExtract: { value: 0 } },
  });
  const quad = new THREE.Mesh(geometry, ray);
  quad.frustumCulled = false;
  passScene.add(quad);
  const material = new THREE.ShaderMaterial({
    name: "ContactBlackHoleComposite", depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { uFrame: { value: frame.texture }, uSmall: { value: smallB.texture }, uWide: { value: wideB.texture } },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
    `,
    fragmentShader: /* glsl */`
      varying vec2 vUv;
      uniform sampler2D uFrame, uSmall, uWide;
      void main() {
        vec3 c = texture2D(uFrame, vUv).rgb;
        c += texture2D(uSmall, vUv).rgb * .24 + texture2D(uWide, vUv).rgb * .45;
        c = 1. - exp(-c * 1.18);
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }
    `,
  });
  let width = 1, height = 1, mobile = false;
  let floatChecked = false;
  const clearColor = new THREE.Color();
  function resize(w: number, h: number, narrow: boolean) {
    width = w; height = h; mobile = narrow;
    // Full CSS resolution at ordinary desktop sizes (Prada's High convention).
    const scale = Math.min(mobile ? Math.min(devicePixelRatio, 1.4) : 1,
      Math.sqrt((mobile ? 650_000 : 1_650_000) / (w * h)));
    const rw = Math.max(1, Math.round(w * scale)), rh = Math.max(1, Math.round(h * scale));
    frame.setSize(rw, rh);
    smallA.setSize(Math.max(1, rw >> 1), Math.max(1, rh >> 1));
    smallB.setSize(smallA.width, smallA.height);
    wideA.setSize(Math.max(1, rw >> 3), Math.max(1, rh >> 3));
    wideB.setSize(wideA.width, wideA.height);
    ray.uniforms.uResolution.value.set(w, h);
  }
  function drawBlur(renderer: THREE.WebGLRenderer, input: THREE.WebGLRenderTarget,
    output: THREE.WebGLRenderTarget, x: number, y: number, extract = 0) {
    blur.uniforms.uMap.value = input.texture;
    blur.uniforms.uStep.value.set(x / input.width, y / input.height);
    blur.uniforms.uExtract.value = extract;
    quad.material = blur;
    renderer.setRenderTarget(output);
    renderer.render(passScene, camera);
  }
  return {
    material, resize,
    render(renderer: THREE.WebGLRenderer, time: number, x: number, y: number, progress: number) {
      if (!floatChecked) {
        floatChecked = true;
        if (!renderer.extensions.has("EXT_color_buffer_float")) {
          targets.forEach(rt => { rt.dispose(); rt.texture.type = THREE.UnsignedByteType; });
        }
      }
      const previousTarget = renderer.getRenderTarget();
      const previousClearAlpha = renderer.getClearAlpha();
      renderer.getClearColor(clearColor);
      const previousAutoClear = renderer.autoClear;
      renderer.autoClear = true;
      renderer.setClearColor(0x000000, 0);
      try {
        dust.render(renderer, time, mobile);
        ray.uniforms.uTime.value = time;
        ray.uniforms.uOrbit.value.set(x * .052, y * .025);
        ray.uniforms.uApproach.value = progress;
        ray.uniforms.uCenter.value.set(width * (mobile ? .57 : .76), height * (mobile ? .37 : .63));
        ray.uniforms.uRadius.value = mobile
          ? Math.min(width * .21, height * .11) : Math.min(height * .155, width * .11);
        quad.material = ray;
        renderer.setRenderTarget(frame);
        renderer.render(passScene, camera);
        drawBlur(renderer, frame, smallA, 2, 0, 1);
        drawBlur(renderer, smallA, smallB, 0, 1);
        drawBlur(renderer, smallB, wideA, 4, 0);
        drawBlur(renderer, wideA, wideB, 0, 1);
        drawBlur(renderer, wideB, wideA, 2, 0);
        drawBlur(renderer, wideA, wideB, 0, 2);
      } finally {
        renderer.setRenderTarget(previousTarget);
        renderer.setClearColor(clearColor, previousClearAlpha);
        renderer.autoClear = previousAutoClear;
      }
    },
    dispose() {
      targets.forEach(rt => rt.dispose());
      geometry.dispose(); ray.dispose(); blur.dispose(); material.dispose(); noise.dispose(); dust.dispose();
    },
  };
}
