import * as THREE from "three";
import type { Work } from "@/content/works";
import type { PortfolioMedia } from "./media";
import { GRID, contain, type PortfolioLayout, type Rect } from "./layout";
import { gridFragment, tileFragment, tileVertex } from "./shaders";
import { createAudioTile, audioFragment } from "./audioTile";
import { mediaSeed } from "./order";
import { canvasFont } from "../typography";

export type Tile = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  work: Work | null;
  key: string;
  photo: boolean;
  width: number;
  height: number;
};

/** 每份模板只建一次，所有循环单元共享贴图、几何与材质。 */
export function createPortfolioTiles(
  layout: PortfolioLayout,
  media: PortfolioMedia[],
) {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const textures = new Map<string, THREE.Texture>();
  const materials: THREE.ShaderMaterial[] = [];
  const tiles: Tile[] = [];
  const template = new THREE.Group();

  function texture(item: PortfolioMedia) {
    if (textures.has(item.src)) return textures.get(item.src)!;
    // 元数据阶段已加载封面，直接上传同一个 Image，不再发起第二次加载。
    const map = new THREE.Texture(
      item.image ?? document.createElement("canvas"),
    );
    map.needsUpdate = true;
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    textures.set(item.src, map);
    return map;
  }

  function textMap(
    key: string,
    width: number,
    height: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext("2d")!);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    textures.set(key, map);
    return map;
  }

  function add(
    rect: Rect,
    map: THREE.Texture,
    key: string,
    work: Work | null,
    photo: boolean,
    textWidth?: number,
  ) {
    const aspect = map.image.width / map.image.height;
    const tileAspect = rect.width / rect.height;
    const material = new THREE.ShaderMaterial({
      vertexShader: tileVertex,
      fragmentShader: textWidth ? audioFragment : tileFragment,
      uniforms: {
        uMap: { value: map },
        // 等比居中铺满格子，仅裁去超出的边缘；封面不会拉伸或留下参差空隙。
        uFit: {
          value: new THREE.Vector2(
            Math.max(1, aspect / tileAspect),
            Math.max(1, tileAspect / aspect),
          ),
        },
        uSize: { value: new THREE.Vector2(rect.width, rect.height) },
        uRadius: { value: photo ? GRID.radius - GRID.inset : 0 },
        uHover: { value: 0 },
        uTime: { value: 0 },
        uDirection: { value: mediaSeed(key) > 0.5 ? 1 : -1 },
        uTextWidth: { value: textWidth ?? 1 },
      },
      transparent: true,
      depthWrite: false,
    });
    materials.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(rect.width, rect.height, 1);
    mesh.position.set(rect.x, rect.y, 0);
    template.add(mesh);
    const tile = {
      mesh,
      work,
      key,
      photo,
      width: rect.width,
      height: rect.height,
    };
    mesh.userData.tile = tile;
    tiles.push(tile);
    return tile;
  }

  const title = textMap("title", 1440, 850, (ctx) => {
    ctx.fillStyle = "#292923";
    ctx.textAlign = "center";
    ctx.font = canvasFont("body", 28);
    ctx.fillText("AI / TOOLS / VISUAL EXPLORATIONS", 720, 125);
    ctx.font = canvasFont("heading", 154);
    ctx.fillText("Selected", 720, 335);
    ctx.font = canvasFont("heading", 206);
    ctx.fillText("works.", 720, 533);
    ctx.font = canvasFont("body", 34);
    ctx.fillText("Ideas, in every direction.", 720, 655);
    ctx.font = canvasFont("body", 26);
    ctx.fillText("DRAG TO EXPLORE  /  CLICK TO ENTER", 720, 750);
  });
  add(
    contain(
      {
        ...layout.title,
        width: layout.title.width - 0.5,
        height: layout.title.height - 0.3,
      },
      1440 / 850,
    ),
    title,
    "title",
    null,
    false,
  );

  const byKey = new Map(media.map((item) => [item.key, item]));
  for (const placement of layout.items) {
    const item = byKey.get(placement.key)!;
    if (item.work.kind === "audio") {
      const audio = createAudioTile(item.work);
      textures.set(item.key, audio.texture);
      add(placement.media, audio.texture, item.key, item.work, true, audio.textWidth);
    } else add(placement.media, texture(item), item.key, item.work, true);
  }

  // 将同一布局的所有圆角分区合成一个几何体；不存在另一套 shader 分格公式。
  const positions: number[] = [],
    uvs: number[] = [],
    sizes: number[] = [];
  for (const cell of layout.cells) {
    for (const [u, v] of [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 0],
      [1, 1],
      [0, 1],
    ]) {
      positions.push(
        cell.x + (u - 0.5) * cell.width,
        cell.y + (v - 0.5) * cell.height,
        0,
      );
      uvs.push(u, v);
      sizes.push(cell.width, cell.height);
    }
  }
  const gridGeometry = new THREE.BufferGeometry();
  gridGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  gridGeometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  gridGeometry.setAttribute(
    "aSize",
    new THREE.Float32BufferAttribute(sizes, 2),
  );
  const gridMaterial = new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `attribute vec2 aSize; varying vec2 vSize; varying vec2 vUv;
      void main() { vSize = aSize; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: gridFragment,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uRadius: { value: GRID.radius },
      uSeam: { value: GRID.seam },
    },
  });
  const grid = new THREE.Mesh(gridGeometry, gridMaterial);
  grid.renderOrder = -1;
  grid.position.z = -0.001;
  template.add(grid);

  return {
    template,
    tiles,
    update(hover: Work | null, time: number) {
      for (const tile of tiles) {
        tile.mesh.material.uniforms.uTime.value = time;
        tile.mesh.material.uniforms.uHover.value =
          tile.work && hover?.id === tile.work.id ? 1 : 0;
      }
    },
    dispose() {
      geometry.dispose();
      gridGeometry.dispose();
      gridMaterial.dispose();
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}
