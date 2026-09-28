import * as THREE from "three";
import { gsap } from "gsap";
import type { Skill } from "@/content/skills";
import { createScreen, createScreenGeometry } from "./screens";
import { moteFragment, moteVertex } from "./shaders";
import { createEnvironment } from "./environment";
import { bindSkillControls } from "./controls";
import { createPointerField } from "./pointerField";
import { createPointerLight } from "./pointerLight";
import { createEnvironmentPalette, createPaletteUniforms } from "./palette";
import { createPointerInput } from "../createPointerInput";

import type { PortalPresentation } from "../hub/presentation";

type Options = {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  skills: Skill[];
  signal: AbortSignal;
  presentation: PortalPresentation;
  onSelect: (index: number) => void;
};
const smooth = (x: number) => THREE.MathUtils.smootherstep(x, 0, 1);
const modulo = (x: number, n: number) => ((x % n) + n) % n;

/** 图片 → 透明方块屏幕 → 环形画廊。浏览进度独立于主页面，随时可反向与返回。 */
export async function createSkillsScene({
  root,
  canvas,
  skills,
  signal,
  presentation,
  onSelect,
}: Options) {
  const loader = new THREE.TextureLoader();
  const loaded = await Promise.allSettled(
    skills.map((skill) => loader.loadAsync(skill.image)),
  );
  const textures = loaded.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  if (signal.aborted || textures.length !== skills.length) {
    textures.forEach((texture) => texture.dispose());
    throw new Error(
      signal.aborted ? "Skills load cancelled" : "Skills images could not load",
    );
  }
  textures.forEach((texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
  });
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    textures.forEach((texture) => texture.dispose());
    throw error;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
  const projector = new THREE.PerspectiveCamera(40, 35 / 23, 0.1, 80);
  const projection = { value: new THREE.Matrix4() },
    light = { value: new THREE.Vector3() };
  const resolution = { value: new THREE.Vector2() };
  const surfaceField = createPointerField(renderer, {
    thickness: 0.25,
    persistence: 0.75,
  });
  const time = { value: 0 };
  const pointer = new THREE.Vector2(),
    follow = new THREE.Vector2();
  const pointerInput = createPointerInput(canvas);
  const mobileReading = matchMedia("(max-width: 900px)");
  const palette = createEnvironmentPalette(skills.map(skill => skill.palette));
  const environment = createEnvironment(renderer, scene, time, palette.uniforms);
  const pointerLight = createPointerLight(
    renderer,
    surfaceField.texture,
    time,
    presentation.boundary,
    palette.uniforms,
  );

  const shared = createScreenGeometry();
  const screens = textures.map((texture, index) =>
    createScreen(
      texture,
      shared,
      time,
      renderer,
      projection,
      surfaceField.texture,
      resolution,
      light,
      createPaletteUniforms(skills[index].palette),
    ),
  );
  const artwork = new THREE.Group();
  screens.forEach((screen) => artwork.add(screen.group));
  scene.add(artwork);
  const artworkInverse = new THREE.Matrix4();
  const positions = new Float32Array(800 * 3),
    seeds = new Float32Array(800);
  for (let i = 0; i < seeds.length; i++) {
    const random = () => THREE.MathUtils.seededRandom();
    if (i === 0) THREE.MathUtils.seededRandom(8841);
    positions.set(
      [(random() - 0.5) * 23, (random() - 0.5) * 12, random() * 13 - 7],
      i * 3,
    );
    seeds[i] = random();
  }
  const moteGeometry = new THREE.BufferGeometry();
  moteGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );
  moteGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  const moteMaterial = new THREE.ShaderMaterial({
    vertexShader: moteVertex,
    fragmentShader: moteFragment,
    uniforms: {
      uTime: time,
      uPixelRatio: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
  });
  const motes = new THREE.Points(moteGeometry, moteMaterial);
  motes.renderOrder = 5;
  scene.add(motes);

  const stage = root.querySelector<HTMLElement>(".skills-stage")!;
  const layout = { x: 0, y: 0 };
  let layoutDirty = true, wasReading = false;
  function invalidateLayout() { layoutDirty = true; pointerInput.invalidate(); }
  function measureLayout() {
    const bounds = canvas.getBoundingClientRect();
    const target = stage.getBoundingClientRect();
    layout.x = (target.left - bounds.left + target.width / 2) / width - 0.5;
    layout.y = 0.5 - (target.top - bounds.top + target.height / 2) / height;
    layoutDirty = false;
  }
  let width = 0,
    height = 0,
    pixelRatio = 0,
    compact = false;
  let inViewport = false, viewExpansion = -1;
  let progress = 0,
    lastTime = 0,
    disposed = false;
  let pointerActive = false,
    pointerX = 0,
    pointerY = 0,
    wasVisible = false;
  let targetProgress = 0,
    destination = 0,
    wheelUntil = 0,
    wheelDirection = 0,
    wheelSum = 0,
    wheelAt = 0,
    scrollNudge = 0;
  let steering = 0,
    roll = 0,
    sceneRoll = 0,
    zoom = 0,
    lastPointerX = 0,
    lastReveal = -1;
  let navigation: gsap.core.Tween | undefined;
  const raycaster = new THREE.Raycaster(),
    localRay = new THREE.Ray();
  const inverse = new THREE.Matrix4(),
    plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.2);
  const intersection = new THREE.Vector3(),
    worldHit = new THREE.Vector3(),
    touchUv = new THREE.Vector2();
  const screenUv = new THREE.Vector2(),
    pointerNdc = new THREE.Vector2();

  function updatePointerFields(dt: number) {
    let nearest = -1,
      distance = Infinity;
    // 只与整块屏幕的局部平面求交，不逐个检测上万个实例。
    const surfaceActive = pointerActive && !document.querySelector("dialog[open]");
    if (surfaceActive) {
      raycaster.setFromCamera(
        pointerNdc.set((pointerX / width) * 2 - 1, 1 - (pointerY / height) * 2),
        camera,
      );
      screens.forEach((screen, index) => {
        if (!screen.group.visible) return;
        screen.group.updateMatrixWorld();
        inverse.copy(screen.group.matrixWorld).invert();
        localRay.copy(raycaster.ray).applyMatrix4(inverse);
        if (localRay.direction.z >= 0) return;
        if (
          !localRay.intersectPlane(plane, intersection) ||
          Math.abs(intersection.x) > 5.25 ||
          Math.abs(intersection.y) > 3.45
        )
          return;
        worldHit.copy(intersection).applyMatrix4(screen.group.matrixWorld);
        const depth = worldHit.distanceToSquared(camera.position);
        if (depth < distance) {
          distance = depth;
          nearest = index;
          touchUv.set(intersection.x / 10.5 + 0.5, intersection.y / 6.9 + 0.5);
        }
      });
    }
    screens.forEach((screen, index) =>
      screen.pointerField.update(dt, index === nearest ? touchUv : null),
    );
    surfaceField.update(
      dt,
      surfaceActive
        ? screenUv.set(pointerX / width, 1 - pointerY / height)
        : null,
    );
  }

  function resize() {
    const nextWidth = canvas.clientWidth, nextHeight = canvas.clientHeight;
    if (!nextWidth || !nextHeight) return;
    invalidateLayout();
    const dpr = Math.min(
      devicePixelRatio,
      1.6,
      Math.sqrt(2_200_000 / (nextWidth * nextHeight)),
    );
    // 阅读区重新排版不代表画布尺寸变化，避免重建相同尺寸的帧缓冲。
    if (width === nextWidth && height === nextHeight && pixelRatio === dpr) return;
    width = nextWidth;
    height = nextHeight;
    pixelRatio = dpr;
    viewExpansion = -1;
    compact = width < 800;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    resolution.value.set(canvas.width, canvas.height);
    surfaceField.setAspect(width / height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    environment.resize(canvas.width, canvas.height);
    pointerLight.resize(canvas.width, canvas.height);
    moteMaterial.uniforms.uPixelRatio.value = dpr;
  }

  function tick(seconds: number) {
    if (disposed || document.hidden || presentation.suspended) {
      lastTime = 0;
      return;
    }
    if (
      !presentation.visible ||
      !inViewport
    ) {
      if (!stage.inert) stage.inert = true;
      lastTime = 0;
      if (wasVisible) {
        controls.cancel();
        screens.forEach((screen) => screen.pointerField.clear());
        surfaceField.clear();
        wasVisible = false;
      }
      return;
    }
    wasVisible = true;
    if (stage.inert === presentation.interactive) stage.inert = !presentation.interactive;
    const reading = root.dataset.reading === "true";
    if (reading !== wasReading) { invalidateLayout(); wasReading = reading; }
    if (layoutDirty) measureLayout();
    const input = presentation.interactive ? pointerInput.sample() : null;
    pointerActive = input !== null;
    if (input) {
      pointer.set(input.x, input.y);
      pointerX = (input.x + 1) * width / 2;
      pointerY = (input.y + 1) * height / 2;
    } else pointer.set(0, 0);
    const dt = Math.min(0.05, lastTime ? seconds - lastTime : 0.016);
    lastTime = seconds;
    scrollNudge *= Math.exp(-dt * 5);
    // GSAP 驱动滚动目标，再用 5/s 指数追随生成可见角度；滚动量不直接设姿态。
    progress = THREE.MathUtils.damp(
      progress,
      targetProgress + scrollNudge,
      stage.dataset.dragging ? 12 : 5,
      dt,
    );
    if (
      Math.abs(progress - targetProgress) < 0.0001 &&
      Math.abs(scrollNudge) < 0.0001
    )
      progress = targetProgress;
    time.value += dt;
    palette.update(progress);
    follow.lerp(pointer, 1 - Math.exp(-dt * 1.2));
    // 环形排列负责技能切换；预览到全屏的取景由中转页统一控制。
    const distance = compact ? 7.6 / Math.max(0.4, camera.aspect) : 9.3;
    const velocity = targetProgress + scrollNudge - progress;
    sceneRoll = THREE.MathUtils.damp(
      sceneRoll,
      (THREE.MathUtils.clamp(-velocity * 15, -4, 4) * Math.PI) / 180,
      5,
      dt,
    );
    zoom = THREE.MathUtils.damp(
      zoom,
      Math.min(1, Math.abs(velocity) * 1.5) * 1.65,
      5,
      dt,
    );
    const mouseSpeed = (pointer.x - lastPointerX) / Math.max(dt * 60, 0.001);
    lastPointerX = pointer.x;
    steering = THREE.MathUtils.damp(
      steering,
      (THREE.MathUtils.clamp(mouseSpeed / 0.08, -0.5, 0.5) * Math.PI) / 9,
      1.2,
      dt,
    );
    roll = THREE.MathUtils.damp(roll, steering, 1.2, dt);
    camera.position.set(
      follow.x * 1.65,
      -follow.y * 0.825,
      distance - follow.y * 1.03 + zoom,
    );
    camera.lookAt(0, compact && !reading ? -0.25 : 0, 0);
    camera.rotateZ(roll + sceneRoll);
    // 预览把主卡取景到右下，展开时连续归位，水面仍覆盖整个画幅。
    const framing = 1 - presentation.expansion;
    camera.position.z += 3.2 * framing;
    if (viewExpansion !== presentation.expansion) {
      viewExpansion = presentation.expansion;
      camera.setViewOffset(
        width,
        height,
        -width * (compact ? 0.08 : 0.22) * framing,
        -height * 0.17 * framing,
        width,
        height,
      );
    }
    camera.updateMatrixWorld();
    // 布局在展开前准备好，方块沿同一转场直接移向左侧，保持原始尺寸。
    const viewHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const viewWidth = viewHeight * camera.aspect;
    const placement = reading ? presentation.expansion : 0;
    artwork.position.set(layout.x * viewWidth * placement, layout.y * viewHeight * placement, 0);
    artwork.updateMatrixWorld();
    artworkInverse.copy(artwork.matrixWorld).invert();
    projector.position.set(
      camera.position.x * 0.175,
      (compact && !reading ? 0.8 : 0) + camera.position.y * 0.175,
      6.25,
    );
    light.value.copy(projector.position).applyMatrix4(artwork.matrixWorld);
    projector.lookAt(0, compact && !reading ? 0.8 : 0, -13.5);
    projector.updateMatrixWorld();
    projection.value.multiplyMatrices(
      projector.projectionMatrix,
      projector.matrixWorldInverse,
    ).multiply(artworkInverse);
    // 保持参考站约 30° 的换屏弧度，在视野外复用卡片，避免内容数量影响转动幅度。
    const spacing = Math.PI / 6;
    const radius = 7.7 / (2 * Math.tan(spacing / 2));
    const active = modulo(Math.round(progress), skills.length);
    if (active !== lastReveal) {
      screens.forEach((screen, index) => {
        const uniform = screen.material.uniforms.uReveal;
        gsap.killTweensOf(uniform);
        gsap.to(uniform, {
          value: index === active ? 1 : 0,
          duration: index === active ? 4 : 1.6,
          delay: index === active ? 0.2 : 0,
          ease: "power4.out",
        });
      });
      lastReveal = active;
    }
    screens.forEach((screen, index) => {
      const delta =
        modulo(index - progress + skills.length / 2, skills.length) -
        skills.length / 2;
      const theta = delta * spacing;
      const visible = Math.abs(delta) < 1.6;
      screen.group.visible = visible;
      if (!visible) return;
      screen.group.position.set(
        Math.sin(theta) * radius,
        compact && !reading ? 0.8 : 0,
        (Math.cos(theta) - 1) * radius,
      );
      screen.group.rotation.y = theta;
      const opacity = 1 - smooth((Math.abs(delta) - 0.5) / 1.05);
      screen.material.uniforms.uOpacity.value = opacity;
    });
    updatePointerFields(dt);
    environment.update();
    renderer.render(scene, camera);
    pointerLight.render();
  }

  function scrollToSkill(target: number) {
    navigation?.kill();
    destination = target;
    onSelect(modulo(Math.round(target), skills.length));
    const current = targetProgress;
    // 反向时可见屏幕还落在旧目标之后。把驱动位置接回画面所在处，消除继续前冲的余量；
    // progress 本身不跳变，镜头倾斜和拉远仍沿原有阻尼自然收回。
    const reversing =
      (destination - progress) * (current + scrollNudge - progress) < 0;
    const position = { value: reversing ? progress : current };
    if (reversing) {
      scrollNudge = 0;
      targetProgress = progress;
    }
    // 独立的 1.6s / expo.out 目标；不再移动主页面，也不受章节出场判定干扰。
    navigation = gsap.to(position, {
      value: destination,
      duration: 1.6,
      ease: "expo.out",
      onUpdate: () => {
        targetProgress = position.value;
      },
    });
  }
  function navigate(direction: number) {
    scrollToSkill(
      Math.round(navigation?.isActive() ? destination : targetProgress) +
        direction,
    );
  }
  const controls = bindSkillControls({
    stage,
    allowVerticalScroll: () => root.dataset.reading === "true" && mobileReading.matches,
    movePointer(x, y, active) {
      if (active && presentation.interactive) pointerInput.move(x, y);
      else pointerInput.clear();
    },
    stop: () => {
      navigation?.kill();
      scrollNudge = wheelUntil = wheelDirection = wheelSum = 0;
      targetProgress = progress;
    },
    dragBy(steps) {
      targetProgress += steps;
    },
    settle(velocity) {
      const current = targetProgress;
      const target = Math.round(
        current + THREE.MathUtils.clamp(velocity * 0.14, -0.25, 0.25),
      );
      scrollToSkill(target);
    },
  });
  function wheel(event: WheelEvent) {
    if (stage.inert || document.querySelector("dialog[open]")) return;
    if (root.dataset.reading === "true" && mobileReading.matches) return;
    const delta =
      (Math.abs(event.deltaY) > Math.abs(event.deltaX)
        ? event.deltaY
        : event.deltaX) *
      (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1);
    if (!delta) return;
    event.preventDefault();
    event.stopPropagation();
    const now = performance.now(),
      direction = Math.sign(delta);
    // 间隔只抑制同向滚轮尾流；用户换方向时立即放行，不必等上一屏归位。
    if (now < wheelUntil && direction === wheelDirection) return;
    if (now - wheelAt > 150 || Math.sign(wheelSum) !== direction) wheelSum = 0;
    wheelAt = now;
    wheelSum += delta;
    if (Math.abs(wheelSum) > 15) {
      navigate(direction);
      scrollNudge = THREE.MathUtils.clamp(
        scrollNudge + wheelSum / 1000,
        -0.3,
        0.3,
      );
      wheelDirection = direction;
      wheelSum = 0;
      wheelUntil = now + 800;
    }
  }
  const key = (event: KeyboardEvent) => {
    if (
      stage.inert ||
      !stage.contains(event.target as Node) ||
      document.querySelector("dialog[open]") ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      navigate(event.key === "ArrowRight" ? 1 : -1);
    }
  };
  const selectSkill = (index: number) => {
    // 循环后仍选取离当前画面最近的一轮，不跳回页面最初的位置。
    const cycle = Math.round((progress - index) / skills.length);
    scrollToSkill(index + cycle * skills.length);
    wheelUntil = wheelDirection = wheelSum = scrollNudge = 0;
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resizeObserver.observe(stage);
  root.addEventListener("scroll", invalidateLayout, { passive: true });
  const visibility = new IntersectionObserver(entries => {
    inViewport = entries[entries.length - 1].isIntersecting;
  });
  visibility.observe(canvas);
  stage.addEventListener("wheel", wheel, { passive: false });
  window.addEventListener("keydown", key);
  resize();
  gsap.ticker.add(tick);
  return {
    select: selectSkill,
    dispose() {
      disposed = true;
      gsap.ticker.remove(tick);
      resizeObserver.disconnect();
      root.removeEventListener("scroll", invalidateLayout);
      visibility.disconnect();
      controls.dispose();
      pointerInput.dispose();
      navigation?.kill();
      stage.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
      screens.forEach((screen) => {
        gsap.killTweensOf(screen.material.uniforms.uReveal);
        screen.dispose();
      });
      surfaceField.dispose();
      shared.geometry.dispose();
      textures.forEach((texture) => texture.dispose());
      environment.dispose();
      pointerLight.dispose();
      moteGeometry.dispose();
      moteMaterial.dispose();
      scene.clear();
      renderer.dispose();
      stage.inert = false;
    },
  };
}
