import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { lightVertex, lightFragment } from "./shaders/crystal";
import { loadBuffer, createParticleGeometry } from "./assets";
import type { LoadingTask } from "./loading/progress";

type Options = {
  lightScene: THREE.Scene;
  pointScene: THREE.Scene;
  pointMaterial: THREE.ShaderMaterial;
  onProgress: (task: LoadingTask) => void;
};

export function createCrystal({
  lightScene,
  pointScene,
  pointMaterial,
  onProgress,
}: Options) {
  let disposed = false;
  let surface:
    | THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>
    | undefined;
  let grains: THREE.Points | undefined;
  const geometries = new Set<THREE.BufferGeometry>();
  const target = new THREE.Vector2(),
    smoothed = new THREE.Vector2();
  const look = { value: new THREE.Vector2() };
  // 晶石的局部前向角；作为 uniform 与鼠标角度共同计算，避免 GLSL
  // 常量折叠与运行时三角函数的舍入差让深度遮挡边缘产生偏移。
  const basisYaw = { value: (57.3 * Math.PI) / 180 };
  const shared = {
    uLook: look,
    uBasisYaw: basisYaw,
  };
  Object.assign(pointMaterial.uniforms, shared);

  // 明暗贴图是数值，不做 sRGB 解码。GLB 的 UV 使用左下角为原点。
  let lightMap: THREE.Texture | undefined;
  async function loadLighting() {
    const map = await new THREE.TextureLoader().loadAsync("/crystal/light.png");
    map.colorSpace = THREE.NoColorSpace;
    map.flipY = false;
    if (disposed) map.dispose();
    else {
      lightMap = map;
      onProgress("lighting");
    }
    return map;
  }

  const ready = (async () => {
    const [meshData, pointData, map] = await Promise.all([
      loadBuffer("/crystal/crystal.glb"),
      loadBuffer("/crystal/particles.bin"),
      loadLighting(),
    ]);
    if (disposed) return;
    const { scene } = await new GLTFLoader().parseAsync(meshData, "");
    scene.updateMatrixWorld(true);
    const mesh = scene.getObjectByProperty("isMesh", true) as THREE.Mesh;
    if (!mesh) throw new Error("晶石模型缺少网格");
    const geometry = mesh.geometry;
    geometry.applyMatrix4(mesh.matrixWorld);
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(
      (material) => material.dispose(),
    );
    geometries.add(geometry);
    // 异步解析期间可能已卸载；此时只释放解析结果，不再挂入场景。
    if (disposed) {
      geometries.forEach((geometry) => geometry.dispose());
      return;
    }
    surface = new THREE.Mesh(
      geometry,
      new THREE.ShaderMaterial({
        vertexShader: lightVertex,
        fragmentShader: lightFragment,
        side: THREE.DoubleSide,
        uniforms: {
          uLighting: { value: map },
          ...shared,
        },
      }),
    );
    surface.frustumCulled = false;
    lightScene.add(surface);
    onProgress("model");

    // 点间距已在离线采样时确定；运行时完整绘制，保留亮簇之间的空隙。
    const points = createParticleGeometry(pointData);
    geometries.add(points);
    grains = new THREE.Points(points, pointMaterial);
    grains.frustumCulled = false;
    pointScene.add(grains);
    onProgress("particles");
  })();

  function reset() {
    target.set(0, 0);
    smoothed.set(0, 0);
    look.value.set(0, 0);
  }
  return {
    ready,
    setPointer(x: number, y: number) {
      target.set(
        THREE.MathUtils.clamp(x, -1, 1),
        THREE.MathUtils.clamp(y, -1, 1),
      );
    },
    update(dt: number, entry: number, reduced: boolean, focus: number) {
      if (reduced) return reset();
      smoothed.x = THREE.MathUtils.damp(smoothed.x, target.x, 3.6, dt);
      smoothed.y = THREE.MathUtils.damp(smoothed.y, target.y, 3.6, dt);
      look.value
        .copy(smoothed)
        .multiplyScalar(
          THREE.MathUtils.smoothstep(entry, 0.48, 0.94) * (1 - focus),
        );
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      surface?.removeFromParent();
      geometries.forEach((geometry) => geometry.dispose());
      surface?.material.dispose();
      grains?.removeFromParent();
      lightMap?.dispose();
      // pointMaterial 由主场景创建，统一由主场景释放。
    },
  };
}
