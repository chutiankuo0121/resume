import { MathUtils, PerspectiveCamera } from "three";

// 相机沿作品平面漫游：浏览距离 5.5、快速拖动 10、聚焦至少 2.2。
// 距离是世界单位；镜头畸变与指针偏移共同形成空间感。
const VIEW = { browse: 5.5, drag: 10, focus: 2.2 };
type Spring = { value: number; target: number; velocity: number };
const spring = (value: number): Spring => ({
  value,
  target: value,
  velocity: 0,
});

function advance(
  s: Spring,
  dt: number,
  tension: number,
  friction: number,
  instant: boolean,
) {
  if (instant) {
    s.value = s.target;
    s.velocity = 0;
    return;
  }
  // 固定小步积分，120Hz 和低帧率下都不会因高阻尼弹簧产生振荡。
  const steps = Math.max(1, Math.ceil(dt * 120));
  for (let i = 0; i < steps; i++) {
    const step = dt / steps;
    s.velocity +=
      ((s.target - s.value) * tension - s.velocity * friction) * step;
    s.value += s.velocity * step;
  }
}

export function createPortfolioCamera() {
  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  const x = spring(0),
    y = spring(0),
    z = spring(VIEW.browse);
  const px = spring(0),
    py = spring(0),
    lens = spring(1);
  let focused = false,
    baseZ = VIEW.browse,
    mobile = false;
  let saved = { x: 0, y: 0, z: VIEW.browse };

  return {
    camera,
    get distortion() {
      return lens.value;
    },
    get settled() {
      return [x, y, z, px, py, lens].every(
        (s) =>
          Math.abs(s.target - s.value) < 0.002 && Math.abs(s.velocity) < 0.003,
      );
    },
    get arrived() {
      return (
        Math.abs(x.target - x.value) +
          Math.abs(y.target - y.value) +
          Math.abs(z.target - z.value) <
        0.08
      );
    },
    resize(width: number, height: number) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const nextMobile = width < 800;
      if (nextMobile !== mobile && !focused && baseZ < 7) {
        baseZ = nextMobile ? 6.1 : VIEW.browse;
        z.target = baseZ;
      }
      mobile = nextMobile;
      lens.target = focused ? 0 : mobile ? 0.4 : 1;
    },
    pointer(nx: number, ny: number) {
      px.target = nx * 0.5;
      py.target = -ny * 0.5;
    },
    pan(dx: number, dy: number, speed = 0) {
      if (focused) return;
      // 循环作品场保留连续坐标，不对弹簧目标直接取模，避免跨界反跳。
      x.target -= dx * 15;
      y.target += dy * 15;
      z.target = MathUtils.lerp(
        baseZ,
        Math.max(baseZ, VIEW.drag),
        MathUtils.clamp(speed / 3, 0, 1),
      );
    },
    release() {
      if (!focused) z.target = baseZ;
    },
    zoom(delta: number) {
      if (focused) return;
      baseZ = MathUtils.clamp(baseZ + delta, 4, 22);
      z.target = baseZ;
    },
    reset(origin: { x: number; y: number }) {
      focused = false;
      baseZ = mobile ? 6.1 : VIEW.browse;
      x.target = origin.x;
      y.target = origin.y;
      z.target = baseZ;
      lens.target = mobile ? 0.4 : 1;
    },
    focus(position: { x: number; y: number }, width: number, height: number) {
      if (!focused) saved = { x: x.target, y: y.target, z: baseZ };
      focused = true;
      x.target = position.x;
      y.target = position.y;
      // 2.2 是原站 2×2 主图的距离；非方形及手机按完整画幅约束，避免裁掉作品。
      const fit =
        Math.max(height, width / camera.aspect) /
        (2 * Math.tan(MathUtils.degToRad(camera.fov / 2)) * 0.74);
      z.target = Math.max(VIEW.focus, fit);
      lens.target = 0;
    },
    restore() {
      focused = false;
      baseZ = saved.z;
      x.target = saved.x;
      y.target = saved.y;
      z.target = baseZ;
      lens.target = mobile ? 0.4 : 1;
    },
    shift(dx: number, dy: number) {
      // 浮动原点：当前位置、目标、详情返回点一起平移，保留速度与相对距离。
      x.value -= dx;
      x.target -= dx;
      saved.x -= dx;
      y.value -= dy;
      y.target -= dy;
      saved.y -= dy;
      camera.position.x -= dx;
      camera.position.y -= dy;
    },
    rescale(sx: number, sy: number) {
      x.value *= sx;
      x.target *= sx;
      x.velocity *= sx;
      saved.x *= sx;
      y.value *= sy;
      y.target *= sy;
      y.velocity *= sy;
      saved.y *= sy;
      camera.position.x *= sx;
      camera.position.y *= sy;
    },
    update(dt: number, reduced: boolean) {
      advance(x, dt, focused ? 100 : 200, 40, reduced);
      advance(y, dt, focused ? 100 : 200, 40, reduced);
      advance(z, dt, focused ? 40 : 300, focused ? 30 : 120, reduced);
      advance(px, dt, 400, 50, reduced);
      advance(py, dt, 400, 50, reduced);
      advance(lens, dt, 40, 30, reduced);
      const weight = reduced ? 0 : focused ? 0.15 : 1;
      // 浏览机位由弹簧决定，中转页的展开取景在场景层叠加。
      camera.position.set(
        x.value + px.value * weight,
        y.value + py.value * weight,
        z.value,
      );
      camera.updateMatrixWorld();
    },
  };
}
