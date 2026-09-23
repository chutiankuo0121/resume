import * as THREE from "three";
import type { WorkSummary } from "@/content/works/gallery";
import type { PortfolioLayout } from "./layout";
import { GRID } from "./layout";
import type { createPortfolioTiles, Tile } from "./tiles";

export type WorkTarget = {
  work: WorkSummary;
  key: string;
  position: THREE.Vector3;
  width: number;
  height: number;
};

export function createPortfolioField(
  scene: THREE.Scene,
  layout: PortfolioLayout,
  builder: ReturnType<typeof createPortfolioTiles>,
) {
  const period = new THREE.Vector2(layout.width, layout.height);
  const cells: { root: THREE.Group; key: string }[] = [];
  const photos = new Map(
    builder.tiles
      .filter((t) => t.work && t.photo)
      .map((t) => [t.key, t]),
  );
  let scale = 1;
  const audioTiles = builder.tiles.filter(tile => tile.work?.kind === "audio");
  const buckets = new Map<string, Tile[]>();
  const bucketSize = 3;
  // 所有卡片位于同一平面。一次射线平面求交后只检查附近矩形，仍使用原圆角公式。
  for (const tile of photos.values()) {
    const { x, y } = tile.mesh.position;
    for (let row = Math.floor((y - tile.height / 2) / bucketSize); row <= Math.floor((y + tile.height / 2) / bucketSize); row++)
      for (let col = Math.floor((x - tile.width / 2) / bucketSize); col <= Math.floor((x + tile.width / 2) / bucketSize); col++) {
        const key = `${col},${row}`;
        const group = buckets.get(key) ?? [];
        group.push(tile);
        buckets.set(key, group);
      }
  }
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const point = new THREE.Vector3();
  const viewRay = new THREE.Raycaster();
  const corner = new THREE.Vector2(), lower = new THREE.Vector3(), upper = new THREE.Vector3();
  let lastRange = "";

  function makeCell() {
    const root = new THREE.Group();
    for (const original of builder.template.children as THREE.Mesh[]) {
      const mesh = new THREE.Mesh(original.geometry, original.material);
      mesh.position.copy(original.position);
      mesh.scale.copy(original.scale);
      mesh.renderOrder = original.renderOrder;
      root.add(mesh);
    }
    root.scale.setScalar(scale);
    scene.add(root);
    const cell = { root, key: "" };
    cells.push(cell);
    return cell;
  }

  function target(tile: Tile, x: number, y: number): WorkTarget {
    return {
      work: tile.work!,
      key: tile.key,
      width: tile.width * scale,
      height: tile.height * scale,
      position: new THREE.Vector3(
        x + tile.mesh.position.x * scale,
        y + tile.mesh.position.y * scale,
        0,
      ),
    };
  }

  return {
    period,
    nearest(key: string, position: THREE.Vector3): WorkTarget | undefined {
      const tile = photos.get(key);
      if (!tile) return;
      return target(
        tile,
        Math.round((position.x - tile.mesh.position.x * scale) / period.x) *
          period.x,
        Math.round((position.y - tile.mesh.position.y * scale) / period.y) *
          period.y,
      );
    },
    origin(position: THREE.Vector3) {
      return {
        x: Math.round(position.x / period.x) * period.x,
        y: Math.round(position.y / period.y) * period.y,
      };
    },
    resize(mobile: boolean) {
      // 整个分区等比缩放，格线与封面始终共用同一比例。
      scale = mobile ? 0.58 : 1;
      period.set(layout.width * scale, layout.height * scale);
      cells.forEach((cell) => {
        cell.key = "";
        cell.root.scale.setScalar(scale);
      });
      lastRange = "";
    },
    update(camera: THREE.PerspectiveCamera) {
      const halfY =
        camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const halfX = halfY * camera.aspect;
      const reachX = halfX + period.x * 0.6,
        reachY = halfY + period.y * 0.6;
      const range = [Math.ceil((camera.position.x - reachX) / period.x), Math.floor((camera.position.x + reachX) / period.x),
        Math.ceil((camera.position.y - reachY) / period.y), Math.floor((camera.position.y + reachY) / period.y)].join(":");
      if (range !== lastRange) {
        lastRange = range;
        const wanted = new Map<string, [number, number]>();
        for (
          let y = Math.ceil((camera.position.y - reachY) / period.y);
          y <= Math.floor((camera.position.y + reachY) / period.y);
          y++
        ) {
          for (
            let x = Math.ceil((camera.position.x - reachX) / period.x);
            x <= Math.floor((camera.position.x + reachX) / period.x);
            x++
          )
            wanted.set(`${x},${y}`, [x, y]);
        }
        // 可见单元始终不动，只回收屏幕外的副本。圆角格线和作品在同一个节点里循环。
        const available = cells.filter((cell) => !wanted.has(cell.key));
        for (const cell of cells) {
          cell.root.visible = wanted.has(cell.key);
          if (cell.root.visible) wanted.delete(cell.key);
        }
        for (const [key, [x, y]] of wanted) {
          const cell = available.pop() ?? makeCell();
          cell.key = key;
          cell.root.visible = true;
          cell.root.position.set(x * period.x, y * period.y, 0);
        }
      }
      // 只有视野内出现音乐横带，场景才需要持续刷新文字流；屏幕外不空转。
      return cells.some(cell => cell.root.visible && audioTiles.some(tile =>
        Math.abs(cell.root.position.x + tile.mesh.position.x * scale - camera.position.x) < halfX + tile.width * scale / 2 &&
        Math.abs(cell.root.position.y + tile.mesh.position.y * scale - camera.position.y) < halfY + tile.height * scale / 2));
    },
    mediaView(camera: THREE.PerspectiveCamera) {
      // 射线包含探索页的 viewOffset；预览、展开与全屏沿同一真实视锥预取。
      viewRay.setFromCamera(corner.set(-1, -1), camera);
      viewRay.ray.intersectPlane(plane, lower);
      viewRay.setFromCamera(corner.set(1, 1), camera);
      viewRay.ray.intersectPlane(plane, upper);
      const cx = (lower.x + upper.x) / 2, cy = (lower.y + upper.y) / 2;
      const hx = (upper.x - lower.x) / 2, hy = (upper.y - lower.y) / 2;
      const near: { key: string; score: number }[] = [], visible: string[] = [];
      for (const tile of photos.values()) {
        if (tile.work!.kind === "audio") continue;
        const tx = tile.mesh.position.x * scale, ty = tile.mesh.position.y * scale;
        const x = tx + Math.round((cx - tx) / period.x) * period.x;
        const y = ty + Math.round((cy - ty) / period.y) * period.y;
        const dx = Math.max(0, Math.abs(x - cx) - tile.width * scale / 2 - hx) / hx;
        const dy = Math.max(0, Math.abs(y - cy) - tile.height * scale / 2 - hy) / hy;
        const outside = Math.max(dx, dy);
        if (outside === 0) visible.push(tile.key);
        // 半个视口的邻域给拖拽留出下载余量；不扫描或预下载整面无限墙。
        if (outside <= 0.55) near.push({ key: tile.key,
          score: (outside > 0 ? 10 + outside : 0) + Math.hypot((x - cx) / hx, (y - cy) / hy) });
      }
      near.sort((a, b) => a.score - b.score);
      return { wanted: near.map(item => item.key), visible };
    },
    hit(ray: THREE.Raycaster): WorkTarget | undefined {
      if (!ray.ray.intersectPlane(plane, point)) return;
      const col = Math.floor(point.x / period.x + 0.5), row = Math.floor(point.y / period.y + 0.5);
      if (!cells.some(cell => cell.root.visible && cell.key === `${col},${row}`)) return;
      const ox = col * period.x, oy = row * period.y;
      const x = (point.x - ox) / scale, y = (point.y - oy) / scale;
      for (const tile of buckets.get(`${Math.floor(x / bucketSize)},${Math.floor(y / bucketSize)}`) ?? []) {
        const radius = tile.photo ? GRID.radius - GRID.inset : 0;
        const qx = Math.abs(x - tile.mesh.position.x) - tile.width / 2 + radius;
        const qy = Math.abs(y - tile.mesh.position.y) - tile.height / 2 + radius;
        if (Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) <= radius)
          return target(tile, ox, oy);
      }
    },
    dispose() {
      cells.forEach((cell) => scene.remove(cell.root));
      cells.length = 0;
    },
  };
}
