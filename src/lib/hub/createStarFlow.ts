import * as THREE from "three";
import { simplex } from "../shaders/noise";
import {
  boundaryGLSL,
  createBoundaryUniforms,
  type BoundaryState,
} from "./boundaryField";

const vertexShader = /* glsl */ `
attribute vec3 aFlow;
uniform vec2 uWorld;
uniform float uPixelRatio;
varying float vTone;
varying float vOpacity;
varying float vDepth;
${boundaryGLSL}
${simplex}
void main(){
  float t=uBoundary.x;
  float presence=1.-smoothstep(.08,.82,uBoundary.y);
  float lane=aFlow.y;
  float x=fract(position.x+t*(.0035+lane*.0003));
  float phase=x*11.-t*.13;
  float gathering=.25+.75*pow(.5+.5*sin(x*18.+lane*.5-t*.11),2.);
  float fork=sin(x*12.+lane*2.1+t*.09)*(.015+lane*.016)*sin(x*3.14159);
  float field=snoise(vec3(x*7.,lane*.65,t*.06));
  float broad=lane>2.5 ? .15 : .011+.024*gathering;
  float offset=fork+position.y*broad+field*.014+position.z*.012;
  float y=boundaryCurve(x)+offset*presence;
  vec2 q=vec2(x,y);
  vec2 pointerDelta=(q-uBoundaryPointer.xy)*vec2(uBoundarySize.x/uBoundarySize.y,1.);
  float touch=exp(-dot(pointerDelta,pointerDelta)*28.)*uBoundaryPointer.z*presence;
  float depth=position.z;
  // 近远层共享一股流场；指针只轻推局部，再由 z 层产生不同程度的视差。
  q+=vec2(field*.005,cos(phase+lane)*.009)*presence;
  q+=pointerDelta*touch*.055+vec2(uBoundaryPointer.x-.5,uBoundaryPointer.y-.5)*depth*.012*presence;
  float z=depth*.85;
  vec2 xy=(q-vec2(.5))*vec2(uWorld.x,-uWorld.y)*(8.-z)/8.;
  vec4 mv=modelViewMatrix*vec4(xy,z,1.);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=clamp(aFlow.x*uPixelRatio*8./(-mv.z),1.,24.*uPixelRatio);
  float edgeFade=smoothstep(0.,.025,x)*(1.-smoothstep(.975,1.,x));
  vOpacity=presence*edgeFade*mix(.26,.92,(depth+1.)*.5)*mix(.6,1.,gathering);
  if(lane>2.5)vOpacity*=.38;
  vDepth=depth;
  // 明面留下灰色微粒，暗面露出洁白圆核；不叠加玻璃珠的黑色描边。
  vTone=mix(.46,1.,smoothstep(-.06,.015,offset)) + touch*.12;
}
`;
const fragmentShader = /* glsl */ `
varying float vTone;
varying float vOpacity;
varying float vDepth;
void main(){
  float radius=length(gl_PointCoord*2.-1.);
  float softness=max(fwidth(radius),mix(.23,.04,(vDepth+1.)*.5));
  float core=1.-smoothstep(.73-softness,.73+softness,radius);
  float opacity=core*vOpacity;
  if(opacity<.004)discard;
  gl_FragColor=vec4(vec3(vTone),opacity);
}
`;

/** 透视粒子层：三股细流与远处微粒，亮簇、景深和视差来自同一份空间种子。 */
export function createStarFlow(
  canvas: HTMLCanvasElement,
  state: BoundaryState,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
  });
  renderer.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 20);
  camera.position.z = 8;
  const field = createBoundaryUniforms(state);
  let seed = 541;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const positions = new Float32Array(2200 * 3);
  const flow = new Float32Array(2200 * 3);
  for (let i = 0; i < 2200; i++) {
    const lane = i % 4;
    const cluster = [0.22, 0.55, 0.81][i % 3];
    const x =
      random() < 0.55 ? cluster + (random() + random() - 1) * 0.15 : random();
    const depth = random() * 2 - 1;
    positions.set([x, random() + random() - 1, depth], i * 3);
    const size =
      lane === 3 ? 1.4 + random() * 2 : 2 + Math.pow(random(), 2.8) * 10;
    flow.set([size, lane, random()], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aFlow", new THREE.BufferAttribute(flow, 3));
  const material = new THREE.ShaderMaterial({
    name: "HubStarFlow",
    vertexShader,
    fragmentShader,
    uniforms: {
      ...field.uniforms,
      uWorld: { value: new THREE.Vector2() },
      uPixelRatio: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  return {
    resize(width: number, height: number) {
      const dpr = Math.min(
        devicePixelRatio,
        1.5,
        Math.sqrt(3_000_000 / (width * height)),
      );
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const span = 16 * Math.tan(THREE.MathUtils.degToRad(21));
      material.uniforms.uWorld.value.set(span * camera.aspect, span);
      material.uniforms.uPixelRatio.value = dpr;
      geometry.setDrawRange(
        0,
        Math.min(2200, Math.max(1000, Math.round(width * 1.1))),
      );
    },
    render() {
      field.update();
      renderer.render(scene, camera);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      scene.clear();
    },
  };
}
