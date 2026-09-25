import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createContactGhost } from "./createContactGhost";
import { createContactBlackHole } from "./contactBlackHole";

const smooth = (value: number) => {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
};
const vertex = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragment = /* glsl */`
  varying vec2 vUv;
  uniform sampler2D uMap;
  void main() {
    vec4 ink = texture2D(uMap, vUv);
    if (ink.a < .005) discard;
    gl_FragColor = ink;
    #include <colorspace_fragment>
  }
`;

export function createContactScene(root: HTMLElement, stage: HTMLElement, canvas: HTMLCanvasElement) {
  gsap.registerPlugin(ScrollTrigger);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const scroll = { p: 0 };
  let width = 1, height = 1, mobile = false, active = false, disposed = false;
  let ready = false, lost = false, lastTime = 0, clock = 0;
  let renderer: THREE.WebGLRenderer | undefined;
  let ghost: ReturnType<typeof createContactGhost> | undefined;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 100);
  camera.position.z = 10;
  const geometry = new THREE.PlaneGeometry(1, 1);
  const blackHole = createContactBlackHole();
  const sky = new THREE.Mesh(geometry, blackHole.material);
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  scene.add(sky);
  const textures: THREE.Texture[] = [];
  const materials: THREE.ShaderMaterial[] = [];
  const mountains: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];

  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
    renderer.setClearColor(0x060709, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.debug.onShaderError = () => { lost = true; delete stage.dataset.art; };
    ghost = createContactGhost(renderer, stage);
  } catch { /* The two cutouts and a static lens remain visible without WebGL. */ }

  if (renderer) {
    const loader = new THREE.TextureLoader();
    Promise.all(["lunar-left", "lunar-right"].map(name =>
      loader.loadAsync(`/contact-signal/${name}.webp`).then(texture => {
        if (disposed) { texture.dispose(); return texture; }
        texture.colorSpace = THREE.SRGBColorSpace;
        textures.push(texture);
        return texture;
      }),
    )).then(maps => {
      if (disposed) return;
      maps.forEach((texture, index) => {
        const material = new THREE.ShaderMaterial({
          uniforms: { uMap: { value: texture } }, vertexShader: vertex, fragmentShader: fragment,
          transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.renderOrder = index + 1;
        mesh.position.z = index + 1;
        mesh.frustumCulled = false;
        materials.push(material); mountains.push(mesh); scene.add(mesh);
      });
      ready = true;
      render(0);
      if (!lost) stage.dataset.art = "ready";
    }).catch(() => { delete stage.dataset.art; });
  }

  function render(dt: number) {
    const p = reduced.matches || stage.hasAttribute("data-collage-reveal") ? 0 : smooth(scroll.p);
    const settle = 1 - Math.exp(-dt * 5);
    pointer.x += (pointer.tx - pointer.x) * settle;
    pointer.y += (pointer.ty - pointer.y) * settle;
    if (!ready || !renderer || lost) return;

    blackHole.render(renderer, reduced.matches ? 0 : clock, pointer.x, pointer.y, p);

    // Each image contains one mountain on transparent pixels. Anchor the outer
    // and bottom edges beyond the viewport, so parallax cannot expose a seam.
    const coverWidth = Math.max(width, height * 16 / 9);
    mountains.forEach((mountain, i) => {
      const near = i === 1;
      const baseWidth = mobile ? width * (near ? 1.38 : 1.46) : coverWidth * 1.10;
      const w = baseWidth * (1 + p * (near ? .22 : .12));
      const h = w * 9 / 16;
      const travel = Math.min(near ? 44 : 25, width * .032);
      const x = near ? width * .55 - w / 2 + p * width * .025
        : -width * .545 + w / 2 - p * width * .018;
      mountain.scale.set(w, h, 1);
      mountain.position.x = x + pointer.x * travel;
      const bottom = mobile ? .54 : near ? .64 : .57;
      mountain.position.y = -height * bottom + h / 2 + pointer.y * travel * .55;
    });
    renderer.render(scene, camera);
    ghost?.render();
  }

  function resize() {
    width = Math.max(1, stage.clientWidth); height = Math.max(1, stage.clientHeight);
    mobile = width < 800 || width <= height;
    if (reduced.matches) pointer.x = pointer.y = pointer.tx = pointer.ty = 0;
    camera.left = -width / 2; camera.right = width / 2;
    camera.top = height / 2; camera.bottom = -height / 2; camera.updateProjectionMatrix();
    sky.scale.set(width, height, 1);
    blackHole.resize(width, height, mobile);
    renderer?.setSize(width, height, false);
    ghost?.resize(); render(0);
  }
  function tick(time: number) {
    const dt = Math.min(.05, Math.max(0, time - lastTime)); lastTime = time;
    if (lost || (!active && !stage.classList.contains("chapter-held")) || document.hidden || reduced.matches) return;
    clock += dt;
    render(dt);
  }
  function move(event: PointerEvent) {
    if (reduced.matches || event.pointerType === "touch") { leave(); return; }
    const rect = stage.getBoundingClientRect();
    pointer.tx = Math.max(-1, Math.min(1, (event.clientX - rect.left) / width * 2 - 1));
    pointer.ty = Math.max(-1, Math.min(1, 1 - (event.clientY - rect.top) / height * 2));
  }
  const leave = () => { pointer.tx = 0; pointer.ty = 0; };
  const contextLost = (event: Event) => { event.preventDefault(); lost = true; delete stage.dataset.art; };
  const contextRestored = () => { lost = false; render(0); if (ready && !lost) stage.dataset.art = "ready"; };
  const tween = gsap.to(scroll, { p: 1, ease: "none", scrollTrigger: {
    trigger: root, start: "top top", end: "bottom bottom", scrub: .75, invalidateOnRefresh: true,
  } });
  const observer = new IntersectionObserver(entries => { active = entries[0].isIntersecting; }, { rootMargin: "100% 0px" });
  observer.observe(root);
  const sizeObserver = new ResizeObserver(resize); sizeObserver.observe(stage);
  stage.addEventListener("pointermove", move); stage.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  canvas.addEventListener("webglcontextlost", contextLost); canvas.addEventListener("webglcontextrestored", contextRestored);
  reduced.addEventListener("change", resize); gsap.ticker.add(tick); resize();

  return () => {
    disposed = true;
    tween.scrollTrigger?.kill(); tween.kill(); gsap.ticker.remove(tick);
    observer.disconnect(); sizeObserver.disconnect(); reduced.removeEventListener("change", resize);
    stage.removeEventListener("pointermove", move); stage.removeEventListener("pointerleave", leave);
    window.removeEventListener("blur", leave);
    canvas.removeEventListener("webglcontextlost", contextLost); canvas.removeEventListener("webglcontextrestored", contextRestored);
    textures.forEach(texture => texture.dispose()); materials.forEach(material => material.dispose());
    ghost?.dispose(); geometry.dispose(); blackHole.dispose(); renderer?.dispose();
    delete stage.dataset.art;
  };
}
