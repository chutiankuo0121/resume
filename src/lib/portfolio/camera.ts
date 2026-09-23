import { MathUtils, PerspectiveCamera } from "three";

// 保留远景构图；抓取按当前浏览距离后撤 12%～50%，缩放后仍有相同的空间反馈。
const VIEW = { browse: 9, mobile: 6.8, grabLift: 0.12, dragLift: 0.5 };
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
    lens = spring(1),
    lift = spring(0);
  let baseZ = VIEW.browse,
    mobile = false;

  return {
    camera,
    get distortion() {
      return lens.value;
    },
    get settled() {
      return [x, y, z, px, py, lens, lift].every(
        (s) =>
          Math.abs(s.target - s.value) < 0.002 && Math.abs(s.velocity) < 0.003,
      );
    },
    resize(width: number, height: number) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const nextMobile = width < 800;
      if (nextMobile !== mobile && baseZ === (mobile ? VIEW.mobile : VIEW.browse)) {
        baseZ = nextMobile ? VIEW.mobile : VIEW.browse;
        z.target = baseZ;
      }
      mobile = nextMobile;
      lens.target = mobile ? 0.4 : 1;
    },
    pointer(nx: number, ny: number) {
      px.target = nx * 0.5;
      py.target = -ny * 0.5;
    },
    pan(dx: number, dy: number, speed?: number) {
      // 循环作品场保留连续坐标，不对弹簧目标直接取模，避免跨界反跳。
      x.target -= dx * 15;
      y.target += dy * 15;
      // 只有真实拖拽提供速度：慢拖也能抓起，快拖加深后撤；滚轮和方向键只平移。
      if (speed !== undefined)
        lift.target = MathUtils.lerp(
          VIEW.grabLift,
          VIEW.dragLift,
          MathUtils.clamp(speed / 3, 0, 1),
        );
    },
    release() {
      lift.target = 0;
    },
    zoom(delta: number) {
      lift.target = 0;
      baseZ = MathUtils.clamp(baseZ + delta, 4, 22);
      z.target = baseZ;
    },
    reset(origin: { x: number; y: number }) {
      lift.target = 0;
      baseZ = mobile ? VIEW.mobile : VIEW.browse;
      x.target = origin.x;
      y.target = origin.y;
      z.target = baseZ;
      lens.target = mobile ? 0.4 : 1;
    },
    shift(dx: number, dy: number) {
      // 浮动原点：当前位置与目标一起平移，保留速度与相对距离。
      x.value -= dx;
      x.target -= dx;
      y.value -= dy;
      y.target -= dy;
      camera.position.x -= dx;
      camera.position.y -= dy;
    },
    rescale(sx: number, sy: number) {
      x.value *= sx;
      x.target *= sx;
      x.velocity *= sx;
      y.value *= sy;
      y.target *= sy;
      y.velocity *= sy;
      camera.position.x *= sx;
      camera.position.y *= sy;
    },
    update(dt: number, reduced: boolean) {
      advance(x, dt, 200, 40, reduced);
      advance(y, dt, 200, 40, reduced);
      advance(z, dt, 300, 120, reduced);
      advance(px, dt, 400, 50, reduced);
      advance(py, dt, 400, 50, reduced);
      advance(lens, dt, 40, 30, reduced);
      // 抓取与浏览缩放分开。松手回落保留当前位置和速度，可在中途再次抓起。
      advance(lift, dt, 220, 34, reduced);
      const weight = reduced ? 0 : 1;
      // 浏览机位由弹簧决定，中转页的展开取景在场景层叠加。
      camera.position.set(
        x.value + px.value * weight,
        y.value + py.value * weight,
        z.value * (1 + lift.value * weight),
      );
      camera.updateMatrixWorld();
    },
  };
}
