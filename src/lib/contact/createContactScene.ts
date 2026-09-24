import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const smooth = (a: number, b: number, value: number) => {
  const x = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

// Each paper cutout is a subdivided surface: the scroll bends its mesh as well
// as moving it through the composition. UVs stay attached to the painted paper.
const vertex = /* glsl */`
  varying vec2 vUv;
  uniform float uTime, uBend, uKind;
  uniform vec2 uPointer;
  void main() {
    vUv = uv;
    vec3 p = position;
    if (uKind < .5 || uKind > 1.5) {
      float fold = sin(uv.y * 4.7 + uTime * .22);
      p.x += fold * uBend * (.25 + uv.y) + uPointer.x * sin(uv.y * 3.14159) * .012;
      p.y += sin(uv.x * 5.2 + uTime * .18) * uBend * .38;
      p.z += sin(uv.x * 3.14159) * uBend * .9;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const fragment = /* glsl */`
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform float uTime, uKind, uCut, uPulse, uHover, uOpacity, uPart;
  bool inBox(vec2 p, vec4 box) {
    return p.x >= box.x && p.y >= box.y && p.x <= box.z && p.y <= box.w;
  }
  void main() {
    vec2 uv = vUv;
    if (uKind < .5) {
      float water = 1.0 - smoothstep(.24, .45, uv.y);
      uv.x += sin(uv.y * 155.0 + uTime * .65) * .0017 * water;
      uv.y += sin(uv.x * 72.0 - uTime * .48) * .001 * water;
    }
    vec4 ink = texture2D(uMap, uv);
    if (uKind > .5 && uKind < 1.5) {
      // Transparent margins separate these five islands from the main crystal.
      // Sample the original texture directly, preserving every painted facet.
      vec2 pixel = vec2(vUv.x, 1.0 - vUv.y) * vec2(1672.0, 941.0);
      float part = 0.0;
      if (inBox(pixel, vec4(910.0, 232.0, 958.0, 278.0))) part = 1.0;
      if (inBox(pixel, vec4(852.0, 398.0, 919.0, 477.0))) part = 2.0;
      if (inBox(pixel, vec4(933.0, 483.0, 968.0, 513.0))) part = 3.0;
      if (inBox(pixel, vec4(933.0, 514.0, 968.0, 551.0))) part = 4.0;
      if (inBox(pixel, vec4(943.0, 629.0, 1005.0, 716.0))) part = 5.0;
      if (abs(part - uPart) > .1) discard;
    }
    ink.a *= uOpacity;
    if (uCut > .5 && uCut < 1.5) ink.a *= 1.0 - smoothstep(.49, .51, uv.x);
    if (uCut > 1.5) ink.a *= smoothstep(.49, .51, uv.x);
    if (ink.a < .005) discard;
    if (uKind > .5 && uKind < 1.5) {
      float facets = pow(max(0.0, sin(uv.x * 29.0 + uv.y * 12.0 - uTime * .55)), 18.0);
      ink.rgb += vec3(.20, .16, .09) * facets * (.06 + uHover * .25 + uPulse * .8);
    }
    gl_FragColor = ink;
    #include <colorspace_fragment>
  }
`;

export function createContactScene(root: HTMLElement, stage: HTMLElement, canvas: HTMLCanvasElement) {
  gsap.registerPlugin(ScrollTrigger);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const copies = Array.from(stage.querySelectorAll<HTMLElement>("[data-signal-copy]"));
  const touch = stage.querySelector<HTMLButtonElement>(".signal-touch")!;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, hover: 0, hoverTarget: 0 };
  const scroll = { p: 0 };
  let width = 1, height = 1, mobile = false, active = false, disposed = false;
  let ready = false, lost = false, lastTime = 0, clock = 0, burstAt = -100, previousAct = -1;
  let previousCopyProgress = -1;
  let renderer: THREE.WebGLRenderer | undefined;
  const scene = new THREE.Scene();
  // The rotated planes are measured in screen pixels; allow enough depth for
  // their edges to tilt toward the camera without hitting its near plane.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 5000);
  camera.position.z = 2000;
  const geometry = new THREE.PlaneGeometry(1, 1, 48, 28);
  const crystalGeometry = geometry.clone();
  crystalGeometry.translate(-.20, .04, 0);
  const textures: THREE.Texture[] = [];
  const materials: THREE.ShaderMaterial[] = [];
  const layers: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  const fragments: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];

  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
    renderer.setClearColor(0x101c28, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.debug.onShaderError = () => { lost = true; delete stage.dataset.art; };
  } catch { /* The complete painted fallback remains visible without WebGL. */ }

  function layer(texture: THREE.Texture, kind: number, cut: number, z: number, part = 0) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: texture }, uTime: { value: 0 }, uBend: { value: 0 },
        uKind: { value: kind }, uCut: { value: cut }, uPulse: { value: 0 },
        uHover: { value: 0 }, uPointer: { value: new THREE.Vector2() },
        uOpacity: { value: 1 },
        uPart: { value: part },
      }, vertexShader: vertex, fragmentShader: fragment,
      transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    });
    const mesh = new THREE.Mesh(kind === 1 ? crystalGeometry : geometry, material);
    mesh.position.z = z;
    mesh.renderOrder = z;
    mesh.frustumCulled = false;
    materials.push(material);
    (part > 0 ? fragments : layers).push(mesh);
    scene.add(mesh);
    return mesh;
  }

  // Deterministic dust, not a lightning outline. Sparse glints sit in the space
  // between the painted layers and spread outward when the crystal is touched.
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
    uniforms: { uTime: { value: 0 }, uSize: { value: new THREE.Vector2() }, uOrigin: { value: new THREE.Vector2() }, uBurst: { value: 0 }, uDpr: { value: 1 }, uOpacity: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aSeed;
      uniform float uTime, uBurst, uDpr;
      uniform vec2 uSize, uOrigin;
      varying float vAlpha;
      void main() {
        vec2 p = (position.xy - .5) * uSize;
        p.x += sin(uTime * .13 + aSeed * 30.0) * 12.0;
        p.y += sin(uTime * .18 + aSeed * 40.0) * 18.0;
        if (aSeed > .65 && uBurst > .001) {
          float angle = position.x * 6.283185;
          float radius = (1.0 - uBurst) * uSize.y * (.12 + position.y * .25);
          p = uOrigin + vec2(cos(angle), sin(angle)) * radius;
        }
        float twinkle = pow(.5 + .5 * sin(uTime * .9 + aSeed * 80.0), 8.0);
        vAlpha = .08 + .5 * twinkle + uBurst * .45;
        gl_PointSize = (1.1 + twinkle * 2.5 + uBurst * 2.0) * uDpr;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 5.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying float vAlpha;
      uniform float uOpacity;
      void main() {
        float d = length(gl_PointCoord - .5);
        float a = (1.0 - smoothstep(.05, .5, d)) * vAlpha;
        gl_FragColor = vec4(.92, .87, .74, a * uOpacity);
      }
    `, transparent: true, depthTest: false, depthWrite: false,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.renderOrder = 5; dust.frustumCulled = false; scene.add(dust);

  if (renderer) {
    const loader = new THREE.TextureLoader();
    Promise.all(["landscape", "crystal", "foreground"].map(name =>
      loader.loadAsync(`/contact-signal/${name}.webp`).then(texture => {
        if (disposed) { texture.dispose(); return texture; }
        texture.colorSpace = THREE.SRGBColorSpace;
        textures.push(texture);
        return texture;
      }),
    )).then(([background, crystal, foreground]) => {
      if (disposed) return;
      layer(background, 0, 0, 0);
      layer(crystal, 1, 0, 2);
      for (let part = 1; part <= 5; part++) layer(crystal, 1, 0, 2 + part * .01, part);
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
    const act = p < .31 ? 0 : p < .70 ? 1 : 2;
    if (act !== previousAct) { stage.dataset.act = String(act); previousAct = act; }
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
    pointer.hover += (pointer.hoverTarget - pointer.hover) * settle;
    const approach = smooth(.13, .42, p);
    const depart = smooth(.56, .82, p);
    const middle = approach * (1 - depart);
    const cx = mobile ? width * (.64 - middle * .14) : width * (.73 - .46 * middle + .015 * depart);
    const cy = mobile ? height * .68 : height * (.47 + .025 * middle);
    stage.style.setProperty("--signal-x", `${cx + pointer.x * 18}px`);
    stage.style.setProperty("--signal-y", `${cy - pointer.y * 12}px`);
    if (!ready || !renderer || lost) return;
    const t = reduced.matches ? 0 : clock;
    const pulse = reduced.matches ? 0 : Math.max(0, 1 - (clock - burstAt) / 2.2);
    const [background, crystal, left, right] = layers;
    const coverHeight = Math.max(height, width / (1672 / 941));
    const coverWidth = coverHeight * (1672 / 941);
    const zoom = 1.08 + .12 * approach - .045 * depart;
    background.scale.set(coverWidth * zoom, coverHeight * zoom, 1);
    background.position.x = pointer.x * 7 - middle * width * .025;
    background.position.y = -height * .025 * approach + pointer.y * 5;
    const crystalHeight = mobile ? height * (.54 + .035 * middle)
      : Math.min(height * (.95 + .16 * middle - .04 * depart), width * .88);
    crystal.scale.set(crystalHeight * (1672 / 941), crystalHeight, 1);
    crystal.position.set(cx - width / 2 + pointer.x * 18, height / 2 - cy + pointer.y * 12, 2);
    crystal.rotation.set(0, 0, 0);
    for (const [i, fragment] of fragments.entries()) {
      fragment.scale.copy(crystal.scale);
      fragment.position.copy(crystal.position);
      fragment.position.z = 2.01 + i * .01;
      fragment.position.y += reduced.matches ? 0 : Math.sin(t * (.36 + i * .055) + i * 1.7) * (4 + i * 1.2);
    }
    for (const [i, rock] of [left, right].entries()) {
      rock.scale.set(coverWidth * (1.1 + middle * .06), coverHeight * (1.08 + middle * .04), 1);
      rock.position.x = (i ? 1 : -1) * width * .16 * middle + pointer.x * (i ? 26 : 36);
      rock.position.y = -height * (.08 * approach + .015 * depart) + pointer.y * 25;
      rock.rotation.z = (i ? 1 : -1) * .055 * middle;
    }
    materials.forEach(material => {
      const kind = material.uniforms.uKind.value;
      material.uniforms.uTime.value = t;
      material.uniforms.uBend.value = reduced.matches || kind === 1 ? 0
        : (kind === 0 ? .004 : .012 + middle * .026);
      material.uniforms.uPointer.value.set(pointer.x, pointer.y);
      material.uniforms.uPulse.value = pulse;
      material.uniforms.uHover.value = pointer.hover;
    });
    dustMaterial.uniforms.uTime.value = t;
    dustMaterial.uniforms.uBurst.value = pulse;
    dustMaterial.uniforms.uOrigin.value.set(cx - width / 2, height / 2 - cy);
    renderer.render(scene, camera);
  }

  function resize() {
    previousCopyProgress = -1;
    width = stage.clientWidth; height = stage.clientHeight; mobile = width < 800;
    camera.left = -width / 2; camera.right = width / 2;
    camera.top = height / 2; camera.bottom = -height / 2; camera.updateProjectionMatrix();
    renderer?.setSize(width, height, false);
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
    if (reduced.matches || event.pointerType === "touch") return;
    const rect = stage.getBoundingClientRect();
    pointer.tx = (event.clientX - rect.left) / width * 2 - 1;
    pointer.ty = 1 - (event.clientY - rect.top) / height * 2;
  }
  const leave = () => { pointer.tx = 0; pointer.ty = 0; };
  const hover = () => { pointer.hoverTarget = 1; };
  const unhover = () => { pointer.hoverTarget = 0; };
  const burst = () => { burstAt = clock; };
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
  touch.addEventListener("pointerenter", hover); touch.addEventListener("pointerleave", unhover);
  touch.addEventListener("focus", hover); touch.addEventListener("blur", unhover); touch.addEventListener("click", burst);
  canvas.addEventListener("webglcontextlost", contextLost); canvas.addEventListener("webglcontextrestored", contextRestored);
  reduced.addEventListener("change", resize);
  gsap.ticker.add(tick);
  resize();

  return () => {
    disposed = true;
    tween.scrollTrigger?.kill(); tween.kill(); gsap.ticker.remove(tick);
    observer.disconnect(); sizeObserver.disconnect(); reduced.removeEventListener("change", resize);
    stage.removeEventListener("pointermove", move); stage.removeEventListener("pointerleave", leave);
    touch.removeEventListener("pointerenter", hover); touch.removeEventListener("pointerleave", unhover);
    touch.removeEventListener("focus", hover); touch.removeEventListener("blur", unhover); touch.removeEventListener("click", burst);
    canvas.removeEventListener("webglcontextlost", contextLost); canvas.removeEventListener("webglcontextrestored", contextRestored);
    textures.forEach(texture => texture.dispose()); materials.forEach(material => material.dispose());
    geometry.dispose(); crystalGeometry.dispose(); dustGeometry.dispose(); dustMaterial.dispose(); renderer?.dispose();
    delete stage.dataset.art;
  };
}
