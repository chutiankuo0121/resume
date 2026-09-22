import * as THREE from "three";
import type { Work } from "@/content/works";
import type { PortfolioLayout } from "./layout";
import { GRID } from "./layout";
import type { createPortfolioTiles, Tile } from "./tiles";

export type WorkTarget = {
  work: Work;
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

  function makeCell() {
    const root = new THREE.Group();
    for (const original of builder.template.children as THREE.Mesh[]) {
      const mesh = new THREE.Mesh(original.geometry, original.material);
      mesh.position.copy(original.position);
      mesh.scale.copy(original.scale);
      mesh.renderOrder = original.renderOrder;
      mesh.userData.tile = original.userData.tile;
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
    },
    update(camera: THREE.PerspectiveCamera) {
      const halfY =
        camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const halfX = halfY * camera.aspect;
      const reachX = halfX + period.x * 0.6,
        reachY = halfY + period.y * 0.6;
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
      // 只有视野内出现音乐横带，场景才需要持续刷新文字流；屏幕外不空转。
      return cells.some(cell => cell.root.visible && builder.tiles.some(tile =>
        tile.work?.kind === "audio" &&
        Math.abs(cell.root.position.x + tile.mesh.position.x * scale - camera.position.x) < halfX + tile.width * scale / 2 &&
        Math.abs(cell.root.position.y + tile.mesh.position.y * scale - camera.position.y) < halfY + tile.height * scale / 2));
    },
    hit(ray: THREE.Raycaster): WorkTarget | undefined {
      for (const cell of cells) {
        if (!cell.root.visible) continue;
        // 空白格与格线完全不参与拾取；圆角之外也不能误选作品。
        const meshes = cell.root.children.filter(
          (mesh) => mesh.userData.tile?.work,
        );
        for (const hit of ray.intersectObjects(meshes, false)) {
          const tile = hit.object.userData.tile as Tile;
          if (!hit.uv) continue;
          const photo = photos.get(tile.key)!;
          const radius = tile.photo ? GRID.radius - GRID.inset : 0;
          const qx =
            Math.abs((hit.uv.x - 0.5) * tile.width) - tile.width / 2 + radius;
          const qy =
            Math.abs((hit.uv.y - 0.5) * tile.height) - tile.height / 2 + radius;
          if (
            Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
              Math.min(Math.max(qx, qy), 0) >
            radius
          )
            continue;
          return target(photo, cell.root.position.x, cell.root.position.y);
        }
      }
    },
    dispose() {
      cells.forEach((cell) => scene.remove(cell.root));
      cells.length = 0;
    },
  };
}
