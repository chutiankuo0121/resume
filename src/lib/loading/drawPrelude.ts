import * as THREE from "three";
import { fullscreenVertex, blurFragment } from "../shaders/composite";
import { portalCompositeFragment } from "../shaders/elimarExit";
import { portalLightGLSL, portalDustFragment } from "../shaders/portalLight";
import { LOADING_PRELUDE } from "./config";
import type { LoadingState } from "./progress";

// Both the ink mask and emission use this exact contour, including its moving grain.
const contourGLSL = /* glsl */`
  uniform vec2 uViewport, uResolution, uOrigin;
  uniform float uTime, uScale, uMorph, uZoom, uProgress, uReduced;
  const float BAR = ${LOADING_PRELUDE.barLength.toFixed(1)};
  const float STROKE = ${LOADING_PRELUDE.strokeWidth.toFixed(1)};
  const float SWEEP = ${LOADING_PRELUDE.arcSweep};
  ${portalLightGLSL}
  vec2 rotatePoint(vec2 p, float angle) {
    float c=cos(angle), s=sin(angle);
    return vec2(c*p.x-s*p.y,s*p.x+c*p.y);
  }
  float roundedBar(vec2 p, float progress) {
    float w=max(.001,(BAR+STROKE)*progress);
    float r=min(STROKE*.5,w*.5);
    vec2 center=vec2(-(BAR+STROKE)*.5+w*.5,0.);
    vec2 q=abs(p-center)-vec2(w*.5,STROKE*.5)+r;
    return length(max(q,0.))+min(max(q.x,q.y),0.)-r;
  }
  float strokeDistance(vec2 p) {
    if(uMorph<.002) return roundedBar(p,uProgress);
    p=rotatePoint(p,1.570796327*uMorph);
    float sweep=SWEEP*uMorph, radius=BAR/sweep;
    float offset=(1.-cos(sweep*.5))*radius*.5;
    vec2 fromCenter=p-vec2(0.,radius-offset);
    float angle=clamp(atan(fromCenter.x,-fromCenter.y),-sweep*.5,sweep*.5);
    vec2 nearest=vec2(sin(angle),-cos(angle))*radius;
    return length(fromCenter-nearest)-STROKE*.5;
  }
  float rimDistance(vec2 pixel) {
    float d=strokeDistance((pixel-uOrigin)/uScale)*uScale;
    vec2 q=pixel/uViewport.y;
    float wave=(field(q*18.+vec2(uTime*.12,-uTime*.09))-.5)*2.8;
    float grain=(field(q*110.+uTime*.04)-.5)*1.4;
    return d+(wave+grain)*mix(.65,2.5,smoothstep(0.,.6,uZoom));
  }
`;

/** Uses the opening renderer: no extra WebGL context, and no scaled bitmap stars. */
export function createPreludeDrawing(renderer: THREE.WebGLRenderer, background: THREE.Texture) {
  const target = () => new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType, depthBuffer: false,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
  });
  const frame = target(), emission = target(), blurX = target(), bloom = target();
  const uniforms = {
    uViewport: { value: new THREE.Vector2(1, 1) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uOrigin: { value: new THREE.Vector2() },
    uTime: { value: 0 }, uScale: { value: 1 }, uMorph: { value: 0 },
    uZoom: { value: 0 }, uProgress: { value: 0 }, uReduced: { value: 0 },
    uBackground: { value: background },
  };
  const ink = new THREE.ShaderMaterial({
    name: "PreludeStarMask", uniforms, vertexShader: fullscreenVertex,
    depthTest: false, depthWrite: false,
    fragmentShader: /* glsl */`
      varying vec2 vUv;
      uniform sampler2D uBackground;
      ${contourGLSL}
      void main(){
        vec2 pixel=vec2(vUv.x,1.-vUv.y)*uViewport;
        float d=rimDistance(pixel);
        float fill=1.-smoothstep(-.8,.8,d);
        fill*=step(.00001,uProgress);
        float track=uMorph<.002 ? 1.-smoothstep(-.8,.8,
          roundedBar((pixel-uOrigin)/uScale,1.)*uScale) : 0.;
        vec3 color=vec3(track*.075);
        vec3 picture=texture2D(uBackground,vUv).rgb;
        // The white stroke becomes a window; its full luminous perimeter stays visible.
        float opening=smoothstep(0.,.68,uZoom);
        color=mix(color,mix(vec3(.82),picture,opening),fill);
        if(uReduced>.5) color=mix(color,picture,uZoom);
        gl_FragColor=vec4(color,1.);
      }
    `,
  });
  const edge = new THREE.ShaderMaterial({
    name: "PreludeStarEmission", uniforms, vertexShader: fullscreenVertex,
    depthTest: false, depthWrite: false,
    fragmentShader: /* glsl */`
      varying vec2 vUv;
      ${contourGLSL}
      void main(){
        vec2 pixel=vec2(vUv.x,1.-vUv.y)*uViewport;
        float d=rimDistance(pixel);
        float strength=smoothstep(0.,.02,uProgress)*(1.-uReduced);
        vec2 q=(vUv-.5)*vec2(uViewport.x/uViewport.y,1.);
        vec3 light=vec3(0.);
        if(abs(d)<uViewport.y*.14 && strength>0.)
          light=portalLight(d/uViewport.y,strength,vUv,q,0.);
        if(uMorph<.002 && uReduced<.5){
          float track=roundedBar((pixel-uOrigin)/uScale,1.)*uScale;
          light+=portalLight(track/uViewport.y,.12*(1.-uProgress),vUv,q,0.);
        }
        gl_FragColor=vec4(light,1.);
      }
    `,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const scene = new THREE.Scene(), lightScene = new THREE.Scene();
  const camera = new THREE.Camera();
  const quad = new THREE.Mesh(geometry, ink);
  scene.add(quad);
  lightScene.add(new THREE.Mesh(geometry, edge));
  const seeds = new Float32Array(720 * 4);
  let seed = 91273;
  for (let i = 0; i < seeds.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    seeds[i] = seed / 4294967296;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(720 * 3), 3));
  dustGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  const dustMaterial = new THREE.ShaderMaterial({
    name: "PreludeDriftingStars", uniforms: { ...uniforms, uDpr: { value: 1 } },
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec4 aSeed;
      uniform float uDpr;
      varying float vAlpha,vFlash;
      ${contourGLSL}
      void main(){
        float life=fract(uTime/(3.5+aSeed.z*4.)+aSeed.y);
        float side=aSeed.w>.43?1.:-1.;
        float t=aSeed.x;
        vec2 p,normal;
        if(uMorph<.002){
          float w=(BAR+STROKE)*uProgress;
          p=vec2(-(BAR+STROKE)*.5+min(15.,w*.5)+t*max(0.,w-STROKE),0.);
          normal=vec2(0.,side);
        }else{
          float sweep=SWEEP*uMorph, radius=BAR/sweep;
          float angle=(t-.5)*sweep;
          float offset=(1.-cos(sweep*.5))*radius*.5;
          p=vec2(sin(angle)*radius,(1.-cos(angle))*radius-offset);
          normal=vec2(-sin(angle),cos(angle))*side;
          p=rotatePoint(p,-1.570796327*uMorph);
          normal=rotatePoint(normal,-1.570796327*uMorph);
        }
        vec2 pos=uOrigin+(p+normal*STROKE*.5)*uScale;
        // Drift remains in CSS pixels while the C grows around it.
        float spread=10.+pow(aSeed.z,2.)*98.;
        pos+=normal*(3.+life*spread);
        pos+=vec2(normal.y,-normal.x)*sin(uTime*.7+aSeed.y*30.)*7.*life;
        float blink=.5+.5*sin(uTime*(1.2+aSeed.z*2.4)+aSeed.x*60.);
        vFlash=pow(blink,10.)*step(.92,aSeed.w);
        vAlpha=smoothstep(0.,.12,life)*(1.-smoothstep(.45,1.,life))
          *(.28+.72*blink)*(.5+aSeed.z*.5)*smoothstep(0.,.08,uProgress)*(1.-uReduced);
        vAlpha*=min(1.,(BAR+STROKE)*uProgress*uScale/uViewport.x);
        gl_Position=vec4(pos.x/uViewport.x*2.-1.,1.-pos.y/uViewport.y*2.,0.,1.);
        gl_PointSize=(1.2+aSeed.z*1.9+vFlash*5.)*uDpr;
      }
    `,
    fragmentShader: portalDustFragment,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.frustumCulled = false; dust.renderOrder = 1; lightScene.add(dust);
  const blur = new THREE.ShaderMaterial({
    vertexShader: fullscreenVertex, fragmentShader: blurFragment, depthTest: false, depthWrite: false,
    uniforms: { uInput: { value: emission.texture }, uStep: { value: new THREE.Vector2() } },
  });
  const composite = new THREE.ShaderMaterial({
    vertexShader: fullscreenVertex, fragmentShader: portalCompositeFragment, depthTest: false, depthWrite: false,
    uniforms: { uFrame: { value: frame.texture }, uEmission: { value: emission.texture }, uBloom: { value: bloom.texture } },
  });
  let width = 1, height = 1;
  function pass(material: THREE.ShaderMaterial, output: THREE.WebGLRenderTarget | null) {
    quad.material = material;
    renderer.setRenderTarget(output); renderer.clear(); renderer.render(scene, camera);
  }
  return {
    resize(w: number, h: number, dpr: number) {
      width = w; height = h;
      uniforms.uViewport.value.set(w, h); uniforms.uResolution.value.set(w * dpr, h * dpr);
      frame.setSize(Math.max(1, Math.round(w * dpr)), Math.max(1, Math.round(h * dpr)));
      for (const buffer of [emission, blurX, bloom]) buffer.setSize(Math.max(1, Math.round(w * dpr * .5)), Math.max(1, Math.round(h * dpr * .5)));
      dustMaterial.uniforms.uDpr.value = dpr * .5;
      dustGeometry.setDrawRange(0, width < 600 ? 360 : 720);
    },
    render(state: LoadingState, reduced: boolean, time: number) {
      const { barLength, strokeWidth, arcSweep } = LOADING_PRELUDE;
      const unit = Math.min(1, width / 640, height / 420);
      const focusX = -(1 - Math.cos(arcSweep / 2)) * (barLength / arcSweep) / 2;
      const endScale = (Math.hypot(width, height) + Math.abs(focusX) * unit * 2) / (strokeWidth * unit) * 1.15;
      const zoom = reduced ? 0 : state.reveal;
      const scale = 1 + (endScale - 1) * zoom ** 3;
      uniforms.uOrigin.value.set(width / 2 - focusX * unit * (scale - 1), height / 2);
      uniforms.uScale.value = unit * scale;
      uniforms.uTime.value = reduced ? 0 : time;
      uniforms.uMorph.value = state.morph; uniforms.uZoom.value = state.reveal;
      uniforms.uProgress.value = state.progress; uniforms.uReduced.value = reduced ? 1 : 0;
      renderer.setClearColor(0, 1);
      pass(ink, frame);
      renderer.setRenderTarget(emission); renderer.clear(); renderer.render(lightScene, camera);
      blur.uniforms.uInput.value = emission.texture;
      blur.uniforms.uStep.value.set(2.4 / emission.width, 0); pass(blur, blurX);
      blur.uniforms.uInput.value = blurX.texture;
      blur.uniforms.uStep.value.set(0, 2.4 / emission.height); pass(blur, bloom);
      pass(composite, null);
    },
    dispose() {
      for (const buffer of [frame, emission, blurX, bloom]) buffer.dispose();
      for (const material of [ink, edge, dustMaterial, blur, composite]) material.dispose();
      geometry.dispose(); dustGeometry.dispose();
    },
  };
}
