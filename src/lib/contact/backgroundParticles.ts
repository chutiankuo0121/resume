import * as THREE from "three";
import { createAmbientParticleField } from "../particles/createAmbientParticleField";

/** The career dust in white, rendered under the existing hole/mountain coverage. */
export function createBackgroundParticles() {
  const field = createAmbientParticleField();
  const target = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    depthBuffer: false, stencilBuffer: false,
  });
  target.texture.name = "Contact sparse white dust";
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, 1, .1, 10);
  camera.position.z = 1;
  const geometry = new THREE.BufferGeometry();
  const positions = new THREE.BufferAttribute(new Float32Array(100 * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const radii = new THREE.BufferAttribute(new Float32Array(100), 1).setUsage(THREE.DynamicDrawUsage);
  const alphas = new THREE.BufferAttribute(new Float32Array(100), 1).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", positions);
  geometry.setAttribute("aRadius", radii);
  geometry.setAttribute("aAlpha", alphas);
  geometry.setDrawRange(0, 0);
  const material = new THREE.ShaderMaterial({
    name: "ContactWhiteAmbientDust", transparent: true,
    depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { uPixelRatio: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aRadius, aAlpha;
      uniform float uPixelRatio;
      varying float vRadius, vDiameter, vAlpha;
      void main() {
        vRadius = aRadius * uPixelRatio;
        vDiameter = vRadius * 2. + 2.;
        vAlpha = aAlpha;
        gl_PointSize = vDiameter;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }
    `,
    fragmentShader: /* glsl */`
      varying float vRadius, vDiameter, vAlpha;
      void main() {
        float distance = length(gl_PointCoord - .5) * vDiameter;
        float alpha = (1. - smoothstep(vRadius - .5, vRadius + .5, distance)) * vAlpha;
        if (alpha < .001) discard;
        gl_FragColor = vec4(vec3(1.), alpha);
      }
    `,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  let previousTime: number | undefined;

  return {
    texture: target.texture,
    resize(width: number, height: number, dpr: number) {
      field.resize(width, height);
      target.setSize(Math.max(1, Math.round(width * dpr)), Math.max(1, Math.round(height * dpr)));
      material.uniforms.uPixelRatio.value = dpr;
      // Match Canvas screen coordinates; this field has no perspective size changes.
      camera.right = width; camera.bottom = height;
      camera.updateProjectionMatrix();
    },
    render(renderer: THREE.WebGLRenderer, time: number, pointerX: number, pointerY: number, reduced: boolean) {
      const dt = previousTime === undefined ? 1 / 60 : time - previousTime;
      previousTime = time;
      field.update(dt, pointerX, pointerY, reduced ? "static" : "animate");
      field.particles.forEach((particle, index) => {
        positions.setXYZ(index, particle.x + particle.offsetX, particle.y + particle.offsetY, 0);
        radii.setX(index, particle.radius);
        alphas.setX(index, particle.alpha);
      });
      positions.needsUpdate = radii.needsUpdate = alphas.needsUpdate = true;
      geometry.setDrawRange(0, field.particles.length);
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
    },
    dispose() {
      field.particles.length = 0;
      geometry.dispose(); material.dispose(); target.dispose();
    },
  };
}
