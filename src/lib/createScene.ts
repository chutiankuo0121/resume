import * as THREE from "three";
import {
  fullscreenVertex,
  blurFragment,
  compositeFragment,
} from "./shaders/composite";
import { particleVertex, particleFragment } from "./shaders/particles";
import { createBlackHole } from "./createBlackHole";
import { transitionFragment } from "./shaders/blackHole";
import type { FrameClock, TransitionState } from "./transition";
import { createCameraRig } from "./camera";
import { elimarPaperReveal } from "./elimarExit";
import { createPointerMotion, holeFollowScale } from "./pointer";
import { createCrystal } from "./createCrystal";
import { paperFragment, portalCompositeFragment } from "./shaders/elimarExit";
import type { LoadingState, LoadingTask } from "./loading/progress";
import { createPreludeDrawing } from "./loading/drawPrelude";
import { createPortalArrival } from "./portalArrival";

type Options = {
  canvas: HTMLCanvasElement;
  transition: TransitionState;
  clock: FrameClock;
  loading: LoadingState;
  onProgress: (task: LoadingTask) => void;
  onReady: () => void;
  onError: (message: string) => void;
};

export function createScene({
  canvas,
  transition,
  clock,
  loading,
  onProgress,
  onReady,
  onError,
}: Options) {
  let disposed = false,
    ready = false;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
  } catch {
    onError("当前浏览器未能开启 WebGL 2。请开启硬件加速后重试。");
    return () => {};
  }
  // 合成使用显示域灰度。中间目标保留浮点高光，不做隐式 gamma 或色调映射。
  if (!renderer.extensions.has("EXT_color_buffer_float")) {
    renderer.dispose();
    onError("当前设备不支持浮点渲染目标，请使用支持 WebGL 2 的浏览器和显卡。");
    return () => {};
  }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.autoClear = false;
  const materials = new Set<THREE.Material>();
  function material<T extends THREE.Material>(m: T) {
    materials.add(m);
    return m;
  }
  const lightScene = new THREE.Scene(),
    pointScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 40);
  const cameraRig = createCameraRig(camera);
  const postCamera = new THREE.Camera();
  const postScene = new THREE.Scene();
  const makeTarget = () =>
    new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
    });
  const lighting = makeTarget(),
    blurX = makeTarget(),
    soft = makeTarget(),
    sharp = makeTarget(),
    crystalTarget = makeTarget(),
    portalFrame = makeTarget(),
    portalEmission = makeTarget();
  const targets = [lighting, blurX, soft, sharp, crystalTarget, portalFrame, portalEmission];
  let prelude: ReturnType<typeof createPreludeDrawing> | undefined = createPreludeDrawing(renderer, sharp.texture);
  // 未模糊明暗层同时保存深度，粒子复用它遮挡背面，无需额外绘制网格。
  lighting.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
  lighting.depthTexture.minFilter = THREE.NearestFilter;
  lighting.depthTexture.magFilter = THREE.NearestFilter;
  const hole = createBlackHole(renderer);
  const holeCenter = new THREE.Vector2(0.5, 0.505);
  const followScale = new THREE.Vector2();
  const portalPointerTarget = new THREE.Vector3(-2, -2, 0);
  const portalPointer = new THREE.Vector3(-2, -2, 0);
  const portalWake = Array.from({ length: 6 }, () => new THREE.Vector3(-2, -2, 0));
  const portalArrival = createPortalArrival(canvas);
  let portalFlow = 0, previousScroll = window.scrollY;
  const blur = material(
    new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: blurFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uInput: { value: lighting.texture },
        uStep: { value: new THREE.Vector2() },
      },
    }),
  );
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blur);
  postScene.add(quad);
  const composite = material(
    new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: compositeFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uSoft: { value: soft.texture },
        uSharp: { value: sharp.texture },
        uBoundary: { value: 0.49 },
        uAtmosphereMap: { value: cameraRig.atmosphereMap },
        uLightReveal: { value: 0 },
        uFormReveal: { value: 0 },
      },
    }),
  );
  const paper = material(
    new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: paperFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uScene: { value: crystalTarget.texture },
        ...portalArrival.uniforms,
        uGhostWake: { value: portalWake },
        uReveal: { value: 0 },
        uBlackout: { value: 0 },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uCenter: { value: new THREE.Vector2(.5, .5) },
        uPointer: { value: portalPointer },
        uViewport: { value: new THREE.Vector2(1, 1) },
        uFlow: { value: 0 },
      },
    }),
  );
  const exitComposite = material(new THREE.ShaderMaterial({
    vertexShader: fullscreenVertex,
    fragmentShader: compositeFragment,
    uniforms: composite.uniforms,
    defines: { ELIMAR_EXIT: 1 },
    depthTest: false,
    depthWrite: false,
  }));
  const portalGlow = material(new THREE.ShaderMaterial({
    vertexShader: fullscreenVertex,
    fragmentShader: paperFragment,
    uniforms: paper.uniforms,
    defines: { PORTAL_GLOW: 1 },
    depthTest: false,
    depthWrite: false,
  }));
  const portalComposite = material(new THREE.ShaderMaterial({
    vertexShader: fullscreenVertex,
    fragmentShader: portalCompositeFragment,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uFrame: { value: portalFrame.texture },
      uEmission: { value: portalEmission.texture },
      uBloom: { value: soft.texture },
    },
  }));
  const transitionMaterial = material(
    new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: transitionFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uCrystal: { value: crystalTarget.texture },
        uParticles: { value: hole.texture },
        uResolution: { value: new THREE.Vector2() },
        uTime: { value: 0 },
        uHoleCenter: { value: holeCenter },
        uHoleScale: { value: 1 },
        uHoleApproach: { value: 0 },
        uCrystalReveal: { value: 0 },
      },
    }),
  );
  const pointMaterial = material(
    new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      depthTest: true,
      depthWrite: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uViewportScale: { value: 1 },
        uMotionDepthOffset: { value: 11.125 / 2 },
        uEntry: { value: 0 },
        uModelDepth: { value: lighting.depthTexture },
        uModelCoverage: { value: lighting.texture },
        uDepthSize: { value: new THREE.Vector2(1, 1) },
        uCameraClip: { value: new THREE.Vector2(camera.near, camera.far) },
      },
    }),
  );
  const crystal = createCrystal({
    lightScene,
    pointScene,
    pointMaterial,
    onProgress,
  });
  const pointer = createPointerMotion();
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  let width = 1,
    height = 1,
    dpr = 1,
    time = 0;
  let lastTimestamp = 0;
  let whiteCleared = false;
  let loadingBackgroundReady = false;
  let shaderError = false;
  renderer.debug.onShaderError = (gl, program, vertexShader, fragmentShader) => {
    shaderError = true;
    console.error("着色器编译失败:", JSON.stringify({
      program: gl.getProgramInfoLog(program),
      vertex: gl.getShaderInfoLog(vertexShader),
      fragment: gl.getShaderInfoLog(fragmentShader),
    }));
    onError("画面着色器未能编译，请重新加载预览。");
  };

  function resize() {
    whiteCleared = false;
    loadingBackgroundReady = false;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    // 像素比封顶以控制填充开销，点的视觉尺寸仍按 CSS 像素计算。
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const mobile = width < 700;
    camera.setViewOffset(
      width,
      height,
      -width * (mobile ? 0.045 : 0.12),
      0,
      width,
      height,
    );
    camera.updateProjectionMatrix();
    lighting.setSize(
      Math.round(width * dpr * 0.5),
      Math.round(height * dpr * 0.5),
    );
    blurX.setSize(lighting.width, lighting.height);
    soft.setSize(lighting.width, lighting.height);
    pointMaterial.uniforms.uDepthSize.value.set(
      lighting.width,
      lighting.height,
    );
    sharp.setSize(Math.round(width * dpr), Math.round(height * dpr));
    prelude?.resize(width, height);
    crystalTarget.setSize(sharp.width, sharp.height);
    portalFrame.setSize(sharp.width, sharp.height);
    portalEmission.setSize(lighting.width, lighting.height);
    hole.resize(width, height, dpr);
    transitionMaterial.uniforms.uResolution.value.set(
      width * dpr,
      height * dpr,
    );
    paper.uniforms.uResolution.value.set(width * dpr, height * dpr);
    paper.uniforms.uViewport.value.set(width, height);
    followScale.set(...holeFollowScale(width, height));
    pointMaterial.uniforms.uPixelRatio.value = dpr;
    pointMaterial.uniforms.uViewportScale.value = mobile ? 0.6 : 1;
  }
  function move(e: PointerEvent) {
    if (loading.reveal < 1) return;
    // 触摸用于滚动，不残留鼠标悬停偏移。
    if (e.pointerType !== "touch") {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1,
        y = ((e.clientY - r.top) / r.height) * 2 - 1;
      pointer.set(x, y);
      crystal.setPointer(x, y);
      portalPointerTarget.set((x + 1) * .5, (1 - y) * .5, 1);
    } else {
      portalPointerTarget.z = 0;
    }
  }
  function leave() {
    portalPointerTarget.z = 0;
    pointer.set(0, 0);
    crystal.setPointer(0, 0);
  }
  function lost(e: Event) {
    e.preventDefault();
    ready = false;
    shaderError = true;
    onError("画面连接中断，点击重新加载恢复预览。");
  }
  function resetFrameTimestamp() {
    // 后台恢复时从当前相位继续，避免把离开页面的时间计为一次巨大步进。
    lastTimestamp = 0;
    portalWake.forEach(point => { point.z = 0; });
    previousScroll = window.scrollY;
    portalFlow = 0;
    portalPointerTarget.z = 0;
  }
  window.addEventListener("pointermove", move);
  window.addEventListener("blur", leave);
  document.documentElement.addEventListener("pointerleave", leave);
  canvas.addEventListener("webglcontextlost", lost);
  document.addEventListener("visibilitychange", resetFrameTimestamp);
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  async function load() {
    try {
      await crystal.ready;
      if (disposed) return;
      // 模型与粒子着色器先在 GPU 编译完成，100% 才真正代表首屏可以交接。
      await Promise.all([
        renderer.compileAsync(lightScene, camera),
        renderer.compileAsync(pointScene, camera),
      ]);
      if (disposed || shaderError) return;
      ready = true;
      // 首屏就实际绘制退出链到离屏目标，提前暴露 fragment/link 错误。
      renderPortal(sharp);
      drawLoading();
      if (!shaderError) onReady();
    } catch (error) {
      if (!disposed) {
        console.error(error);
        onError("晶石资源载入失败，请重新加载预览。");
      }
    }
  }
  void load();

  function drawLoading() {
    // 首页始终保持正式尺寸；加载遮罩通过 C 字窗口揭开，不再缩放黑洞。
    if (loading.reveal > 0 || (ready && !loadingBackgroundReady)) {
      holeCenter.set(0.5, 0.505);
      hole.render(time, pointer.hole, 1, 1, holeCenter);
      const uniforms = transitionMaterial.uniforms;
      uniforms.uTime.value = time;
      uniforms.uHoleScale.value = 1;
      uniforms.uHoleApproach.value = 0;
      uniforms.uCrystalReveal.value = 0;
      quad.material = transitionMaterial;
      renderer.setRenderTarget(sharp);
      renderer.setClearColor(0xf8f8f7, 1);
      renderer.clear();
      renderer.render(postScene, postCamera);
      loadingBackgroundReady = true;
    }
    prelude?.render(loading, motionPreference.matches);
  }

  function renderPortal(output: THREE.WebGLRenderTarget | null = null) {
    renderer.setClearColor(0, 0);
    quad.material = paper;
    renderer.setRenderTarget(portalFrame);
    renderer.clear();
    renderer.render(postScene, postCamera);
    quad.material = portalGlow;
    renderer.setRenderTarget(portalEmission);
    renderer.clear();
    renderer.render(postScene, postCamera);
    // 晶石已合成为一张图，复用原来的两个半分辨率目标做亮边 Bloom。
    quad.material = blur;
    blur.uniforms.uInput.value = portalEmission.texture;
    blur.uniforms.uStep.value.set(2.4 / portalEmission.width, 0);
    renderer.setRenderTarget(blurX);
    renderer.clear();
    renderer.render(postScene, postCamera);
    blur.uniforms.uInput.value = blurX.texture;
    blur.uniforms.uStep.value.set(0, 2.4 / portalEmission.height);
    renderer.setRenderTarget(soft);
    renderer.clear();
    renderer.render(postScene, postCamera);
    quad.material = portalComposite;
    renderer.setRenderTarget(output);
    renderer.clear();
    renderer.render(postScene, postCamera);
  }

  function draw() {
    // 完全揭幕后清空 alpha，交给下方真实经历页；回滚时重新绘制晶石。
    if (transition.portalReveal === 1) {
      if (!whiteCleared) {
        renderer.setRenderTarget(null);
        renderer.setClearColor(0, 0);
        renderer.clear();
        whiteCleared = true;
      }
      return;
    }
    whiteCleared = false;
    const mobile = width < 700;
    const entry = transition.crystalEntry;
    const framingDepth = cameraRig.update(
      transition.cameraTravel,
      mobile,
      pointer.crystal,
      transition.focus,
      transition.exit,
    );
    pointMaterial.uniforms.uMotionDepthOffset.value = 11.125 / 2 + framingDepth;
    pointMaterial.uniforms.uEntry.value = entry;
    const compact = THREE.MathUtils.clamp((1.6 - camera.aspect) / 0.6, 0, 1);
    composite.uniforms.uBoundary.value = mobile ? 0.29 : 0.49 - compact * 0.12;
    composite.uniforms.uLightReveal.value = transition.lightReveal;
    composite.uniforms.uFormReveal.value = THREE.MathUtils.smoothstep(
      entry,
      0.1,
      0.58,
    );
    if (transition.crystalReveal > 0) {
      // 1. 明暗与深度 → 2. 两次模糊 → 3. 清晰圆点 → 4. 灰度合成。
      renderer.setRenderTarget(lighting);
      renderer.setClearColor(0, 0);
      renderer.clear();
      renderer.render(lightScene, camera);
      quad.material = blur;
      blur.uniforms.uInput.value = lighting.texture;
      blur.uniforms.uStep.value.set(0.004, 0);
      renderer.setRenderTarget(blurX);
      renderer.clear();
      renderer.render(postScene, postCamera);
      blur.uniforms.uInput.value = blurX.texture;
      blur.uniforms.uStep.value.set(0, 0.004);
      renderer.setRenderTarget(soft);
      renderer.clear();
      renderer.render(postScene, postCamera);
      renderer.setRenderTarget(sharp);
      // 中性清屏灰对应合成公式中的 0.09084171，不能当普通黑底替换。
      renderer.setClearColor(0x555555, 1);
      renderer.clear();
      renderer.render(pointScene, camera);
      quad.material = transition.exit > 0 ? exitComposite : composite;
      renderer.setRenderTarget(crystalTarget);
      renderer.setClearColor(0, 1);
      renderer.clear();
      renderer.render(postScene, postCamera);
    }
    // 5. 推近洞口，而非降低透明度。按对角线覆盖，宽屏和竖屏都能完全入黑。
    // 缩放与透视距离成反比，越靠近洞口，边缘离开视野的速度越快。
    const targetScale =
      (8 * Math.hypot(width, height)) / Math.min(width, height);
    const holeScale =
      1 / THREE.MathUtils.lerp(1, 1 / targetScale, transition.holeApproach);
    holeCenter.set(
      0.5 + pointer.hole.x * followScale.x * transition.pointerWeight,
      0.505 - pointer.hole.y * followScale.y * transition.pointerWeight,
    );
    if (transition.holeApproach < 1)
      hole.render(
        time,
        pointer.hole,
        transition.pointerWeight,
        holeScale,
        holeCenter,
      );
    const uniforms = transitionMaterial.uniforms;
    uniforms.uTime.value = time;
    uniforms.uHoleScale.value = holeScale;
    uniforms.uHoleApproach.value = transition.holeApproach;
    uniforms.uCrystalReveal.value = transition.crystalReveal;
    paper.uniforms.uReveal.value = transition.portalReveal;
    paper.uniforms.uBlackout.value = elimarPaperReveal(transition.exit);
    paper.uniforms.uTime.value = time;
    if (transition.portalReveal > 0) {
      portalArrival.update();
      renderPortal();
      return;
    }
    quad.material = transition.exit > 0 ? paper : transitionMaterial;
    renderer.setRenderTarget(null);
    renderer.setClearColor(0, 1);
    renderer.clear();
    renderer.render(postScene, postCamera);
  }
  function animate(timestamp: number) {
    if (disposed || loading.failed) return;
    const elapsed = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0;
    lastTimestamp = timestamp;
    if (document.hidden) return;
    const dt = Math.min(elapsed, 0.05);
    const reduced = motionPreference.matches;
    // Same local response as the collage seam: exponential follow, gentle
    // pointer influence and a scroll-speed impulse which settles at rest.
    if (reduced) {
      portalPointer.z = 0;
      portalFlow = 0;
    } else {
      portalPointer.lerp(portalPointerTarget, 1 - Math.exp(-dt * 9));
      const activePortal = transition.portalReveal > 0 && transition.portalReveal < 1;
      const speed = activePortal && elapsed > 0
        ? Math.min(1, Math.abs(window.scrollY - previousScroll) / elapsed / 1400) : 0;
      portalFlow += (speed - portalFlow) * (1 - Math.exp(-dt * (speed > portalFlow ? 14 : 3)));
    }
    for (let i = portalWake.length - 1; i > 0; i--) {
      portalWake[i].lerp(portalWake[i - 1], reduced ? 1 : 1 - Math.exp(-dt * 12));
      if (reduced) portalWake[i].z = 0;
    }
    portalWake[0].copy(portalPointer);
    previousScroll = window.scrollY;
    paper.uniforms.uFlow.value = portalFlow;
    pointer.update(dt, reduced);
    crystal.update(dt, transition.crystalEntry, reduced, transition.focus);
    // 平滑输入限制单帧步长，粒子用真实秒数，避免低帧率改变运动速度。
    if (!reduced) time += elapsed;
    pointMaterial.uniforms.uTime.value = time;
    if (!shaderError) {
      if (loading.reveal < 1) {
        drawLoading();
      } else if (ready) {
        prelude?.dispose();
        prelude = undefined;
        draw();
      }
    }
  }
  const unsubscribe = clock.subscribe(animate);
  return () => {
    if (disposed) return;
    disposed = true;
    unsubscribe();
    observer.disconnect();
    hole.dispose();
    portalArrival.dispose();
    prelude?.dispose();
    crystal.dispose();
    window.removeEventListener("pointermove", move);
    window.removeEventListener("blur", leave);
    document.documentElement.removeEventListener("pointerleave", leave);
    canvas.removeEventListener("webglcontextlost", lost);
    document.removeEventListener("visibilitychange", resetFrameTimestamp);
    quad.geometry.dispose();
    materials.forEach((m) => m.dispose());
    targets.forEach((t) => t.dispose());
    // React 重挂载会复用 canvas；仅释放资源，不主动丢失其 WebGL 上下文。
    renderer.dispose();
  };
}
