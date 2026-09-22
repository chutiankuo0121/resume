import * as THREE from "three";

// 原站 Section - Vincent / 3D / Custom Camera 的最后一段。
// 27.333: position (10,16,-3.5), rotation (.3,2.1,-.3)
// 35.367: position (-10,13.5,-6), rotation (.3,2.6,-.3)
// 36.7～37.467 才降低 Section Config.opacity；37.7 是章节终点。
const START = 27.333;
const END = 37.7;

/** Theatre 的 handles 是归一化时间/值；先反解时间，再取值，不能把它当线性 t。 */
function bezierEase(x: number, x1: number, y1: number, x2: number, y2: number) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const value = (t: number, a: number, b: number) =>
    3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3;
  let low = 0,
    high = 1;
  for (let i = 0; i < 22; i++) {
    const t = (low + high) / 2;
    if (value(t, x1, x2) < x) low = t;
    else high = t;
  }
  return value((low + high) / 2, y1, y2);
}

export function elimarPaperReveal(progress: number) {
  const time = THREE.MathUtils.lerp(START, END, progress);
  return bezierEase((time - 36.7) / (37.467 - 36.7), 0.5, 0, 0.5, 1);
}

/** 将原站同一条位移+旋转轨迹搬到定版镜头上，仅按晶石距离缩放世界单位。 */
export function createElimarExit(camera: THREE.PerspectiveCamera) {
  const referenceStart = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0.3, 2.1, -0.3),
  );
  const referenceInverse = referenceStart.clone().invert();
  const localDisplacement = new THREE.Vector3(-20, -2.5, -2.5).applyQuaternion(
    referenceInverse,
  );
  const center = new THREE.Vector3(-0.142649, 2.588605, -0.616885);
  const localCenter = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const baseRotation = new THREE.Quaternion();
  const referenceRotation = new THREE.Quaternion();
  const rotation = new THREE.Euler(0.3, 2.1, -0.3);
  return {
    update(progress: number) {
      if (progress <= 0) return;
      const time = THREE.MathUtils.lerp(START, END, progress);
      const travel = bezierEase(
        (time - START) / (35.367 - START),
        0.55,
        0.055,
        0.675,
        0.19,
      );
      camera.updateMatrixWorld();
      const depth = -localCenter
        .copy(center)
        .applyMatrix4(camera.matrixWorldInverse).z;
      // 原位移在起始镜头局部 Z 轴上前进 16.4314 单位；按目标深度缩放，
      // 略留 1% 距离余量，横移与转向则保持原来的比例。
      const scale = (depth / 16.431423133) * 0.99;
      baseRotation.copy(camera.quaternion);
      offset
        .copy(localDisplacement)
        .multiplyScalar(scale * travel)
        .applyQuaternion(baseRotation);
      camera.position.add(offset);
      referenceRotation.setFromEuler(
        rotation.set(0.3, 2.1 + 0.5 * travel, -0.3),
      );
      camera.quaternion
        .copy(baseRotation)
        .multiply(referenceInverse)
        .multiply(referenceRotation);
      camera.updateMatrixWorld();
    },
  };
}
