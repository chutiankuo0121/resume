import { simplex } from "./noise";

/** 可复用的粒子核：连续噪声、深度遮挡、尺寸与显现；当前由晶石调用。 */
export const particleKernel = /* glsl */ `
attribute float aLight;
attribute float aSize;
attribute float aAmbient;
uniform float uTime;
uniform float uPixelRatio;
uniform float uViewportScale;
uniform float uMotionDepthOffset;
uniform float uEntry;
uniform sampler2D uModelDepth;
uniform sampler2D uModelCoverage;
uniform vec2 uDepthSize;
uniform vec2 uCameraClip;
varying float vLight;
varying float vFade;
varying float vVisibility;
${simplex}
// 用未模糊模型的深度挡住背面粒子；边界采用柔和的可见性变化。
float modelVisibilityTap(vec2 uv,float pointDepth){
  float depth=texture2D(uModelDepth,uv).r;
  float near=uCameraClip.x,far=uCameraClip.y;
  float modelDepth=near*far/(far-depth*(far-near));
  float hidden=smoothstep(.020,.055,pointDepth-modelDepth);
  float coverage=texture2D(uModelCoverage,uv).a;
  return 1.-hidden*coverage;
}
float modelVisibility(vec4 clip){
  if(clip.w<=uCameraClip.x)return 1.;
  vec2 uv=clip.xy/clip.w*.5+.5;
  if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return 1.;
  // 插值四个邻点的可见性，不能直接插值前后表面的深度。
  vec2 pixel=uv*uDepthSize-.5;
  vec2 base=(floor(pixel)+.5)/uDepthSize;
  vec2 f=fract(pixel),stepUV=1./uDepthSize;
  float a=modelVisibilityTap(base,clip.w);
  float b=modelVisibilityTap(base+vec2(stepUV.x,0.),clip.w);
  float c=modelVisibilityTap(base+vec2(0.,stepUV.y),clip.w);
  float d=modelVisibilityTap(base+stepUV,clip.w);
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
void drawParticle(vec3 rest,vec3 p){
  bool ambient=aAmbient>.5;
  vec4 view=modelViewMatrix*vec4(p,1.);
  vec4 surfaceClip=projectionMatrix*view;
  // 世界尺寸按 2 倍映射到噪声场；时间仍以秒计。
  const float worldScale=2.;
  // 离运动平面越远，扰动越强；该值全程存在，入场后也不会归零。
  float distanceEffect=clamp(
    abs(view.z+uMotionDepthOffset)*worldScale/1511.,.0001,120.);
  vec3 t=vec3(uTime*.045);
  vec3 q=rest*worldScale;
  // 低频决定成簇漂移，中高频补充局部聚散；不要给每个点独立抖动。
  vec3 large=.5*vec3(
    snoise(q*2.8010136+t*vec3(1.,.7,.3)),
    snoise(q*2.8010136+t*vec3(.3,1.,.7)),
    snoise(q*2.8010136+t*vec3(.7,.3,1.)));
  vec3 medium=.3*vec3(
    snoise(q*3.301+t*vec3(1.2,.5,.8)),
    snoise(q*3.301+t*vec3(.8,1.2,.5)),
    snoise(q*3.301+t*vec3(.5,.8,1.2)));
  vec3 small=.2*vec3(
    snoise(q*4.54+t*vec3(1.5,.9,.4)),
    snoise(q*4.54+t*vec3(.4,1.5,.9)),
    snoise(q*4.54+t*vec3(.9,.4,1.5)));
  // 三档场叠加后乘深度强度，形成连续的粘稠运动，而不是物理流体。
  p+=(large+medium*distanceEffect+small)*distanceEffect*(251./worldScale);
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mv;
  vVisibility=modelVisibility(ambient?gl_Position:surfaceClip);
  float modulation=1.+dot(large+medium+small,vec3(1.))*.2/9.;
  // 尺寸单位为 CSS 像素；DPR 只提高分辨率，不改变视觉覆盖。
  float size=(aSize/128.)*modulation*(300./max(-mv.z*worldScale,.08)+26.);
  gl_PointSize=clamp(size*uPixelRatio*uViewportScale,1.,48.*uPixelRatio);
  float nearFade=smoothstep(.10,.40,-mv.z);
  // 先显现柔雾，再逐渐露出清晰圆核；空间点始终在场。
  float reveal=ambient?1.:smoothstep(.1,.48,uEntry);
  vFade=nearFade*reveal;
  vLight=aLight;
}
`;
export const particleFragment = /* glsl */ `
varying float vLight;
varying float vFade;
varying float vVisibility;
void main(){
  // 紧实圆核 + 约一像素的抗锯齿边缘，不叠加发光光晕。
  float radius=length(gl_PointCoord*2.-1.);
  float edge=min(fwidth(radius),.25);
  float alpha=1.-smoothstep(.78-edge*.5,.78+edge*.5,radius);
  float opacity=alpha*vFade*vVisibility;
  if(opacity<=.001)discard;
  float light=vLight*1.5;
  gl_FragColor=vec4(vec3(light),opacity);
}
`;
