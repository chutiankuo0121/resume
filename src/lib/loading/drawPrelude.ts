import * as THREE from "three";
import { fullscreenVertex } from "../shaders/composite";
import { LOADING_PRELUDE } from "./config";
import type { LoadingState } from "./progress";

/** 原版圆角白条 → 平滑 C → 放大揭幕，复用首页渲染器。 */
export function createPreludeDrawing(renderer: THREE.WebGLRenderer, background: THREE.Texture) {
  const uniforms = {
    uViewport: { value: new THREE.Vector2(1, 1) },
    uOrigin: { value: new THREE.Vector2() },
    uScale: { value: 1 }, uMorph: { value: 0 },
    uZoom: { value: 0 }, uProgress: { value: 0 }, uReduced: { value: 0 },
    uBackground: { value: background },
  };
  const material = new THREE.ShaderMaterial({
    name: "PreludeRoundedMask", uniforms, vertexShader: fullscreenVertex,
    depthTest: false, depthWrite: false,
    fragmentShader: /* glsl */`
      varying vec2 vUv;
      uniform sampler2D uBackground;
      uniform vec2 uViewport, uOrigin;
      uniform float uScale, uMorph, uZoom, uProgress, uReduced;
      const float BAR = ${LOADING_PRELUDE.barLength.toFixed(1)};
      const float STROKE = ${LOADING_PRELUDE.strokeWidth.toFixed(1)};
      const float SWEEP = ${LOADING_PRELUDE.arcSweep};
      float roundedBar(vec2 p, float progress) {
        float w=max(.001,(BAR+STROKE)*progress);
        float r=min(STROKE*.5,w*.5);
        vec2 center=vec2(-(BAR+STROKE)*.5+w*.5,0.);
        vec2 q=abs(p-center)-vec2(w*.5,STROKE*.5)+r;
        return length(max(q,0.))+min(max(q.x,q.y),0.)-r;
      }
      float strokeDistance(vec2 p) {
        if(uMorph<.002) return roundedBar(p,uProgress);
        float rotation=1.570796327*uMorph;
        float c=cos(rotation), s=sin(rotation);
        p=vec2(c*p.x-s*p.y,s*p.x+c*p.y);
        float sweep=SWEEP*uMorph, radius=BAR/sweep;
        float offset=(1.-cos(sweep*.5))*radius*.5;
        vec2 fromCenter=p-vec2(0.,radius-offset);
        float angle=clamp(atan(fromCenter.x,-fromCenter.y),-sweep*.5,sweep*.5);
        vec2 nearest=vec2(sin(angle),-cos(angle))*radius;
        return length(fromCenter-nearest)-STROKE*.5;
      }
      void main(){
        vec2 pixel=vec2(vUv.x,1.-vUv.y)*uViewport;
        vec2 p=(pixel-uOrigin)/uScale;
        float d=strokeDistance(p)*uScale;
        float aa=max(fwidth(d)*.5,.5);
        float fill=(1.-smoothstep(-aa,aa,d))*step(.00001,uProgress);
        float track=uMorph<.002 ? 1.-smoothstep(-aa,aa,roundedBar(p,1.)*uScale) : 0.;
        vec3 color=vec3(track*(48./255.));
        vec3 picture=texture2D(uBackground,vUv).rgb;
        // 对齐原版白墨在前 75% 推进中淡出，露出原尺寸的黑洞场景。
        float opening=smoothstep(0.,.75,uZoom);
        color=mix(color,mix(vec3(1.),picture,opening),fill);
        if(uReduced>.5) color=mix(mix(vec3(track*(48./255.)),vec3(1.),fill),picture,uZoom);
        gl_FragColor=vec4(color,1.);
      }
    `,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  scene.add(new THREE.Mesh(geometry, material));
  let width = 1, height = 1;
  return {
    resize(w: number, h: number) {
      width = w; height = h;
      uniforms.uViewport.value.set(w, h);
    },
    render(state: LoadingState, reduced: boolean) {
      const { barLength, strokeWidth, arcSweep } = LOADING_PRELUDE;
      const unit = Math.min(1, width / 640, height / 420);
      const focusX = -(1 - Math.cos(arcSweep / 2)) * (barLength / arcSweep) / 2;
      const endScale = (Math.hypot(width, height) + Math.abs(focusX) * unit * 2) / (strokeWidth * unit) * 1.15;
      const zoom = reduced ? 0 : state.reveal;
      const scale = 1 + (endScale - 1) * zoom ** 3;
      uniforms.uOrigin.value.set(width / 2 - focusX * unit * (scale - 1), height / 2);
      uniforms.uScale.value = unit * scale;
      uniforms.uMorph.value = state.morph; uniforms.uZoom.value = state.reveal;
      uniforms.uProgress.value = state.progress; uniforms.uReduced.value = reduced ? 1 : 0;
      renderer.setClearColor(0, 1);
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(scene, camera);
    },
    dispose() {
      material.dispose(); geometry.dispose();
    },
  };
}
