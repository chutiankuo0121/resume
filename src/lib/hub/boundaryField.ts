import { Vector2, Vector3, Vector4 } from "three";

export type HubDestination = "work" | "skills";
export type BoundaryState = {
  expansion: number;
  hover: number;
  destination: HubDestination;
  time: number;
  width: number;
  height: number;
  pointerX: number;
  pointerY: number;
  pointerStrength: number;
  /** 0..1 convergence; 1 is the persistent merged seam. */
  gather: number;
};

/** 视觉柔化有宽度，点击归属仍由中轴决定；粒子漂出边界不改变按钮热区。 */
function boundaryCurve(x: number, state: BoundaryState) {
  const envelope = Math.sin(Math.PI * x);
  const rest =
    0.91 -
    x * 0.82 +
    Math.sin(x * 11 - 0.7) * 0.037 +
    Math.sin(x * 22 + 0.9) * 0.01 * envelope;
  const drift = Math.sin(x * 12 + state.time * 0.33) * 0.012 * envelope;
  const y = rest + drift + state.hover * 0.022 * envelope;
  return (
    y + ((state.destination === "work" ? 1.4 : -0.4) - y) * state.expansion
  );
}

export function starSeparation(gather: number, height: number) {
  const t = Math.max(0, Math.min(1, gather));
  return (1 - t * t * (3 - 2 * t)) * (height + 120);
}

/** Shared mask/glow geometry; GLSL below mirrors this curve. */
export function starBoundaryCurve(x: number, state: BoundaryState) {
  const px = x * state.width, base = boundaryCurve(x, state) * state.height;
  const presence = 1 - Math.min(1, state.expansion / .82);
  const ripple = (Math.sin(px * .06 + state.time * 1.4) * 3
    + Math.sin(px * .17 - state.time * .8) * 1.1) * presence;
  const local = Math.exp(-Math.pow((px - state.pointerX * state.width) / 105, 2)
    - Math.pow((base - state.pointerY * state.height) / 135, 2)) * state.pointerStrength;
  const push = local * Math.tanh((state.pointerY * state.height - base) / 45) * 24 * presence;
  return (base + ripple + push) / state.height;
}

/** 三个 WebGL 上下文读取同一份状态，避免雾层、裁剪与高光各自漂移。 */
export function createBoundaryUniforms(state: BoundaryState) {
  const uniforms = {
    uBoundary: { value: new Vector4() },
    uBoundarySize: { value: new Vector2(1, 1) },
    uBoundaryPointer: { value: new Vector3() },
    uBoundaryGap: { value: 0 },
  };
  function update() {
    uniforms.uBoundaryGap.value = starSeparation(state.gather, state.height) / state.height;
    uniforms.uBoundary.value.set(
      state.time,
      state.expansion,
      state.hover,
      state.destination === "work" ? 1.4 : -0.4,
    );
    uniforms.uBoundarySize.value.set(state.width, state.height);
    uniforms.uBoundaryPointer.value.set(
      state.pointerX,
      state.pointerY,
      state.pointerStrength,
    );
  }
  update();
  return { uniforms, update };
}

export const boundaryGLSL = /* glsl */ `
uniform vec4 uBoundary;
uniform vec2 uBoundarySize;
uniform vec3 uBoundaryPointer;
uniform float uBoundaryGap;
float boundaryHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float boundaryNoise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(boundaryHash(i),boundaryHash(i+vec2(1.,0.)),f.x),
    mix(boundaryHash(i+vec2(0.,1.)),boundaryHash(i+1.),f.x),f.y);
}
float boundaryCurve(float x){
  float envelope=sin(3.14159265*x);
  float rest=.91-x*.82+sin(x*11.-.7)*.037+sin(x*22.+.9)*.01*envelope;
  float drift=sin(x*12.+uBoundary.x*.33)*.012*envelope;
  return mix(rest+drift+uBoundary.z*.022*envelope,uBoundary.w,uBoundary.y);
}
float starBoundaryCurve(float x){
  float px=x*uBoundarySize.x, base=boundaryCurve(x)*uBoundarySize.y;
  float presence=1.-min(1.,uBoundary.y/.82);
  float ripple=(sin(px*.06+uBoundary.x*1.4)*3.+sin(px*.17-uBoundary.x*.8)*1.1)*presence;
  vec2 delta=(vec2(px,base)-uBoundaryPointer.xy*uBoundarySize)/vec2(105.,135.);
  float local=exp(-dot(delta,delta))*uBoundaryPointer.z;
  float offset=clamp((uBoundaryPointer.y*uBoundarySize.y-base)/45.,-10.,10.);
  float e=exp(2.*offset);
  float push=local*((e-1.)/(e+1.))*24.*presence;
  return (base+ripple+push)/uBoundarySize.y;
}
// Coverage and narrow image softening follow the same two moving seams.
vec3 boundaryField(vec2 uv){
  vec2 q=vec2(uv.x,1.-uv.y);
  float aspect=uBoundarySize.x/uBoundarySize.y;
  float left=max(0.,q.x-8./512.),right=min(1.,q.x+8./512.);
  float slope=(starBoundaryCurve(right)-starBoundaryCurve(left))/(right-left)/aspect;
  float normalScale=sqrt(1.+slope*slope);
  float dy=q.y-starBoundaryCurve(q.x);
  float distance=dy/normalScale;
  // Use the nearest edge, never add blur strengths as the two bands merge.
  float nearest=min(abs(dy-uBoundaryGap),abs(dy+uBoundaryGap))*uBoundarySize.y/normalScale;
  float coverage=smoothstep(-8.,8.,distance*uBoundarySize.y);
  float frost=(1.-smoothstep(3.,20.,nearest))*(1.-smoothstep(.65,1.,uBoundary.y));
  return vec3(coverage,frost,distance);
}
// 在原始场景纹理上采样柔化；雾带外直接返回原图，作品和技能主体保持清晰。
vec4 boundarySample(sampler2D frame,vec2 uv,vec2 screenUv,float frost){
  // Compute texture gradients before the per-pixel frosting branch. Explicit
  // gradients also keep the sharp path stable on ANGLE/D3D shader compilers.
  vec2 dx=dFdx(uv), dy=dFdy(uv);
  vec4 original=textureGrad(frame,uv,dx,dy);
  if(frost<.002)return original;
  vec2 p=screenUv*uBoundarySize;
  vec2 flow=vec2(boundaryNoise(p*.006+uBoundary.x*.025),boundaryNoise(p*.006-7.-uBoundary.x*.02))-.5;
  vec2 blur=vec2(7.)*frost/uBoundarySize;
  vec2 center=uv+flow*blur*.65;
  // 黄金角采样并按像素旋转，避免大模糊半径产生多重边缘；种子不随时间闪烁。
  float angle=boundaryHash(floor(p))*6.2831853;
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
  float grain=boundaryHash(floor(uv*uBoundarySize))-.5;
  return color+vec3(grain*.022*frost);
}
`;
