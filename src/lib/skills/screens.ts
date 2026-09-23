import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { screenFragment, screenVertex } from "./shaders";
import { createPointerField } from "./pointerField";
import type { PaletteUniforms } from "./palette";

const COLS = 35,
  ROWS = 23,
  LAYERS = 4,
  CELL = 0.2;
const screenCount = COLS * ROWS * LAYERS;

/** 共用一份几何与实例矩阵。稳定随机种子保证循环、倒滚时方块不会重新洗牌。 */
export function createScreenGeometry() {
  const geometry = new RoundedBoxGeometry(1, 1, 1, 1, 0.04);
  const cells = new Float32Array(screenCount * 3),
    seeds = new Float32Array(screenCount);
  const alphas = new Float32Array(screenCount);
  const matrices = new Float32Array(screenCount * 16);
  const matrix = new THREE.Matrix4(),
    position = new THREE.Vector3();
  const scale = new THREE.Vector3().setScalar((CELL * 1.25) / 1.35);
  const rotation = new THREE.Quaternion();
  let i = 0;
  // 透明物体从后层向前层绘制；所有实例仍只提交一次绘制命令。
  for (let layer = LAYERS - 1; layer >= 0; layer--) {
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++, i++) {
        const seed = THREE.MathUtils.seededRandom(i + 701);
        position.set(
          (x - (COLS - 1) / 2) * CELL,
          (y - (ROWS - 1) / 2) * CELL,
          -layer * CELL,
        );
        matrix.compose(position, rotation, scale).toArray(matrices, i * 16);
        cells.set([position.x, position.y, layer / (LAYERS - 1)], i * 3);
        seeds[i] = seed;
        // 同一纵深列共享两项随机度，再乘单个方块的随机度，保留透明结构。
        const column = THREE.MathUtils.seededRandom(x * 131 + y * 71 + 827);
        const row = THREE.MathUtils.seededRandom(y * 131 + x * 71 + 419);
        alphas[i] = column * row * seed;
      }
  }
  geometry.setAttribute("aCell", new THREE.InstancedBufferAttribute(cells, 3));
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
  geometry.setAttribute(
    "aAlpha",
    new THREE.InstancedBufferAttribute(alphas, 1),
  );
  return {
    geometry,
    matrices: new THREE.InstancedBufferAttribute(matrices, 16),
  };
}

export function createScreen(
  image: THREE.Texture,
  shared: ReturnType<typeof createScreenGeometry>,
  time: THREE.IUniform<number>,
  renderer: THREE.WebGLRenderer,
  projection: THREE.IUniform<THREE.Matrix4>,
  surfaceField: THREE.IUniform<THREE.Texture>,
  resolution: THREE.IUniform<THREE.Vector2>,
  light: THREE.IUniform<THREE.Vector3>,
  palette: PaletteUniforms,
) {
  const group = new THREE.Group();
  const pointerField = createPointerField(renderer);
  const material = new THREE.ShaderMaterial({
    vertexShader: screenVertex,
    fragmentShader: screenFragment,
    uniforms: {
      ...palette,
      uImage: { value: image },
      uTime: time,
      uOpacity: { value: 0 },
      uProjection: projection,
      uLight: light,
      uSurfaceField: surfaceField,
      uResolution: resolution,
      uReveal: { value: 0 },
      uPointerField: pointerField.texture,
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.FrontSide,
  });
  const mesh = new THREE.InstancedMesh(shared.geometry, material, screenCount);
  mesh.instanceMatrix = shared.matrices;
  mesh.frustumCulled = false;
  group.add(mesh);

  return {
    group,
    material,
    pointerField,
    dispose() {
      pointerField.dispose();
      mesh.dispose();
      material.dispose();
    },
  };
}
