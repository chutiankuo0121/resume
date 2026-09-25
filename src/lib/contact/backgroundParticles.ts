import * as THREE from "three";
import { loadBuffer, createParticleGeometry } from "../assets";
import { assetUrl } from "../assetUrl";
import { simplex } from "../shaders/noise";

/** The original ambient space, with a fixed one-in-five subset. Its camera is
 * independent of the black hole and mountains; only the original drift evolves. */
export function createBackgroundParticles() {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    depthBuffer: false, stencilBuffer: false,
  });
  target.texture.name = "Contact background particles (20%)";
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, .1, 100);
  const bounds = new THREE.Box3(), point = new THREE.Vector3();
  const center = new THREE.Vector3(), size = new THREE.Vector3();
  let geometry: THREE.BufferGeometry | undefined;
  let width = 1, height = 1, disposed = false;
  const material = new THREE.ShaderMaterial({
    name: "ContactWhiteBackgroundParticles", transparent: true,
    depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: {
      uTime: { value: 0 }, uPixelRatio: { value: 1 },
      uViewportScale: { value: .7 }, uMotionDepthOffset: { value: 1 },
    },
    vertexShader: /* glsl */`
      attribute float aLight, aSize;
      uniform float uTime, uPixelRatio, uViewportScale, uMotionDepthOffset;
      varying float vLight, vFade;
      ${simplex}
      void main() {
        vec3 p = position;
        vec4 view = modelViewMatrix * vec4(p, 1.);
        float depth = clamp(abs(view.z + uMotionDepthOffset) * 2. / 1511., .0001, 120.);
        vec3 q = position * 2., t = vec3(uTime * .045);
        vec3 large = .5 * vec3(snoise(q * 2.8010136 + t * vec3(1., .7, .3)),
          snoise(q * 2.8010136 + t * vec3(.3, 1., .7)), snoise(q * 2.8010136 + t * vec3(.7, .3, 1.)));
        vec3 medium = .3 * vec3(snoise(q * 3.301 + t * vec3(1.2, .5, .8)),
          snoise(q * 3.301 + t * vec3(.8, 1.2, .5)), snoise(q * 3.301 + t * vec3(.5, .8, 1.2)));
        vec3 small = .2 * vec3(snoise(q * 4.54 + t * vec3(1.5, .9, .4)),
          snoise(q * 4.54 + t * vec3(.4, 1.5, .9)), snoise(q * 4.54 + t * vec3(.9, .4, 1.5)));
        p += (large + medium * depth + small) * depth * 125.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        float modulation = 1. + dot(large + medium + small, vec3(1.)) * .2 / 9.;
        float diameter = (aSize / 128.) * modulation * (300. / max(-mv.z * 2., .08) + 26.);
        gl_PointSize = clamp(diameter * uPixelRatio * uViewportScale, 1., 48. * uPixelRatio);
        vFade = smoothstep(.10, .40, -mv.z);
        vLight = .6 + .3 * aLight;
      }
    `,
    fragmentShader: /* glsl */`
      varying float vLight, vFade;
      void main() {
        float radius = length(gl_PointCoord * 2. - 1.);
        float edge = min(fwidth(radius), .25);
        float alpha = (1. - smoothstep(.78 - edge * .5, .78 + edge * .5, radius)) * vFade;
        if (alpha < .001) discard;
        gl_FragColor = vec4(vec3(vLight), alpha);
      }
    `,
  });

  function frameCamera() {
    if (!geometry) return;
    bounds.getCenter(center); bounds.getSize(size);
    const mobile = width < 800 || width <= height;
    const crystalHeight = mobile ? height * .52 : Math.min(height * .8, width * .64);
    const distance = size.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
      * height / crystalHeight + Math.max(size.x, size.z) * .4;
    camera.position.copy(center).add(point.set(Math.sin(1.16) * distance, .15, Math.cos(1.16) * distance));
    camera.lookAt(center);
    camera.aspect = width / height;
    camera.setViewOffset(width, height, width * (mobile ? -.14 : -.23), height * (mobile ? -.18 : .03), width, height);
    camera.updateProjectionMatrix();
    material.uniforms.uMotionDepthOffset.value = distance;
    material.uniforms.uViewportScale.value = mobile ? .55 : .7;
  }

  const ready = loadBuffer(assetUrl("/crystal/particles.bin")).then(data => {
    if (disposed) return;
    geometry = createParticleGeometry(data);
    const ambient = geometry.getAttribute("aAmbient");
    const positions = geometry.getAttribute("position");
    const visible: number[] = [];
    let ambientCount = 0;
    for (let i = 0; i < ambient.count; i++) {
      if (ambient.getX(i) > .5) {
        if (++ambientCount % 5 === 0) visible.push(i);
      } else {
        bounds.expandByPoint(point.fromBufferAttribute(positions, i));
      }
    }
    geometry.setIndex(visible);
    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    scene.add(particles);
    frameCamera();
  });

  return {
    ready, texture: target.texture,
    resize(w: number, h: number, dpr: number) {
      width = w; height = h;
      target.setSize(Math.max(1, Math.round(w * dpr)), Math.max(1, Math.round(h * dpr)));
      material.uniforms.uPixelRatio.value = dpr;
      frameCamera();
    },
    render(renderer: THREE.WebGLRenderer, time: number) {
      material.uniforms.uTime.value = time;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
    },
    dispose() { disposed = true; geometry?.dispose(); material.dispose(); target.dispose(); },
  };
}
