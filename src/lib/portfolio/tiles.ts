import * as THREE from "three";
import type { WorkSummary, PortfolioMedia } from "@/content/works/gallery";
import { GRID, contain, type PortfolioLayout, type Rect } from "./layout";
import { gridFragment, tileFragment, tileVertex } from "./shaders";
import { createAudioTile, audioFragment } from "./audioTile";
import { mediaSeed } from "./order";
import { canvasFont } from "../typography";

export type Tile = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  work: WorkSummary | null;
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
  const empty = document.createElement("canvas");
  empty.width = empty.height = 1;
  const resident = new Map<string, { bytes: number; used: number }>();
  const pending = new Map<string, HTMLImageElement>();
  const sourceByKey = new Map(media.map(item => [item.key, item.src]));
  let usedBytes = 0, previousHover: WorkSummary | null = null;

  function texture(item: PortfolioMedia) {
    if (textures.has(item.src)) return textures.get(item.src)!;
    // 图片到达后只更新纹理；格子、材质和所有循环副本都不重建。
    const map = new THREE.Texture(empty);
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
    work: WorkSummary | null,
    photo: boolean,
    textWidth?: number,
    imageAspect = map.image.width / map.image.height,
  ) {
    const aspect = imageAspect;
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
    tiles.push(tile);
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
    } else add(placement.media, texture(item), item.key, item.work, true, undefined,
      item.textureWidth / item.textureHeight);
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
  const audioTiles = tiles.filter(tile => tile.work?.kind === "audio");
  const byWork = new Map<string, Tile[]>();
  for (const tile of tiles) if (tile.work) {
    const group = byWork.get(tile.work.id) ?? [];
    group.push(tile);
    byWork.set(tile.work.id, group);
  }

  return {
    template,
    tiles,
    enqueue(src: string, image: HTMLImageElement) { pending.set(src, image); },
    get pending() { return pending.size > 0; },
    upload(renderer: THREE.WebGLRenderer, wanted: string[], released: (src: string) => void) {
      const protectedSources = new Set(wanted.map(key => sourceByKey.get(key)));
      for (const src of protectedSources) {
        const entry = src && resident.get(src);
        if (entry) entry.used = performance.now();
      }
      const completed: string[] = [];
      const start = performance.now();
      // 逐帧上传，防止图片集中触发 texImage2D；不修改分辨率和颜色。
      for (const [src, image] of pending) {
        const map = textures.get(src)!;
        // WebGL 2 的纹理存储不可原地改尺寸；释放 1px 占位存储后重新分配，材质引用保持不变。
        map.dispose();
        map.image = image;
        map.needsUpdate = true;
        renderer.initTexture(map);
        const bytes = image.naturalWidth * image.naturalHeight * 4 * 4 / 3;
        resident.set(src, { bytes, used: performance.now() });
        usedBytes += bytes;
        pending.delete(src);
        completed.push(src);
        if (completed.length >= 2 || performance.now() - start > 3) break;
      }
      // 128 MiB 为软预算；视野与邻域的共享贴图始终保留，不能为达标闪白。
      if (usedBytes > 128 * 1024 * 1024) {
        const candidates = [...resident].filter(([src]) => !protectedSources.has(src))
          .sort((a, b) => a[1].used - b[1].used);
        for (const [src, entry] of candidates) {
          const map = textures.get(src)!;
          map.dispose();
          map.image = empty;
          map.needsUpdate = true;
          resident.delete(src);
          usedBytes -= entry.bytes;
          released(src);
          if (usedBytes <= 128 * 1024 * 1024) break;
        }
      }
      return completed;
    },
    update(hover: WorkSummary | null, time: number) {
      for (const tile of audioTiles) tile.mesh.material.uniforms.uTime.value = time;
      if (hover?.id !== previousHover?.id) {
        for (const tile of byWork.get(previousHover?.id ?? "") ?? []) tile.mesh.material.uniforms.uHover.value = 0;
        for (const tile of byWork.get(hover?.id ?? "") ?? []) tile.mesh.material.uniforms.uHover.value = 1;
        previousHover = hover;
      }
    },
    dispose() {
      geometry.dispose();
      gridGeometry.dispose();
      gridMaterial.dispose();
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      pending.clear();
      resident.clear();
    },
  };
}
