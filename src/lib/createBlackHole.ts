import * as THREE from "three";
import { holePointVertex, holePointFragment } from "./shaders/blackHole";

export function createBlackHole(renderer: THREE.WebGLRenderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 15);
  camera.position.z = 20 / 6;
  const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  // 线性同余随机数生成器：固定种子让刷新后的空间点分布一致。
  let seed = 72341;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const positions = new Float32Array(41000 * 3);
  const sizes = new Float32Array(41000),
    intensities = new Float32Array(41000);
  for (let i = 0; i < sizes.length; i++) {
    positions[i * 3] = (random() - 0.5) * 7;
    positions[i * 3 + 1] = (random() - 0.5) * (32 / 6);
    positions[i * 3 + 2] = (random() - 0.5) * 5.5;
    sizes[i] = 0.6 + random() * 1.2;
    intensities[i] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute(
    "aIntensity",
    new THREE.BufferAttribute(intensities, 1),
  );
  const material = new THREE.ShaderMaterial({
    vertexShader: holePointVertex,
    fragmentShader: holePointFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uPointer: { value: new THREE.Vector2() },
      uPointerWeight: { value: 1 },
      uHoleScale: { value: 1 },
      uHoleCenter: { value: new THREE.Vector2(0.5, 0.505) },
    },
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  return {
    texture: target.texture,
    resize(width: number, height: number, dpr: number) {
      target.setSize(Math.round(width * dpr), Math.round(height * dpr));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      material.uniforms.uPixelRatio.value = dpr;
    },
    render(
      time: number,
      pointer: THREE.Vector2,
      weight: number,
      scale: number,
      center: THREE.Vector2,
    ) {
      material.uniforms.uTime.value = time;
      material.uniforms.uPointer.value.copy(pointer);
      material.uniforms.uPointerWeight.value = weight;
      material.uniforms.uHoleScale.value = scale;
      material.uniforms.uHoleCenter.value.copy(center);
      renderer.setRenderTarget(target);
      renderer.setClearColor(0, 0);
      renderer.clear();
      renderer.render(scene, camera);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      target.dispose();
    },
  };
}
