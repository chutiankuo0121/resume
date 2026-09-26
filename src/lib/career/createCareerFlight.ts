import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { assetUrl } from "../assetUrl";
import { loadBuffer } from "../assets";
import { createCameraRig } from "../camera";
import { particleFragment } from "../shaders/particleKernel";
import { advanceFlight, flightTarget } from "./flight";
import { flightPointVertex } from "./flightShaders";
import { createCareerParticleGeometry } from "./particles";

/** Half of the opening crystal's ambient particles, carried through a single
 * continuous space by scroll. Artwork and readable text stay in the DOM. */
export function createCareerFlight(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>(".career-stage")!;
  const canvas = stage.querySelector<HTMLCanvasElement>(".career-dust")!;
  const main = root.closest<HTMLElement>(".astra");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, .1, 40);
  const cameraRig = createCameraRig(camera);
  const pointer = new THREE.Vector2();
  const point = new THREE.Vector3();
  // No opaque model in this scene. Empty coverage makes the shared kernel's
  // model-occlusion lookup fully visible without a second render pass.
  const emptyCoverage = new THREE.DataTexture(new Uint8Array([255, 255, 255, 0]), 1, 1);
  emptyCoverage.needsUpdate = true;
  const uniforms = {
    uTime: { value: 0 }, uPixelRatio: { value: 1 },
    uViewportScale: { value: 1 }, uMotionDepthOffset: { value: 11.125 / 2 },
    uEntry: { value: 1 }, uModelDepth: { value: emptyCoverage },
    uModelCoverage: { value: emptyCoverage }, uDepthSize: { value: new THREE.Vector2(1, 1) },
    uCameraClip: { value: new THREE.Vector2(camera.near, camera.far) },
    uTravel: { value: 0 }, uFlightOrigin: { value: new THREE.Vector3() },
    uFlightAxis: { value: new THREE.Vector3() }, uFlightBounds: { value: new THREE.Vector2(-16, .75) },
  };
  const material = new THREE.ShaderMaterial({
    name: "CareerCrystalAmbientHalf", uniforms,
    vertexShader: flightPointVertex, fragmentShader: particleFragment,
    transparent: true, depthTest: true, depthWrite: true, toneMapped: false,
  });
  let renderer: THREE.WebGLRenderer | undefined;
  let points: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | undefined;
  let visible = false, disposed = false, lost = false, dirty = true, suspended = true;
  let loading = false;
  let width = 1, height = 1, start = 0, end = 0;
  let position = 0, previousTime = gsap.ticker.time, restoreFrame = 0;

  function target() { return flightTarget(window.scrollY, start, end, height); }

  function measure() {
    if (disposed) return;
    width = Math.max(1, stage.clientWidth); height = Math.max(1, stage.clientHeight);
    // offsetTop is unaffected by the portal arrival / exit handoff transforms.
    start = 0;
    for (let node: HTMLElement | null = root; node; node = node.offsetParent as HTMLElement | null) start += node.offsetTop;
    end = start + root.offsetHeight - height;
    const mobile = width < 700;
    camera.aspect = width / height;
    camera.setViewOffset(width, height, -width * (mobile ? .045 : .12), 0, width, height);
    camera.updateProjectionMatrix();
    const framingDepth = cameraRig.update(1, mobile, pointer, 0, 0);
    uniforms.uMotionDepthOffset.value = 11.125 / 2 + framingDepth;
    uniforms.uFlightOrigin.value.copy(camera.position);
    uniforms.uFlightAxis.value.set(0, 0, 1).applyQuaternion(camera.quaternion);
    uniforms.uViewportScale.value = mobile ? .6 : 1;
    if (points) {
      const positions = points.geometry.getAttribute("position");
      const indices = points.geometry.index!;
      let farthest = -1;
      for (let i = 0; i < indices.count; i++) {
        point.fromBufferAttribute(positions, indices.getX(i)).sub(camera.position);
        farthest = Math.min(farthest, point.dot(uniforms.uFlightAxis.value));
      }
      uniforms.uFlightBounds.value.set(farthest - 1.2, .75);
    }
    renderer?.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer?.setSize(width, height, false);
    uniforms.uPixelRatio.value = renderer?.getPixelRatio() ?? 1;
    position = target();
    uniforms.uTravel.value = reduced.matches ? 0 : position;
    dirty = true;
  }

  function paint() {
    if (!renderer || !points || disposed || lost) return;
    renderer.render(scene, camera);
    if (!lost) stage.dataset.particles = "ready";
    dirty = false;
  }

  function loadParticles() {
    if (loading || points || disposed) return;
    loading = true;
    void loadBuffer(assetUrl("/crystal/particles.bin")).then(data => {
      if (disposed) return;
      points = new THREE.Points(createCareerParticleGeometry(data), material);
      points.frustumCulled = false;
      scene.add(points);
      measure();
      if (visible && !document.hidden) paint();
    }).catch(() => {
      delete stage.dataset.particles;
    }).finally(() => { loading = false; });
  }

  function startRenderer() {
    if (disposed || lost) return;
    try {
      if (!renderer) {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: "low-power" });
        renderer.setClearColor(0, 0);
        renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.debug.onShaderError = () => { lost = true; delete stage.dataset.particles; };
        measure();
      }
      loadParticles();
    } catch {
      lost = true;
      delete stage.dataset.particles;
    }
  }

  function tick(now: number) {
    const dt = Math.max(0, Math.min(.05, now - previousTime)); previousTime = now;
    if (disposed || lost || !renderer || !points) return;
    if (!visible || document.hidden || main?.dataset.exploring === "true") {
      suspended = true;
      return;
    }
    if (reduced.matches) {
      uniforms.uTravel.value = 0;
      if (dirty) paint();
      suspended = true;
      return;
    }
    const next = advanceFlight(position, target(), dt, suspended);
    suspended = false;
    position = next.position;
    uniforms.uTravel.value = position;
    // The original slow clustered drift continues when scrolling stops.
    // Accumulate active time only, avoiding a noise-field jump after tab restore.
    uniforms.uTime.value += dt;
    paint();
  }

  function onLost(event: Event) { event.preventDefault(); lost = true; delete stage.dataset.particles; }
  function onRestored() {
    cancelAnimationFrame(restoreFrame);
    restoreFrame = requestAnimationFrame(() => {
      if (disposed) return;
      lost = false; measure(); paint(); suspended = true;
    });
  }
  function onMotionChange() { measure(); if (visible) paint(); suspended = true; }
  const visibility = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { startRenderer(); dirty = true; suspended = true; }
  }, { rootMargin: "100% 0px" });
  visibility.observe(root);
  const resize = new ResizeObserver(measure);
  resize.observe(stage); resize.observe(root);
  ScrollTrigger.addEventListener("refresh", measure);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  reduced.addEventListener("change", onMotionChange);
  gsap.ticker.add(tick);
  measure();
  return () => {
    disposed = true;
    cancelAnimationFrame(restoreFrame);
    gsap.ticker.remove(tick); visibility.disconnect(); resize.disconnect();
    ScrollTrigger.removeEventListener("refresh", measure);
    reduced.removeEventListener("change", onMotionChange);
    canvas.removeEventListener("webglcontextlost", onLost);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    points?.geometry.dispose(); material.dispose(); emptyCoverage.dispose();
    renderer?.dispose();
    delete stage.dataset.particles;
  };
}
