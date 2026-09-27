import { pictureDetailGLSL } from "../shaders/pictureDetail";
import { DataTexture, FloatType, NearestFilter, RGBAFormat, Vector2, Vector3, Vector4 } from "three";
import { EDGE_SAMPLES } from "../chapters/createChapterEdge";

export type HubDestination = "work" | "skills";
export type BoundaryState = {
  expansion: number;
  destination: HubDestination;
  time: number;
  width: number;
  height: number;
  pointerX: number;
  pointerY: number;
  pointerStrength: number;
  /** 0..1 convergence; 1 is the persistent merged seam. */
  gather: number;
  /** Crisp ink seam for the framed directory; contact retains its light reveal. */
  ink?: boolean;
  /** Normalized straight-line endpoints; no sampled texture is needed for ink. */
  inkLine?: { left: number; right: number };
  /** CSS-pixel lens shared by the two final color passes and its DOM outline. */
  colorLens?: { x: number; y: number; radius: number; strength: number; enabled: boolean };
};

// Each renderer owns its GPU texture, but all read the same CPU contour samples.
const sampledCurves = new WeakMap<BoundaryState, Float32Array>();
export function boundarySamples(state: BoundaryState) {
  let samples = sampledCurves.get(state);
  if (!samples) {
    samples = new Float32Array(EDGE_SAMPLES * 4);
    for (let i = 0; i < EDGE_SAMPLES; i++) {
      const y = .91 - i / (EDGE_SAMPLES - 1) * .82;
      samples.set([y, y, y, 0], i * 4);
    }
    sampledCurves.set(state, samples);
  }
  return samples;
}

// Shared, short pointer wake; update once per contour frame, not per renderer.
const pointerWakes = new WeakMap<BoundaryState, Vector3[]>();
function pointerWake(state: BoundaryState) {
  let wake = pointerWakes.get(state);
  if (!wake) {
    wake = Array.from({ length: 6 }, () => new Vector3(-2, -2, 0));
    pointerWakes.set(state, wake);
  }
  return wake;
}
export function updateBoundaryWake(state: BoundaryState, dt: number) {
  const wake = pointerWake(state);
  for (let i = wake.length - 1; i > 0; i--) {
    wake[i].lerp(wake[i - 1], 1 - Math.exp(-dt * 12));
  }
  wake[0].set(state.pointerX, state.pointerY, state.pointerStrength);
}

/** 三个 WebGL 上下文读取同一份状态，避免雾层、裁剪与高光各自漂移。 */
export function createBoundaryUniforms(state: BoundaryState) {
  const curve = new DataTexture(boundarySamples(state), EDGE_SAMPLES, 1, RGBAFormat, FloatType);
  curve.minFilter = curve.magFilter = NearestFilter;
  const uniforms = {
    uBoundaryCurve: { value: curve },
    uBoundary: { value: new Vector2() },
    uBoundarySize: { value: new Vector2(1, 1) },
    uBoundaryGather: { value: state.gather },
    uBoundaryInk: { value: state.ink ? 1 : 0 },
    uBoundaryInkLine: { value: new Vector2(.91, .09) },
    uBoundaryWake: { value: pointerWake(state) },
    uHubColorLens: { value: new Vector4() },
    uHubMonochrome: { value: 0 },
  };
  function update() {
    // Only the contact contour moves continuously. The directory is analytic.
    if (!state.ink) curve.needsUpdate = true;
    if (state.inkLine) uniforms.uBoundaryInkLine.value.set(state.inkLine.left, state.inkLine.right);
    uniforms.uBoundary.value.set(state.time, state.expansion);
    uniforms.uBoundarySize.value.set(state.width, state.height);
    uniforms.uBoundaryGather.value = state.gather;
    const lens = state.colorLens;
    uniforms.uHubMonochrome.value = lens?.enabled ? 1 : 0;
    uniforms.uHubColorLens.value.set(lens?.x ?? 0, lens?.y ?? 0, lens?.radius ?? 1, lens?.strength ?? 0);
  }
  update();
  return { uniforms, update, dispose() { curve.dispose(); } };
}

export const boundaryGLSL = /* glsl */ `
uniform vec2 uBoundary;
uniform vec2 uBoundarySize;
uniform sampler2D uBoundaryCurve;
uniform float uBoundaryGather;
uniform float uBoundaryInk;
uniform vec2 uBoundaryInkLine;
uniform vec3 uBoundaryWake[6];
uniform vec4 uHubColorLens;
uniform float uHubMonochrome;
${pictureDetailGLSL}
// Work and skills use the same screen-space circle, without resampling geometry.
vec3 hubColorLens(vec3 color,vec2 uv){
  float monochrome=uHubMonochrome*(1.-smoothstep(0.,.85,uBoundary.y));
  vec2 pixel=vec2(uv.x,1.-uv.y)*uBoundarySize;
  float distance=length(pixel-uHubColorLens.xy);
  float reveal=(1.-smoothstep(max(0.,uHubColorLens.z-8.),uHubColorLens.z,distance))*uHubColorLens.w;
  float luminance=dot(color,vec3(.2126,.7152,.0722));
  return mix(color,vec3(luminance),monochrome*(1.-reveal));
}
vec3 boundaryCurves(float x){
  if(uBoundaryInk>.5)return vec3(mix(uBoundaryInkLine.x,uBoundaryInkLine.y,x));
  float index=clamp(x*512.,0.,511.999);
  return mix(texture2D(uBoundaryCurve,vec2((floor(index)+.5)/513.,.5)).rgb,
    texture2D(uBoundaryCurve,vec2((floor(index)+1.5)/513.,.5)).rgb,fract(index));
}
// The mask, hit regions and glow upload these exact same samples.
vec4 boundaryField(vec2 uv){
  vec2 q=vec2(uv.x,1.-uv.y);
  float aspect=uBoundarySize.x/uBoundarySize.y;
  float left=max(0.,q.x-8./512.),right=min(1.,q.x+8./512.);
  vec3 slope=(boundaryCurves(right)-boundaryCurves(left))/(right-left)/aspect;
  vec3 normalScale=sqrt(vec3(1.)+slope*slope);
  vec3 distance=(vec3(q.y)-boundaryCurves(q.x))/normalScale;
  float nearest=min(abs(distance.x),abs(distance.y))*uBoundarySize.y;
  float feather=mix(8.,.5,uBoundaryInk);
  float coverage=smoothstep(-feather,feather,distance.z*uBoundarySize.y);
  float frost=(1.-smoothstep(3.,20.,nearest))*(1.-smoothstep(.65,1.,uBoundary.y))*(1.-uBoundaryInk);
  return vec4(coverage,frost,distance.z,nearest);
}
float boundaryGhostWeight(vec2 uv,float nearest){
  if(uBoundaryInk>.5)return 0.;
  float phase=smoothstep(.04,.2,uBoundaryGather)*(1.-smoothstep(.82,1.,uBoundaryGather));
  float band=(1.-smoothstep(28.,150.,nearest))*smoothstep(2.,10.,nearest);
  vec2 pixel=vec2(uv.x,1.-uv.y)*uBoundarySize;
  float hover=0.;
  for(int i=0;i<6;i++){
    vec2 delta=(pixel-uBoundaryWake[i].xy*uBoundarySize)/105.;
    hover=max(hover,exp(-dot(delta,delta))*uBoundaryWake[i].z*(1.-float(i)*.12));
  }
  return min(1.6,phase+hover*.9)*band*(1.-smoothstep(0.,.45,uBoundary.y))
    *smoothstep(0.,.04,uBoundaryGather);
}
// Each picture and its extracted details share the same side coverage.
float boundaryPictureDistance(vec2 uv,bool skills){
  float x=uv.x;
  float left=max(0.,x-8./512.),right=min(1.,x+8./512.);
  vec3 slope=(boundaryCurves(right)-boundaryCurves(left))/(right-left)
    *uBoundarySize.y/uBoundarySize.x;
  vec3 distances=((1.-uv.y)-boundaryCurves(x))*uBoundarySize.y/sqrt(1.+slope*slope);
  return abs(skills ? distances.y : distances.x);
}
float boundaryPictureCoverage(vec2 uv,bool skills){
  vec3 curves=boundaryCurves(uv.x);
  float y=(1.-uv.y)*uBoundarySize.y;
  float feather=mix(8.,.5,uBoundaryInk);
  if(skills) return smoothstep(-feather,feather,y-curves.y*uBoundarySize.y);
  float upper=1.-smoothstep(-feather,feather,y-curves.x*uBoundarySize.y);
  // The settled directory keeps work as the full base beneath the skills pane.
  return mix(upper,1.,smoothstep(.98,1.,uBoundaryGather));
}
vec4 boundaryPicture(vec3 color,float detail,vec2 uv,float nearest,float coverage){
  float weight=boundaryGhostWeight(uv,nearest);
  float emission=pictureGhostEmission(detail,uv,uBoundarySize,uBoundary.x)*weight;
  vec3 inside=color*(1.-weight*.2)+vec3(.9,.96,1.)*emission*.8;
  return vec4(inside,coverage);
}
// 在原始场景纹理上采样柔化；雾带外直接返回原图，作品和技能主体保持清晰。
vec4 boundarySample(sampler2D frame,vec2 uv,vec2 screenUv,float frost){
  // Compute texture gradients before the per-pixel frosting branch. Explicit
  // gradients also keep the sharp path stable on ANGLE/D3D shader compilers.
  vec2 dx=dFdx(uv), dy=dFdy(uv);
  vec4 original=textureGrad(frame,uv,dx,dy);
  if(frost<.002)return original;
  vec2 p=screenUv*uBoundarySize;
  vec2 flow=vec2(pictureNoise(p*.006+uBoundary.x*.025),pictureNoise(p*.006-7.-uBoundary.x*.02))-.5;
  vec2 blur=vec2(7.)*frost/uBoundarySize;
  vec2 center=uv+flow*blur*.65;
  // 黄金角采样并按像素旋转，避免大模糊半径产生多重边缘；种子不随时间闪烁。
  float angle=pictureHash(floor(p))*6.2831853;
  vec4 color=vec4(0.);
  float total=0.;
  for(int i=0;i<24;i++){
    float r=sqrt((float(i)+.5)/24.);
    float a=angle+float(i)*2.3999632;
    float weight=exp(-2.*r*r);
    color+=textureGrad(frame,center+vec2(cos(a),sin(a))*r*blur,dx,dy)*weight;
    total+=weight;
  }
  return color/total;
}
vec3 boundaryGrain(vec3 color,vec2 uv,float frost){
  float grain=pictureHash(floor(uv*uBoundarySize))-.5;
  return color+vec3(grain*.022*frost);
}
`;
