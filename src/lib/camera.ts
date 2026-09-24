import * as THREE from "three";
import { createElimarExit } from "./elimarExit";
// 入场终点的基础构图；阅读阶段以晶石为中心继续向右环绕。
const finalHeading = 1.16;
const finalDesktop = [4.52075, 2.36395, 2.1864] as const;
const finalNarrow = [5.76591, 2.38705, 3.08398] as const;

export function createCameraRig(camera: THREE.PerspectiveCamera) {
  // 雾光平面的定位锚点，用最终视角确定平面深度。
  const pivot = new THREE.Vector3(0.02, 2.97, 0.875);
  const crystalCenter = new THREE.Vector3(-0.142649, 2.588605, -0.616885);
  const orbitAxis = new THREE.Vector3(0, 1, 0);
  const orbitRotation = new THREE.Quaternion();
  const rotation = new THREE.Euler(0, 0, 0, "YXZ");
  const baseWorld = new THREE.Matrix4();
  const baseToClip = new THREE.Matrix4();
  const pivotView = new THREE.Vector3();
  const atmosphereMap = new THREE.Matrix3();
  const exit = createElimarExit(camera);
  function placeScrollCamera(travel: number, mobile: boolean) {
    const end = mobile ? finalNarrow : finalDesktop;
    camera.position.set(end[0], end[1], end[2]);
    camera.quaternion.setFromEuler(rotation.set(0, finalHeading, 0));
    const compact = THREE.MathUtils.clamp((1.6 - camera.aspect) / 0.6, 0, 1);
    const setback = mobile ? 5.5 : 1.25 + compact * 2.45;
    camera.translateZ(setback);
    camera.translateX(mobile ? 0.64 : 0.4 + compact * 0.5);
    camera.position.y += 0.35;
    // 五次曲线令起止速度、加速度均为零，统一驱动距离、旋转和构图偏移。
    const ease = THREE.MathUtils.smootherstep(travel, 0, 1);
    const distanceScale = THREE.MathUtils.lerp(0.64, 1, ease);
    if (travel < 1) {
      const arc = -0.38 * (1 - ease);
      camera.position
        .sub(crystalCenter)
        .multiplyScalar(distanceScale)
        .applyAxisAngle(orbitAxis, arc)
        .add(crystalCenter);
      camera.quaternion.setFromEuler(rotation.set(0, finalHeading + arc, 0));
      camera.translateX((mobile ? 0.1 : 0.42) * (1 - ease));
      camera.position.y += 0.28 * (1 - ease);
    }
    camera.updateMatrixWorld();
    // 手机/窄屏后撤引起的深度变化也补偿到粒子运动平面。
    return (
      distanceScale *
      ((end[0] - finalDesktop[0]) * Math.sin(finalHeading) +
        (end[2] - finalDesktop[2]) * Math.cos(finalHeading) +
        setback -
        1.25)
    );
  }
  return {
    atmosphereMap,
    update(
      travel: number,
      mobile: boolean,
      pointer: THREE.Vector2,
      orbitProgress: number,
      exitProgress = 0,
    ) {
      // 先获取最终镜头的场景平面，再将当前屏幕射线映射回该固定平面。
      placeScrollCamera(1, mobile);
      baseWorld.copy(camera.matrixWorld);
      const depth = -pivotView
        .copy(pivot)
        .applyMatrix4(camera.matrixWorldInverse).z;
      const framingDepth = placeScrollCamera(travel, mobile);
      // 同步旋转位置与朝向，保持晶石中心的屏幕位置、距离与深度。
      // 每帧由滚动进度重建，回滚可原路返回，出场继承环绕终点。
      const orbitAngle = THREE.MathUtils.degToRad(mobile ? 16 : 25) *
        THREE.MathUtils.smootherstep(orbitProgress, 0, 1);
      orbitRotation.setFromAxisAngle(orbitAxis, orbitAngle);
      camera.position.sub(crystalCenter).applyQuaternion(orbitRotation).add(crystalCenter);
      camera.quaternion.premultiply(orbitRotation);
      // 出场承接当前鼠标视角；中途回正会与退出轨迹叠加，造成先反向再横移。
      camera.rotateX(-pointer.y * Math.PI * 0.005);
      camera.rotateY(-pointer.x * Math.PI * 0.025);
      exit.update(exitProgress);
      camera.updateMatrixWorld();
      // 雾光边界随空间投影移动；粒子已用当前相机渲染，不重复变换。
      baseToClip
        .copy(camera.projectionMatrix)
        .multiply(camera.matrixWorldInverse)
        .multiply(baseWorld);
      const p = camera.projectionMatrix.elements,
        m = baseToClip.elements;
      const dx = depth / p[0],
        dy = depth / p[5],
        ox = dx * p[8],
        oy = dy * p[9];
      atmosphereMap
        .set(
          m[0] * dx,
          m[4] * dy,
          m[0] * ox + m[4] * oy - m[8] * depth + m[12],
          m[1] * dx,
          m[5] * dy,
          m[1] * ox + m[5] * oy - m[9] * depth + m[13],
          m[3] * dx,
          m[7] * dy,
          m[3] * ox + m[7] * oy - m[11] * depth + m[15],
        )
        .invert();
      return framingDepth;
    },
  };
}
