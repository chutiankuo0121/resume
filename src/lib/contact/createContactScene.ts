import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createContactGhost } from "./createContactGhost";
import { createContactCrystal } from "./createContactCrystal";

const smooth = (a: number, b: number, value: number) => {
  const x = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

// Each paper cutout is a subdivided surface: the scroll bends its mesh as well
// as moving it through the composition. UVs stay attached to the painted paper.
const vertex = /* glsl */`
  varying vec2 vUv;
  uniform float uTime, uBend;
  uniform vec2 uPointer;
  void main() {
    vUv = uv;
    vec3 p = position;
    float fold = sin(uv.y * 4.7 + uTime * .22);
    p.x += fold * uBend * (.25 + uv.y) + uPointer.x * sin(uv.y * 3.14159) * .012;
    p.y += sin(uv.x * 5.2 + uTime * .18) * uBend * .38;
    p.z += sin(uv.x * 3.14159) * uBend * .9;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const fragment = /* glsl */`
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform float uTime, uKind, uCut;
  void main() {
    vec2 uv = vUv;
    if (uKind < .5) {
      float water = 1.0 - smoothstep(.24, .45, uv.y);
      uv.x += sin(uv.y * 155.0 + uTime * .65) * .0017 * water;
      uv.y += sin(uv.x * 72.0 - uTime * .48) * .001 * water;
    }
    vec4 ink = texture2D(uMap, uv);
    if (uCut > .5 && uCut < 1.5) ink.a *= 1.0 - smoothstep(.49, .51, uv.x);
    if (uCut > 1.5) ink.a *= smoothstep(.49, .51, uv.x);
    if (ink.a < .005) discard;
    gl_FragColor = ink;
    #include <colorspace_fragment>
  }
`;

export function createContactScene(root: HTMLElement, stage: HTMLElement, canvas: HTMLCanvasElement) {
  gsap.registerPlugin(ScrollTrigger);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const copies = Array.from(stage.querySelectorAll<HTMLElement>("[data-signal-copy]"));
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const scroll = { p: 0 };
  let width = 1, height = 1, mobile = false, active = false, disposed = false;
  let ready = false, lost = false, lastTime = 0, clock = 0;
  let previousCopyProgress = -1;
  let renderer: THREE.WebGLRenderer | undefined;
  let ghost: ReturnType<typeof createContactGhost> | undefined;
  let crystal: ReturnType<typeof createContactCrystal> | undefined;
  const scene = new THREE.Scene();
  // The rotated planes are measured in screen pixels; allow enough depth for
  // their edges to tilt toward the camera without hitting its near plane.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 5000);
  camera.position.z = 2000;
  const geometry = new THREE.PlaneGeometry(1, 1, 48, 28);
  const textures: THREE.Texture[] = [];
  const materials: THREE.ShaderMaterial[] = [];
  const layers: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];

  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
    renderer.setClearColor(0x101c28, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.debug.onShaderError = () => { lost = true; delete stage.dataset.art; };
    ghost = createContactGhost(renderer, stage);
    crystal = createContactCrystal(renderer);
    scene.add(crystal.mesh);
  } catch { /* The landscape remains visible without WebGL. */ }

  function layer(texture: THREE.Texture, kind: number, cut: number, z: number) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture }, uTime: { value: 0 }, uBend: { value: 0 },
        uKind: { value: kind }, uCut: { value: cut },
        uPointer: { value: new THREE.Vector2() },
      }, vertexShader: vertex, fragmentShader: fragment,
      transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = z;
    mesh.renderOrder = z;
    mesh.frustumCulled = false;
    materials.push(material);
    layers.push(mesh);
    scene.add(mesh);
    return mesh;
  }

  // Sparse ambient glints drift between the painted layers.
  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(150 * 3);
  const seeds = new Float32Array(150);
  for (let i = 0; i < seeds.length; i++) {
    const noise = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
    dustPositions[i * 3] = noise(i + 1);
    dustPositions[i * 3 + 1] = noise(i + 180);
    seeds[i] = noise(i + 370);
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  const dustMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSize: { value: new THREE.Vector2() }, uDpr: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aSeed;
      uniform float uTime, uDpr;
      uniform vec2 uSize;
      varying float vAlpha;
      void main() {
        vec2 p = (position.xy - .5) * uSize;
        p.x += sin(uTime * .13 + aSeed * 30.0) * 12.0;
        p.y += sin(uTime * .18 + aSeed * 40.0) * 18.0;
        float twinkle = pow(.5 + .5 * sin(uTime * .9 + aSeed * 80.0), 8.0);
        vAlpha = .08 + .5 * twinkle;
        gl_PointSize = (1.1 + twinkle * 2.5) * uDpr;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 5.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - .5);
        float a = (1.0 - smoothstep(.05, .5, d)) * vAlpha;
        gl_FragColor = vec4(.92, .87, .74, a);
      }
    `, transparent: true, depthTest: false, depthWrite: false,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.renderOrder = 5; dust.frustumCulled = false; scene.add(dust);

  if (renderer && crystal) {
    const loader = new THREE.TextureLoader();
    const landscapes = Promise.all(["landscape", "foreground"].map(name =>
      loader.loadAsync(`/contact-signal/${name}.webp`).then(texture => {
        if (disposed) { texture.dispose(); return texture; }
        texture.colorSpace = THREE.SRGBColorSpace;
        textures.push(texture);
        return texture;
      }),
    ));
    Promise.all([landscapes, crystal.ready]).then(([[background, foreground]]) => {
      if (disposed) return;
      layer(background, 0, 0, 0);
      layer(foreground, 2, 1, 3);
      layer(foreground, 2, 2, 4);
      ready = true;
      render(0);
      if (!lost) stage.dataset.art = "ready";
    }).catch(() => { delete stage.dataset.art; });
  }

  function updateCopy(p: number) {
    if (Math.abs(previousCopyProgress - p) < .00001) return;
    previousCopyProgress = p;
    const alpha = [1 - smooth(.18, .3, p), smooth(.28, .4, p) * (1 - smooth(.57, .7, p)), smooth(.68, .81, p)];
    stage.style.setProperty("--signal-p", p.toFixed(4));
    copies.forEach((copy, i) => {
      const opacity = reduced.matches ? (i === 2 ? 1 : 0) : alpha[i];
      copy.style.opacity = opacity.toFixed(4);
      copy.style.visibility = opacity > .005 ? "visible" : "hidden";
      copy.inert = opacity < .55;
      copy.setAttribute("aria-hidden", String(opacity < .55));
      const outgoing = (i === 0 && p > .18) || (i === 1 && p > .57);
      const y = reduced.matches ? 0 : (1 - opacity) * (outgoing ? -48 : 58);
      copy.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
      copy.querySelectorAll<HTMLElement>("h2 span, h3 span").forEach((line, j) => {
        line.style.transform = `translate3d(${(1 - opacity) * (i === 1 ? -1 : 1) * (12 + j * 14)}px, 0, 0)`;
      });
    });
  }

  function render(dt: number) {
    const p = reduced.matches ? 1 : stage.hasAttribute("data-collage-reveal") ? 0 : scroll.p;
    updateCopy(p);
    const settle = 1 - Math.exp(-dt * 5);
    pointer.x += (pointer.tx - pointer.x) * settle;
    pointer.y += (pointer.ty - pointer.y) * settle;
    const approach = smooth(.13, .42, p);
    const depart = smooth(.56, .82, p);
    const middle = approach * (1 - depart);
    const cx = mobile ? width * (.64 - middle * .14) : width * (.73 - .46 * middle + .015 * depart);
    const cy = mobile ? height * .68 : height * (.47 + .025 * middle);
    if (!ready || !renderer || lost) return;
    const t = reduced.matches ? 0 : clock;
    const [background, left, right] = layers;
    const coverHeight = Math.max(height, width / (1672 / 941));
    const coverWidth = coverHeight * (1672 / 941);
    const zoom = 1.08 + .12 * approach - .045 * depart;
    background.scale.set(coverWidth * zoom, coverHeight * zoom, 1);
    background.position.x = pointer.x * 7 - middle * width * .025;
    background.position.y = -height * .025 * approach + pointer.y * 5;
    const crystalHeight = mobile ? height * (.52 + .04 * middle)
      : Math.min(height * (.8 + .1 * middle - .03 * depart), width * .64);
    crystal?.render(dt, t, cx + pointer.x * 18, cy - pointer.y * 12, crystalHeight,
      pointer.tx, -pointer.ty, reduced.matches);
    for (const [i, rock] of [left, right].entries()) {
      rock.scale.set(coverWidth * (1.1 + middle * .06), coverHeight * (1.08 + middle * .04), 1);
      rock.position.x = (i ? 1 : -1) * width * .16 * middle + pointer.x * (i ? 26 : 36);
      rock.position.y = -height * (.08 * approach + .015 * depart) + pointer.y * 25;
      rock.rotation.z = (i ? 1 : -1) * .055 * middle;
    }
    materials.forEach(material => {
      const kind = material.uniforms.uKind.value;
      material.uniforms.uTime.value = t;
      material.uniforms.uBend.value = reduced.matches ? 0
        : (kind === 0 ? .004 : .012 + middle * .026);
      material.uniforms.uPointer.value.set(pointer.x, pointer.y);
    });
    dustMaterial.uniforms.uTime.value = t;
    renderer.render(scene, camera);
    ghost?.render();
  }

  function resize() {
    previousCopyProgress = -1;
    width = stage.clientWidth; height = stage.clientHeight; mobile = width < 800;
    camera.left = -width / 2; camera.right = width / 2;
    camera.top = height / 2; camera.bottom = -height / 2; camera.updateProjectionMatrix();
    renderer?.setSize(width, height, false);
    ghost?.resize();
    crystal?.resize(width, height);
    dustMaterial.uniforms.uSize.value.set(width, height);
    dustMaterial.uniforms.uDpr.value = Math.min(devicePixelRatio, 1.5);
    render(0);
  }
  function tick(time: number) {
    const dt = Math.min(.05, Math.max(0, time - lastTime)); lastTime = time;
    if ((!active && !stage.classList.contains("chapter-held")) || document.hidden) return;
    if (!reduced.matches) clock += dt;
    render(dt);
  }
  function move(event: PointerEvent) {
    if (reduced.matches || event.pointerType === "touch") { leave(); return; }
    const rect = stage.getBoundingClientRect();
    pointer.tx = (event.clientX - rect.left) / width * 2 - 1;
    pointer.ty = 1 - (event.clientY - rect.top) / height * 2;
  }
  const leave = () => { pointer.tx = 0; pointer.ty = 0; };
  const contextLost = (event: Event) => { event.preventDefault(); lost = true; delete stage.dataset.art; };
  const contextRestored = () => { lost = false; if (ready) stage.dataset.art = "ready"; render(0); };
  const tween = gsap.to(scroll, { p: 1, ease: "none", scrollTrigger: {
    trigger: root, start: "top top", end: "bottom bottom", scrub: .75,
    invalidateOnRefresh: true,
  } });
  const observer = new IntersectionObserver(entries => { active = entries[0].isIntersecting; }, { rootMargin: "100% 0px" });
  observer.observe(root);
  const sizeObserver = new ResizeObserver(resize); sizeObserver.observe(stage);
  stage.addEventListener("pointermove", move); stage.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  canvas.addEventListener("webglcontextlost", contextLost); canvas.addEventListener("webglcontextrestored", contextRestored);
  reduced.addEventListener("change", resize);
  gsap.ticker.add(tick);
  resize();

  return () => {
    disposed = true;
    tween.scrollTrigger?.kill(); tween.kill(); gsap.ticker.remove(tick);
    observer.disconnect(); sizeObserver.disconnect(); reduced.removeEventListener("change", resize);
    stage.removeEventListener("pointermove", move); stage.removeEventListener("pointerleave", leave);
    window.removeEventListener("blur", leave);
    canvas.removeEventListener("webglcontextlost", contextLost); canvas.removeEventListener("webglcontextrestored", contextRestored);
    textures.forEach(texture => texture.dispose()); materials.forEach(material => material.dispose());
    ghost?.dispose(); crystal?.dispose();
    geometry.dispose(); dustGeometry.dispose(); dustMaterial.dispose(); renderer?.dispose();
    delete stage.dataset.art;
  };
}
