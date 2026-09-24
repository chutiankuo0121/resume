import * as THREE from "three";
import { fullscreenVertex, blurFragment } from "../shaders/composite";
import { portalCompositeFragment } from "../shaders/elimarExit";
import { portalLightGLSL, portalDustFragment } from "../shaders/portalLight";

export const EDGE_SAMPLES = 513;
export type EdgePoint = { x: number; y: number };
type EdgeMotion = { x: number; y: number; strength: number; flow: number; velocities?: Float32Array };
const noiseGLSL = /* glsl */ `
  ${portalLightGLSL}
  vec4 contour(sampler2D curve,float x){
    float index=clamp(x*512.,0.,511.999);
    return mix(texture2D(curve,vec2((floor(index)+.5)/513.,.5)),
      texture2D(curve,vec2((floor(index)+1.5)/513.,.5)),fract(index));
  }
`;

/** The mask and the fine luminous paper edge share one pixel-space contour. */
export function createChapterEdge(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: false, antialias: false });
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const makeTarget = () => new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false,
  });
  const emission = makeTarget(), blurX = makeTarget(), bloom = makeTarget();
  // DOM supplies both pictures. Only light is composited onto the clear frame.
  const clearFrame = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  clearFrame.needsUpdate = true;
  const data = new Float32Array(EDGE_SAMPLES * 4);
  const curve = new THREE.DataTexture(data, EDGE_SAMPLES, 1, THREE.RGBAFormat, THREE.FloatType);
  curve.minFilter = curve.magFilter = THREE.NearestFilter;
  const speeds = new Float32Array(EDGE_SAMPLES * 4);
  const velocityMap = new THREE.DataTexture(speeds, EDGE_SAMPLES, 1, THREE.RGBAFormat, THREE.FloatType);
  velocityMap.minFilter = velocityMap.magFilter = THREE.NearestFilter;
  const material = new THREE.ShaderMaterial({
    name: "ChapterParticleEdge",
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uCurve: { value: curve }, uSize: { value: new THREE.Vector2(1, 1) },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 }, uStrength: { value: 0 }, uDouble: { value: 0 },
      uFlow: { value: 0 },
    },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uCurve;
      uniform vec2 uSize;
      uniform vec2 uResolution;
      uniform float uTime,uStrength,uDouble,uFlow;
      varying vec2 vUv;
      ${noiseGLSL}
      void main(){
        vec2 pixel=vec2(vUv.x,1.-vUv.y)*uSize;
        vec4 line=contour(uCurve,vUv.x);
        float d=(pixel.y-line.x)/sqrt(1.+line.z*line.z);
        float other=(pixel.y-line.y)/sqrt(1.+line.w*line.w);
        if(uDouble>.5 && abs(other)<abs(d))d=other;
        if(abs(d)>uSize.y*.14 || uStrength<=0.) { gl_FragColor=vec4(0.); return; }
        vec2 q=(vUv-.5)*vec2(uSize.x/uSize.y,1.);
        // Same light kernel as the circular portal; only the distance field differs.
        vec3 emission=portalLight(d/uSize.y,uStrength,vUv,q,0.);
        gl_FragColor=vec4(emission,1.);
      }`,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  scene.add(new THREE.Mesh(geometry, material));
  // Independent dust, with stable seeds, lifetimes and velocities. These are
  // actual point sprites rather than a stationary noise pattern on the rim.
  const count = 900;
  const seeds = new Float32Array(count * 4);
  let seed = 91273;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < seeds.length; i++) seeds[i] = random();
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  dustGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  const dustMaterial = new THREE.ShaderMaterial({
    name: "ChapterDriftingDust", transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uCurve: { value: curve }, uSize: material.uniforms.uSize,
      uVelocity: { value: velocityMap },
      uResolution: material.uniforms.uResolution,
      uTime: material.uniforms.uTime, uStrength: material.uniforms.uStrength,
      uDouble: material.uniforms.uDouble,
      uFlow: material.uniforms.uFlow, uDpr: { value: 1 },
      uPointer: { value: new THREE.Vector3(-1000, -1000, 0) },
    },
    vertexShader: /* glsl */ `
      uniform sampler2D uCurve, uVelocity;
      uniform vec2 uSize;
      uniform vec2 uResolution;
      uniform vec3 uPointer;
      uniform float uTime,uStrength,uFlow,uDpr,uDouble;
      attribute vec4 aSeed;
      varying float vAlpha,vFlash;
      ${noiseGLSL}
      void main(){
        float life=fract(uTime/(3.5+aSeed.z*4.)+aSeed.y);
        float side=aSeed.w>.43?1.:-1.;
        float x=fract(aSeed.x+sin(uTime*.19+aSeed.z*20.)*.006)*uSize.x;
        vec4 line=contour(uCurve,x/uSize.x);
        if(uDouble>.5 && aSeed.y>.5) line.xz=line.yw;
        vec2 normal=normalize(vec2(-line.z,1.));
        vec2 tangent=vec2(normal.y,-normal.x);
        float velocity=contour(uVelocity,x/uSize.x).x;
        float moving=smoothstep(25.,650.,abs(velocity));
        float spread=(10.+pow(aSeed.z,2.)*98.)*(1.+uFlow*.42);
        vec2 pos=vec2(x,line.x)+normal*side*(3.+life*spread);
        pos+=tangent*(sin(uTime*.7+aSeed.y*30.)*7.+(noise(vec2(aSeed.x*40.,uTime*.4))-.5)*24.)*life;
        // The local moving edge sheds a short wake, with stronger sideways
        // drift at steep lobes. Reversing the scroll reverses this wake.
        pos.y-=clamp(velocity*.055,-42.,42.)*life;
        pos+=tangent*sin(life*6.283185+aSeed.y*12.)*moving*min(abs(line.z),2.)*12.*life;
        vec2 delta=pos-uPointer.xy;
        float influence=exp(-dot(delta,delta)/6500.)*uPointer.z;
        pos+=delta/max(length(delta),1.)*influence*20.*life;
        float blink=.5+.5*sin(uTime*(1.2+aSeed.z*2.4)+aSeed.x*60.);
        vFlash=pow(blink,10.)*step(.92,aSeed.w);
        vAlpha=smoothstep(0.,.12,life)*(1.-smoothstep(.45,1.,life))
          *(.28+.72*blink)*uStrength*(.5+aSeed.z*.5);
        vAlpha*=1.+moving*.18;

        gl_Position=vec4(pos.x/uSize.x*2.-1.,1.-pos.y/uSize.y*2.,0.,1.);
        gl_PointSize=(1.2+aSeed.z*1.9+vFlash*5.)*uDpr;
      }`,
    fragmentShader: portalDustFragment,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.frustumCulled = false;
  dust.renderOrder = 1;
  scene.add(dust);
  const blur = new THREE.ShaderMaterial({
    vertexShader: fullscreenVertex, fragmentShader: blurFragment, depthTest: false, depthWrite: false,
    uniforms: { uInput: { value: emission.texture }, uStep: { value: new THREE.Vector2() } },
  });
  const composite = new THREE.ShaderMaterial({
    vertexShader: fullscreenVertex, fragmentShader: portalCompositeFragment, depthTest: false, depthWrite: false,
    uniforms: { uFrame: { value: clearFrame }, uEmission: { value: emission.texture }, uBloom: { value: bloom.texture } },
  });
  const postScene = new THREE.Scene();
  const quad = new THREE.Mesh(geometry, blur);
  postScene.add(quad);
  return {
    resize(width: number, height: number) {
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.setSize(width, height, false);
      material.uniforms.uSize.value.set(width, height);
      const dpr = renderer.getPixelRatio();
      material.uniforms.uResolution.value.set(width * dpr, height * dpr);
      const w = Math.max(1, Math.round(width * dpr * .5)), h = Math.max(1, Math.round(height * dpr * .5));
      for (const target of [emission, blurX, bloom]) target.setSize(w, h);
      dustMaterial.uniforms.uDpr.value = dpr * .5;
      dustGeometry.setDrawRange(0, width < 600 ? 420 : count);
    },
    render(upper: EdgePoint[], lower: EdgePoint[] | null, time: number, strength: number, motion: EdgeMotion) {
      for (let i = 0; i < EDGE_SAMPLES; i++) {
        // 法线取较宽邻域，避免逐像素锯齿把粒子带拉成竖直条纹。
        const before = Math.max(0, i - 8), after = Math.min(EDGE_SAMPLES - 1, i + 8);
        const slope = (points: EdgePoint[]) => (points[after].y - points[before].y) / Math.max(.001, points[after].x - points[before].x);
        data.set([upper[i].y, lower?.[i].y ?? upper[i].y, slope(upper), slope(lower ?? upper)], i * 4);
        speeds[i * 4] = motion.velocities?.[i] ?? 0;
      }
      curve.needsUpdate = true;
      velocityMap.needsUpdate = true;
      material.uniforms.uTime.value = time;
      material.uniforms.uStrength.value = strength;
      material.uniforms.uDouble.value = lower ? 1 : 0;
      material.uniforms.uFlow.value = motion.flow;
      dustMaterial.uniforms.uPointer.value.set(motion.x, motion.y, motion.strength);
      renderer.setRenderTarget(emission);
      renderer.render(scene, camera);
      quad.material = blur;
      blur.uniforms.uInput.value = emission.texture;
      blur.uniforms.uStep.value.set(2.4 / emission.width, 0);
      renderer.setRenderTarget(blurX);
      renderer.render(postScene, camera);
      blur.uniforms.uInput.value = blurX.texture;
      blur.uniforms.uStep.value.set(0, 2.4 / emission.height);
      renderer.setRenderTarget(bloom);
      renderer.render(postScene, camera);
      quad.material = composite;
      renderer.setRenderTarget(null);
      renderer.render(postScene, camera);
    },
    clear() { renderer.setRenderTarget(null); renderer.clear(); },
    dispose() {
      curve.dispose(); velocityMap.dispose(); material.dispose(); geometry.dispose();
      dustGeometry.dispose(); dustMaterial.dispose();
      for (const target of [emission, blurX, bloom]) target.dispose();
      clearFrame.dispose(); blur.dispose(); composite.dispose(); renderer.dispose();
    },
  };
}
