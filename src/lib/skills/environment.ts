import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import type { PaletteUniforms } from "./palette";
import {
  cloudFragment,
  skyFragment,
  skyVertex,
  textureVertex,
  waterFragment,
  waterVertex,
} from "./environmentShaders";

/** 独立管理天空与水面；反射相机由 Three 的 Reflector 维护裁剪平面。 */
export function createEnvironment(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  time: THREE.IUniform<number>,
  palette: PaletteUniforms,
) {
  const clouds = new THREE.WebGLRenderTarget(512, 512, {
    depthBuffer: false,
    type: THREE.HalfFloatType,
  });
  clouds.texture.wrapS = clouds.texture.wrapT = THREE.MirroredRepeatWrapping;
  clouds.texture.name = "skills-clouds";
  const cloudMaterial = new THREE.ShaderMaterial({
    name: "SkillsCloudFlow",
    vertexShader: textureVertex,
    fragmentShader: cloudFragment,
    uniforms: { uTime: time },
    depthTest: false,
    depthWrite: false,
  });
  const cloudQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    cloudMaterial,
  );
  cloudQuad.frustumCulled = false;
  const cloudScene = new THREE.Scene();
  cloudScene.add(cloudQuad);
  const cloudCamera = new THREE.Camera();
  const skyMaterial = new THREE.ShaderMaterial({
    name: "SkillsSky",
    vertexShader: skyVertex,
    fragmentShader: skyFragment,
    uniforms: { uClouds: { value: clouds.texture }, ...palette },
    side: THREE.BackSide,
    depthTest: false,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(55, 48, 24), skyMaterial);
  sky.name = "skills-sky";
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  scene.add(sky);

  const water = new Reflector(new THREE.PlaneGeometry(90, 70), {
    textureWidth: 512,
    textureHeight: 512,
    multisample: 0,
    clipBias: 0.003,
    shader: {
      name: "SkillsWater",
      vertexShader: waterVertex,
      fragmentShader: waterFragment,
      uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        uTime: { value: 0 },
        uTexel: { value: new THREE.Vector2() },
      },
    },
  });
  const waterMaterial = water.material as THREE.ShaderMaterial;
  waterMaterial.uniforms.uTime = time;
  Object.assign(waterMaterial.uniforms, palette);
  waterMaterial.transparent = true;
  waterMaterial.depthWrite = false;
  water.name = "skills-water";
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -2.65, -12);
  water.renderOrder = -2;
  water.frustumCulled = false;
  water.getRenderTarget().texture.name = "skills-reflection";
  scene.add(water);
  return {
    resize(width: number, height: number) {
      // 反射限制在约 55 万像素；主画面可以更清晰，水中倒影保持柔和。
      const scale = Math.min(0.75, Math.sqrt(550_000 / (width * height)));
      const w = Math.max(1, Math.round(width * scale)),
        h = Math.max(1, Math.round(height * scale));
      water.getRenderTarget().setSize(w, h);
      waterMaterial.uniforms.uTexel.value.set(1 / w, 1 / h);
      const size = width < 800 ? 256 : 512;
      clouds.setSize(size, size);
    },
    update() {
      const target = renderer.getRenderTarget();
      renderer.setRenderTarget(clouds);
      renderer.render(cloudScene, cloudCamera);
      renderer.setRenderTarget(target);
    },
    dispose() {
      scene.remove(sky, water);
      clouds.dispose();
      cloudQuad.geometry.dispose();
      cloudMaterial.dispose();
      sky.geometry.dispose();
      skyMaterial.dispose();
      water.geometry.dispose();
      water.dispose();
    },
  };
}
