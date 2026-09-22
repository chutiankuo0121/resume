import * as THREE from "three";
import { gsap } from "gsap";
// 输入缓动与 WebGL 使用共享时钟，不另启动画循环。
const ease = gsap.parseEase("power4.out");
export function holeFollowScale(
  width: number,
  height: number,
): [number, number] {
  // 方形雾场以长边为基准；75° 透视下补偿其深度引起的投影放大。
  const projection =
    1 /
    (1 -
      (24 * Math.tan(THREE.MathUtils.degToRad(37.5))) / Math.max(height, 50));
  const pixels = Math.max(width, height) * 0.1 * projection;
  return [pixels / width, pixels / height];
}
export function createPointerMotion() {
  const target = new THREE.Vector2();
  const holeStart = new THREE.Vector2();
  const hole = new THREE.Vector2();
  const crystal = new THREE.Vector2();
  let holeElapsed = 6;
  return {
    hole,
    crystal,
    set(x: number, y: number) {
      target.set(
        THREE.MathUtils.clamp(x, -1, 1),
        THREE.MathUtils.clamp(y, -1, 1),
      );
      holeStart.copy(hole);
      holeElapsed = 0;
    },
    reset() {
      target.set(0, 0);
      holeStart.set(0, 0);
      hole.set(0, 0);
      crystal.set(0, 0);
      holeElapsed = 6;
    },
    update(dt: number, reduced: boolean) {
      if (reduced) {
        this.reset();
        return;
      }
      // 黑洞重新定向六秒曲线；晶石镜头每帧平滑追随目标。
      holeElapsed = Math.min(6, holeElapsed + dt);
      hole.lerpVectors(holeStart, target, ease(holeElapsed / 6));
      crystal.lerp(target, ease(Math.min(dt / 3, 1)));
    },
  };
}
