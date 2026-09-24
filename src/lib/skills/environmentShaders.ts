import { simplex } from "../shaders/noise";
import { paletteGLSL } from "./palette";

export const textureVertex = /* glsl */ `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}
`;

/** 参考原站 sky pass：六层 FBM 连续扭曲三次，再做反射混合与反相。
 * 只在小纹理中计算；主画面和水中天空共用这一份动态结果。 */
export const cloudFragment = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,4.1414)))*43758.5453);}
float noise(vec2 p){
  vec2 cell=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  float n=mix(mix(hash(cell),hash(cell+vec2(1.,0.)),f.x),
    mix(hash(cell+vec2(0.,1.)),hash(cell+1.),f.x),f.y);
  return n*n;
}
float fbm(vec2 p){
  mat2 turn=mat2(.8,.6,-.6,.8);
  float t=uTime*.05;
  float n=.5*noise(p-t);
  p=turn*p*2.02;n+=.03125*noise(p);
  p=turn*p*2.01;n+=.25*noise(p);
  p=turn*p*2.03;n+=.125*noise(p);
  p=turn*p*2.01;n+=.0625*noise(p-t*5.);
  p=turn*p*2.04;n+=.015625*noise(p+t*5.);
  return n/.96875;
}
void main(){
  vec2 p=vUv*vec2(6.,4.);
  float a=fbm(p),b=fbm(p+a),n=fbm(p+b);
  float reflected=min(1.,.4*.4/max(.015,1.-n));
  float light=clamp(.9-((mix(.4,reflected,.5)-.5)*2.+.5)*2.,0.,1.);
  gl_FragColor=vec4(vec3(light),1.);
}
`;

export const skyVertex = /* glsl */ `
varying vec3 vWorld;
void main(){
  vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;
  gl_Position=projectionMatrix*viewMatrix*world;
}
`;

// 主视角与镜面视角都按世界方向读取雾层，反射中不会出现固定在屏幕上的贴纸。
export const skyFragment = /* glsl */ `
${paletteGLSL}
uniform sampler2D uClouds;
varying vec3 vWorld;
void main(){
  vec3 ray=normalize(vWorld-cameraPosition);
  vec2 uv=vec2(atan(ray.x,-ray.z)/6.2831853+.5,asin(clamp(ray.y,-1.,1.))/3.1415927+.5);
  float cloud=texture2D(uClouds,uv*vec2(2.,1.4)+vec2(.17,.11)).r;
  float veil=texture2D(uClouds,uv*vec2(1.5,1.)+vec2(.48,.07)).r;
  float split=smoothstep(-.55,.5,ray.x+(veil-.5)*.055);
  // 侧向光保留暗部留白，云层有深浅起伏，避免整屏被同一种颜色铺平。
  float base=mix(.003,.8,pow(split,1.65));
  float overhead=smoothstep(-.03,.32,ray.y);
  float folds=pow(smoothstep(.15,.68,1.-cloud*.85-veil*.15),1.4);
  float cloudLight=mix(base*.045,base*.85+.13,folds);
  float light=mix(base,cloudLight,overhead*.95);
  light+=exp(-pow((ray.y+.06)*5.,2.))*.026;
  gl_FragColor=vec4(paletteColor(light),1.);
  #include <colorspace_fragment>
}
`;

export const waterVertex = /* glsl */ `
uniform mat4 textureMatrix;
varying vec4 vReflection;
varying vec3 vWorld;
void main(){
  vReflection=textureMatrix*vec4(position,1.);
  vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;
  gl_Position=projectionMatrix*viewMatrix*world;
}
`;

/** 真实镜面渲染 → 法线扰动 → 小范围模糊 → Fresnel → 远处雾化。
 * 波纹使用世界坐标，镜头移动时水面不会跟着屏幕滑动。 */
export const waterFragment = /* glsl */ `
${paletteGLSL}
uniform sampler2D tDiffuse;
uniform vec2 uTexel;
uniform float uTime;
varying vec4 vReflection;
varying vec3 vWorld;
${simplex}
float waveWeight(vec2 dx,vec2 dy,vec2 frequency){
  float footprint=max(length(dx*frequency),length(dy*frequency));
  return 1.-smoothstep(.25,.75,footprint);
}
float heightAt(vec2 p,vec2 weights){
  vec2 drift=vec2(uTime*.035,-uTime*.024);
  return snoise(vec3(p*vec2(2.5,6.)+drift,0.))*.055*weights.x
    +snoise(vec3(p*vec2(8.,14.)-drift*1.7,4.))*.014*weights.y;
}
vec3 reflected(vec2 uv,vec2 blur){
  vec3 c=texture2D(tDiffuse,clamp(uv,.002,.998)).rgb*.4;
  c+=texture2D(tDiffuse,clamp(uv+vec2(blur.x,0.),.002,.998)).rgb*.15;
  c+=texture2D(tDiffuse,clamp(uv-vec2(blur.x,0.),.002,.998)).rgb*.15;
  c+=texture2D(tDiffuse,clamp(uv+vec2(0.,blur.y),.002,.998)).rgb*.15;
  c+=texture2D(tDiffuse,clamp(uv-vec2(0.,blur.y),.002,.998)).rgb*.15;
  return c;
}
void main(){
  float distanceToEye=length(vWorld.xz-cameraPosition.xz);
  vec2 p=vWorld.xz;
  // 根据真实像素覆盖分别过滤两层波纹；只按距离减幅仍会留下亚像素闪点。
  vec2 dx=dFdx(p),dy=dFdy(p);
  vec2 weights=vec2(waveWeight(dx,dy,vec2(2.5,6.)),waveWeight(dx,dy,vec2(8.,14.)));
  float h=heightAt(p,weights),stepSize=.025;
  vec2 slope=vec2(heightAt(p+vec2(stepSize,0.),weights)-h,heightAt(p+vec2(0.,stepSize),weights)-h)/stepSize;
  // 保留远处更平静的水面；所有法线采样使用同一组权重，避免过滤本身产生波纹。
  slope*=1.-smoothstep(8.,35.,distanceToEye)*.8;
  vec3 normal=normalize(vec3(-slope.x,1.,-slope.y));
  vec3 coord=vReflection.xyz/vReflection.w;
  vec2 uv=coord.xy+coord.z*normal.xz*.024;
  vec3 reflection=reflected(uv,uTexel*vec2(2.8,1.2));
  vec3 toEye=normalize(cameraPosition-vWorld);
  float fresnel=.97+.03*pow(1.-max(0.,dot(toEye,normal)),5.);
  float ripples=smoothstep(.05,.85,dot(normal,normalize(vec3(-.6,1.,.4))));
  vec3 color=reflection*fresnel*.86+uShadow*.3+uTone*(.012+ripples*.025);
  // 柔化地平线和几何边缘，保留近景清晰的水纹与图像倒影。
  float fog=1.-smoothstep(9.,35.,distanceToEye);
  gl_FragColor=vec4(color,fog*.92);
  #include <colorspace_fragment>
}
`;
