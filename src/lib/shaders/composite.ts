import { simplex } from "./noise";

export const fullscreenVertex = /* glsl */ `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}
`;

// 两次一维七点模糊，等价于 7×7 方框核，只需 14 次采样。
export const blurFragment = /* glsl */ `
uniform sampler2D uInput;
uniform vec2 uStep;
varying vec2 vUv;
void main(){
  vec4 color=vec4(0.);
  for(int i=-3;i<=3;i++)color+=texture2D(uInput,vUv+float(i)*uStep);
  gl_FragColor=color/7.;
}
`;

/** 雾气与圆核粒子的加法/乘法合成，不对点层再做 Bloom。 */
export const particleComposite = /* glsl */ `
float composeParticles(float background,vec4 soft,float point,float formReveal){
  // 点层的中性灰是 #555555 转到线性数值后的值，先反解背景再合成。
  const float neutral=.09084171;
  float bg=max((background/(.1+2.25*neutral)-neutral)/4.,0.);

  // 柔雾 RGB 已预乘透明度，不能再次乘 alpha，否则边缘会变黑。
  float under=bg*(1.-soft.a*formReveal)+soft.r*formReveal;

  // 先叠加轮廓，再让点亮度参与乘法：圆核明亮，点之间仍能看到柔雾。
  float added=max(point+under*4.,under*4.);
  float luminance=mix(added,added*point*2.5,.9);
  // 平滑压缩高光，保留超亮粒子间的层次；背景与暗点不压缩。
  if(point>neutral+.001){
    const float knee=.72;
    float excess=max(luminance-knee,0.);
    luminance=min(luminance,knee)+(1.-knee)*(1.-exp(-excess/(1.-knee)));
  }
  return clamp(luminance,0.,1.);
}
`;

export const compositeFragment = /* glsl */ `
uniform sampler2D uSoft;
uniform sampler2D uSharp;
uniform float uBoundary;
uniform mat3 uAtmosphereMap;
uniform float uLightReveal;
uniform float uFormReveal;
varying vec2 vUv;
${simplex}
${particleComposite}
void main(){
  vec2 uv=vUv;
  // 雾光固定在场景平面；镜头与鼠标改变投影，明暗分界随空间一起移动。
  vec3 projected=uAtmosphereMap*vec3(uv*2.-1.,1.);
  vec2 atmosphereUv=(projected.xy/max(projected.z,.0001))*.5+.5;
  float cloud=snoise(vec3(atmosphereUv*4.8,1.8))*.008;
  float boundary=uBoundary+cloud+.012*sin(atmosphereUv.y*5.);
  // 亮白平台、宽半影、长灰尾共同形成左亮右暗的自然衰减。
  float distance=max(atmosphereUv.x-boundary+.11,0.);
  float white=exp(-pow(distance/.145,1.65));
  float tail=.05*exp(-max(atmosphereUv.x-boundary+.03,0.)/.42);
  float background=min(white+tail,1.)*mix(.16,1.,uLightReveal);
  #ifdef ELIMAR_EXIT
  // 擦过后雾光平面可能来到相机身后，不能再采到反向投影的亮面。
  if(projected.z<=0.)background=0.;
  #endif
  float luminance=composeParticles(background,texture2D(uSoft,uv),texture2D(uSharp,uv).r,mix(.15,1.,uFormReveal));
  // 本合成链直接输出显示域灰度，不再做 gamma 或色调映射。
  gl_FragColor=vec4(vec3(clamp(luminance,0.,1.)),1.);
}
`;
