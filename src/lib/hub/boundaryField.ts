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
};

/** 视觉柔化有宽度，点击归属仍由中轴决定；粒子漂出边界不改变按钮热区。 */
export function boundaryCurve(x: number, state: BoundaryState) {
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

/** 三个 WebGL 上下文读取同一份状态，避免雾层、裁剪与高光各自漂移。 */
export function createBoundaryUniforms(state: BoundaryState) {
  const uniforms = {
    uBoundary: { value: new Vector4() },
    uBoundarySize: { value: new Vector2(1, 1) },
    uBoundaryPointer: { value: new Vector3() },
  };
  function update() {
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
// 返回技能覆盖率、磨砂强度、到曲线的有符号距离。距离按短边计，不随宽屏变扁。
vec3 boundaryField(vec2 uv){
  vec2 q=vec2(uv.x,1.-uv.y);
  float aspect=uBoundarySize.x/uBoundarySize.y;
  float slope=(boundaryCurve(q.x+.001)-boundaryCurve(q.x-.001))/.002/aspect;
  float distance=(q.y-boundaryCurve(q.x))/sqrt(1.+slope*slope);
  vec2 p=q*vec2(aspect,1.);
  float slow=uBoundary.x*.035;
  float cloud=boundaryNoise(p*3.7+vec2(slow,-slow*.6));
  cloud+=.35*boundaryNoise(p*11.2+cloud+vec2(-slow*.8,slow));
  float width=.065+.04*cloud+.014*sin(q.x*9.+.8);
  float distorted=distance+(cloud-.68)*.018;
  float coverage=smoothstep(-width,width,distorted);
  float frost=(1.-smoothstep(width*.12,width*1.55,abs(distorted)))*(1.-smoothstep(.65,1.,uBoundary.y));
  return vec3(coverage,frost,distance);
}
// 在原始场景纹理上采样柔化；雾带外直接返回原图，作品和技能主体保持清晰。
vec4 boundarySample(sampler2D frame,vec2 uv,vec2 screenUv,float frost){
  if(frost<.002)return texture2D(frame,uv);
  vec2 p=screenUv*uBoundarySize;
  vec2 flow=vec2(boundaryNoise(p*.006+uBoundary.x*.025),boundaryNoise(p*.006-7.-uBoundary.x*.02))-.5;
  vec2 blur=vec2(clamp(uBoundarySize.y*.035,14.,48.))*frost/uBoundarySize;
  vec2 center=uv+flow*blur*.65;
  // 黄金角采样并按像素旋转，避免大模糊半径产生多重边缘；种子不随时间闪烁。
  float angle=boundaryHash(floor(p))*6.2831853;
  vec4 color=vec4(0.);
  float total=0.;
  for(int i=0;i<24;i++){
    float r=sqrt((float(i)+.5)/24.);
    float a=angle+float(i)*2.3999632;
    float weight=exp(-2.*r*r);
    color+=texture2D(frame,center+vec2(cos(a),sin(a))*r*blur)*weight;
    total+=weight;
  }
  return color/total;
}
vec3 boundaryGrain(vec3 color,vec2 uv,float frost){
  float grain=boundaryHash(floor(uv*uBoundarySize))-.5;
  return color+vec3(grain*.022*frost);
}
`;
