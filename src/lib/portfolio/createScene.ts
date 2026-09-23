import * as THREE from "three";
import { portfolioLayout, type PortfolioMedia, type WorkSummary } from "@/content/works/gallery";
import { createPortfolioCamera } from "./camera";
import { createPortfolioTiles } from "./tiles";
import { createPortfolioField, type WorkTarget } from "./field";
import { lensFragment, screenVertex } from "./shaders";
import { createPortfolioSurface } from "./surface";
import { createPortfolioMediaLoader } from "./media";

import type { PortalPresentation } from "../hub/presentation";
import { createBoundaryUniforms } from "../hub/boundaryField";

type Options = {
  presentation: PortalPresentation;
  canvas: HTMLCanvasElement;
  root: HTMLElement;
  media: PortfolioMedia[];
  onSelect: (work: WorkSummary) => void;
  onIntent: () => void;
  onReady: () => void;
};

export function createPortfolioScene({
  presentation,
  canvas,
  root,
  media,
  onSelect,
  onIntent,
  onReady,
}: Options) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xffffff, 1);
  const scene = new THREE.Scene();
  const rig = createPortfolioCamera();
  const target = new THREE.WebGLRenderTarget(1, 1, { samples: 2 });
  const post = new THREE.Scene();
  const boundary = createBoundaryUniforms(presentation.boundary);
  const lens = new THREE.ShaderMaterial({
    vertexShader: screenVertex,
    fragmentShader: lensFragment,
    uniforms: {
      ...boundary.uniforms,
      uScene: { value: target.texture },
      uStrength: { value: 1 },
    },
    depthTest: false,
    depthWrite: false,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), lens);
  post.add(screen);
  const postCamera = new THREE.Camera();
  const ray = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let disposed = false,
    visible = false,
    frame = 0,
    lastTime = 0;
  let width = 1,
    height = 1,
    hover: WorkSummary | null = null,
    selected: WorkTarget | null = null,
    waiting = false;
  const surface = createPortfolioSurface(scene, wake);
  const layout = portfolioLayout;
  const builder = createPortfolioTiles(layout, media);
  const field = createPortfolioField(scene, layout, builder);
  const loader = createPortfolioMediaLoader(media, (src, image) => {
    builder.enqueue(src, image);
    wake();
  });
  let ready = false, complete = false, viewAt = -Infinity;
  let mediaView: { wanted: string[]; visible: string[] } = { wanted: [], visible: [] };
  const viewPosition = new THREE.Vector3(Infinity, Infinity, Infinity);
  let viewExpansion = -1;
  let hoverPoint: { clientX: number; clientY: number } | null = null;
  const touches = new Map<number, THREE.Vector2>();
  let pinch = 0;
  let tickerTime = 0;
  let drag: {
    id: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
    time: number;
    moved: boolean;
  } | null = null;

  function frameCamera() {
    const framing = 1 - presentation.expansion;
    rig.camera.position.z += 3 * framing;
    if (viewExpansion !== presentation.expansion) {
      rig.camera.setViewOffset(width, height, width * 0.15 * framing, height * 0.15 * framing, width, height);
      viewExpansion = presentation.expansion;
    }
    rig.camera.updateMatrixWorld();
  }

  function prioritize(force = false) {
    const now = performance.now();
    if (!force && (now - viewAt < 80 || viewPosition.distanceToSquared(rig.camera.position) < 0.001)) return;
    viewAt = now;
    viewPosition.copy(rig.camera.position);
    mediaView = field.mediaView(rig.camera);
    if (selected && !mediaView.wanted.includes(selected.key)) mediaView.wanted.unshift(selected.key);
    loader.prioritize(mediaView.wanted);
  }

  function wake() {
    if (
      !disposed &&
      visible &&
      presentation.visible &&
      !presentation.suspended &&
      !document.hidden &&
      !frame
    )
      frame = requestAnimationFrame(draw);
  }

  function draw(timestamp: number) {
    frame = 0;
    if (presentation.suspended) {
      lastTime = 0;
      return;
    }
    const dt = Math.min(
      (timestamp - (lastTime || timestamp - 16)) / 1000,
      0.04,
    );
    lastTime = timestamp;
    boundary.update();
    const reduced = motion.matches;
    rig.update(dt, reduced);
    // 预览向左上取景；展开时沿同一相机回到全幅，浏览坐标不变。
    frameCamera();
    const { x, y } = rig.camera.position;
    const dx =
      Math.abs(x) > field.period.x * 32
        ? Math.round(x / field.period.x) * field.period.x
        : 0;
    const dy =
      Math.abs(y) > field.period.y * 32
        ? Math.round(y / field.period.y) * field.period.y
        : 0;
    if (dx || dy) {
      rig.shift(dx, dy);
      surface.shift(dx, dy);
      if (selected) {
        selected.position.x -= dx;
        selected.position.y -= dy;
      }
      rig.camera.updateMatrixWorld();
    }
    const audioVisible = field.update(rig.camera);
    prioritize();
    if (builder.pending) {
      for (const src of builder.upload(renderer, mediaView.wanted, loader.release)) loader.uploaded(src);
    }
    if (hoverPoint && !selected && !drag) {
      const next = hit(hoverPoint)?.work ?? null;
      if (next && next.id !== hover?.id) onIntent();
      hover = next;
      hoverPoint = null;
      canvas.style.cursor = next ? "pointer" : "grab";
    }
    surface.update(rig.camera);
    if (!reduced && !selected) tickerTime += dt;
    builder.update(hover, tickerTime);
    lens.uniforms.uStrength.value = reduced ? 0 : rig.distortion;
    scene.updateMatrixWorld();
    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(scene, rig.camera);
    renderer.setRenderTarget(null);
    renderer.render(post, postCamera);
    if (!ready && (mediaView.visible.length === 0 || mediaView.visible.some(loader.ready))) {
      ready = true;
      performance.mark("portfolio:first-preview");
      onReady();
    }
    if (!complete && ready && mediaView.visible.every(loader.ready)) {
      complete = true;
      performance.mark("portfolio:visible-ready");
    }
    if (waiting && rig.arrived) {
      waiting = false;
      if (selected) onSelect(selected.work);
    }
    if (
      !rig.settled ||
      waiting ||
      builder.pending ||
      (audioVisible && !reduced && !selected && presentation.interactive) ||
      (!motion.matches && presentation.boundary.expansion < 0.999)
    )
      wake();
    else lastTime = 0;
  }

  function resize() {
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    // 限制 4K 和高 DPR 的离屏缓冲，交互品质不靠堆四倍像素换取。
    const dpr = Math.min(
      window.devicePixelRatio,
      1.75,
      Math.sqrt(4_000_000 / (width * height)),
    );
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    target.setSize(Math.round(width * dpr), Math.round(height * dpr));
    rig.resize(width, height);
    viewExpansion = -1;
    const previous = field.period.clone();
    field.resize(width < 800);
    const sx = field.period.x / previous.x,
      sy = field.period.y / previous.y;
    rig.rescale(sx, sy);
    if (selected) {
      selected.position.x *= sx;
      selected.position.y *= sy;
      selected = field.nearest(selected.key, selected.position)!;
      rig.focus(selected.position, selected.width, selected.height);
    }
    rig.update(0, motion.matches);
    frameCamera();
    prioritize(true);
    wake();
  }

  function updatePresentation() {
    root.dataset.interactive = String(presentation.interactive);
    if (!presentation.interactive || presentation.suspended) {
      for (const id of touches.keys())
        if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
      touches.clear();
      drag = null;
      pinch = 0;
      hover = null;
      hoverPoint = null;
      rig.release();
    }
    wake();
  }

  function hit(
    event: Pick<PointerEvent, "clientX" | "clientY">,
  ): WorkTarget | undefined {
    const box = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      1 - ((event.clientY - box.top) / box.height) * 2,
    );
    // 点击射线必须使用与后处理相同的采样坐标，否则弯曲的边缘会点不中。
    pointer.multiplyScalar(
      1 - 0.11 * lens.uniforms.uStrength.value * pointer.lengthSq(),
    );
    ray.setFromCamera(pointer, rig.camera);
    return field.hit(ray);
  }

  function select(destination: WorkTarget) {
    if (selected || !presentation.interactive) return;
    selected = destination;
    onIntent();
    waiting = true;
    hover = null;
    rig.focus(destination.position, destination.width, destination.height);
    prioritize(true);
    wake();
  }

  function restore() {
    if (!selected) return;
    selected = null;
    waiting = false;
    hover = null;
    rig.restore();
    wake();
  }

  function down(event: PointerEvent) {
    if (event.button !== 0 || selected || !presentation.interactive) return;
    canvas.focus({ preventScroll: true });
    touches.set(
      event.pointerId,
      new THREE.Vector2(event.clientX, event.clientY),
    );
    canvas.setPointerCapture(event.pointerId);
    if (touches.size === 2) {
      const p = [...touches.values()];
      pinch = p[0].distanceTo(p[1]);
      drag = null;
    } else {
      drag = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        y: event.clientY,
        time: event.timeStamp,
        moved: false,
      };
    }
  }

  function move(event: PointerEvent) {
    if (selected) return;
    const box = canvas.getBoundingClientRect();
    // 指针目标交给相机弹簧追随，拖拽和双指缩放时暂停视差更新。
    if (!drag && touches.size === 0)
      rig.pointer(
        ((event.clientX - box.left) / width) * 2 - 1,
        ((event.clientY - box.top) / height) * 2 - 1,
      );
    if (!presentation.interactive) {
      wake();
      return;
    }
    if (touches.has(event.pointerId))
      touches.set(
        event.pointerId,
        new THREE.Vector2(event.clientX, event.clientY),
      );
    if (touches.size === 2) {
      const p = [...touches.values()],
        next = p[0].distanceTo(p[1]);
      rig.zoom((pinch - next) * 0.015);
      pinch = next;
      wake();
      return;
    }
    if (drag && event.pointerId === drag.id) {
      if (
        !drag.moved &&
        Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6
      )
        return;
      const dx = event.clientX - drag.x,
        dy = event.clientY - drag.y;
      const speed =
        Math.hypot(dx, dy) / Math.max(1, event.timeStamp - drag.time);
      rig.pan(dx / width, dy / height, speed);
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.time = event.timeStamp;
      drag.moved = true;
      canvas.style.cursor = "grabbing";
      hover = null;
      wake();
      return;
    }
    hoverPoint = { clientX: event.clientX, clientY: event.clientY };
    wake();
  }

  function up(event: PointerEvent) {
    if (!touches.has(event.pointerId)) return;
    const tap =
      drag?.id === event.pointerId && !drag.moved && event.type === "pointerup";
    touches.delete(event.pointerId);
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    drag = null;
    canvas.style.cursor = "grab";
    rig.release();
    if (tap) {
      const tile = hit(event);
      if (tile) select(tile);
    }
    wake();
  }
  function leave() {
    if (drag) return;
    rig.pointer(0, 0);
    hover = null;
    hoverPoint = null;
    wake();
  }
  function keyboard(event: KeyboardEvent) {
    if (selected) {
      if (event.key === "Escape") {
        restore();
      }
      return;
    }
    if (!presentation.interactive) return;
    const offsets: Record<string, [number, number]> = {
      ArrowLeft: [0.12, 0],
      ArrowRight: [-0.12, 0],
      ArrowUp: [0, 0.12],
      ArrowDown: [0, -0.12],
    };
    if (event.key in offsets) {
      event.preventDefault();
      rig.pan(...offsets[event.key]);
      rig.release();
    } else if (event.key === "Home") {
      event.preventDefault();
      reset();
    } else if (event.key === "Enter") {
      event.preventDefault();
      const box = canvas.getBoundingClientRect();
      const tile = hit({
        clientX: box.left + width / 2,
        clientY: box.top + height / 2,
      });
      if (tile) select(tile);
    } else if (event.key === "+" || event.key === "=") rig.zoom(-1);
    else if (event.key === "-") rig.zoom(1);
    else return;
    wake();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const visibility = new IntersectionObserver((entries) => {
    // 缩放与快速定位可能在同一批回调中离开又进入视口，应以最后一次状态唤醒画布。
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) wake();
    else {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }
  });
  visibility.observe(canvas);
  const refresh = () => {
    lastTime = 0;
    updatePresentation();
    wake();
  };
  const wheel = (event: WheelEvent) => {
    if (!presentation.interactive || selected) return;
    event.preventDefault();
    const unit =
      event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
    if (event.ctrlKey) rig.zoom(event.deltaY * unit * 0.01);
    else {
      rig.pan(
        ((-event.deltaX * unit) / width) * 0.45,
        ((-event.deltaY * unit) / height) * 0.45,
      );
      rig.release();
    }
    wake();
  };
  root.addEventListener("portal-update", updatePresentation);
  canvas.addEventListener("wheel", wheel, { passive: false });
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("pointerleave", leave);
  canvas.addEventListener("keydown", keyboard);
  document.addEventListener("visibilitychange", refresh);
  motion.addEventListener("change", refresh);
  resize();
  updatePresentation();

  function reset() {
    rig.reset(field.origin(rig.camera.position));
    wake();
  }

  return {
    restore,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      loader.dispose();
      root.removeEventListener("portal-update", updatePresentation);
      canvas.removeEventListener("wheel", wheel);
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", refresh);
      motion.removeEventListener("change", refresh);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("keydown", keyboard);
      field.dispose();
      builder.dispose();
      surface.dispose();
      screen.geometry.dispose();
      lens.dispose();
      target.dispose();
      renderer.dispose();
      scene.clear();
      post.clear();
    },
  };
}
