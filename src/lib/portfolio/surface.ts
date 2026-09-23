import * as THREE from "three";
import { assetUrl } from "../assetUrl";

/** 仅负责远处纸纹；前景格线和媒体统一由 layout / tiles 构建。 */
export function createPortfolioSurface(
  scene: THREE.Scene,
  invalidate: () => void,
) {
  let disposed = false;
  const texturePhase = new THREE.Vector2();
  const texture = new THREE.TextureLoader().load(
    assetUrl("/portfolio/paper-grain.webp"),
    (loaded) => {
      if (disposed) loaded.dispose();
      else {
        paper.visible = true;
        invalidate();
      }
    },
  );
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const paper = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false,
      transparent: true,
      depthWrite: false,
    }),
  );
  paper.position.z = -25;
  paper.renderOrder = -2;
  // 贴图解码前保留白场，避免首次进入时出现尚未上传的黑色纹理。
  paper.visible = false;
  scene.add(paper);

  return {
    shift(dx: number, dy: number) {
      // 原点回收时保留远景纹理相位，不让纸石纹理突然跳到另一块。
      texturePhase.x = THREE.MathUtils.euclideanModulo(
        texturePhase.x + dx * 0.07,
        1,
      );
      texturePhase.y = THREE.MathUtils.euclideanModulo(
        texturePhase.y + dy * 0.07,
        1,
      );
    },
    update(camera: THREE.PerspectiveCamera) {
      // 背景跟随视锥扩展，但 UV 锚定世界坐标，保留 Z=-25 的真实视差。
      const side =
        2 *
          (camera.position.z + 25) *
          Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
          Math.hypot(camera.aspect, 1) +
        4;
      paper.scale.set(side, side, 1);
      paper.position.set(camera.position.x, camera.position.y, -25);

      texture.repeat.set(side * 0.07, side * 0.07);
      texture.offset.set(
        THREE.MathUtils.euclideanModulo(
          (camera.position.x - side / 2) * 0.07 + texturePhase.x,
          1,
        ),
        THREE.MathUtils.euclideanModulo(
          (camera.position.y - side / 2) * 0.07 + texturePhase.y,
          1,
        ),
      );
    },
    dispose() {
      disposed = true;
      scene.remove(paper);
      paper.geometry.dispose();
      paper.material.dispose();
      texture.dispose();
    },
  };
}
