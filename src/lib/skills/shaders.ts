import { simplex } from "../shaders/noise";
import { particleFragment } from "../shaders/particleKernel";
import { paletteGLSL } from "./palette";

export const screenVertex = /* glsl */ `
attribute vec3 aCell;
attribute float aSeed;
attribute float aAlpha;
uniform float uTime;
uniform float uReveal;
uniform mat4 uProjection;
uniform sampler2D uPointerField;
varying vec3 vNormal;
varying vec4 vProjected;
varying vec2 vGridUv;
varying float vAlpha;
varying float vGrowth;
varying vec3 vWorld;
${simplex}
void main(){
  vGridUv=vec2(aCell.x/7.+.5,aCell.y/4.6+.5);
  // 原站的交互平面比方块阵列大 1.5 倍；局部场与视口明暗场不是同一张图。
  float touch=texture2D(uPointerField,(vGridUv+.25)/1.5).r;
  float radius=length(aCell.xy);
  float growth=clamp(uReveal*5.75-radius*(1.35/.2)*uReveal/5.75,0.,1.05);
  float edge=1.-smoothstep(.1767,.3667,length(vGridUv-.5));
  float noise=snoise(vec3(aCell.xy*.28,uTime*.05));
  vec2 ringUv=(vGridUv-.5)*vec2(35./23.,1.);
  float ring=(1.-abs(sin(length(ringUv)*5.-.5-uTime)))*smoothstep(.05,.65,length(ringUv));
  vec3 local=position*(1.-touch*.05)*(1.-ring*.1)*growth;
  vec4 p=instanceMatrix*vec4(local,1.);
  // 按原站的方块间距换算世界单位，统一位移各深度层，不给后层额外夸张拉伸。
  p.z+=touch*(15.*.2/1.35)+ring*(3.*.2/1.35);
  p.z+=noise*.18*(1.-edge)+(1.-uReveal)*.9;
  p.xy+=vec2(sin(aSeed*94.),cos(aSeed*73.))*(1.-uReveal)*.22;
  vec4 world=modelMatrix*p;
  vWorld=world.xyz;
  vNormal=normalize(mat3(modelMatrix)*normal);
  vProjected=uProjection*world;
  vAlpha=aAlpha+edge*.1;
  vGrowth=smoothstep(0.,.08,growth);
  gl_Position=projectionMatrix*viewMatrix*world;
}
`;

export const screenFragment = /* glsl */ `
${paletteGLSL}
uniform sampler2D uImage;
uniform sampler2D uSurfaceField;
uniform vec2 uResolution;
uniform vec3 uLight;
uniform float uOpacity;
varying vec3 vNormal;
varying vec4 vProjected;
varying vec2 vGridUv;
varying float vAlpha;
varying float vGrowth;
varying vec3 vWorld;
void main(){
  // 图片由独立投影光映到方块上，移动方块会穿过图像，而不是把图像一起撑大。
  vec2 uv=vProjected.xy/vProjected.w*.5+.5;
  float inBeam=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.)*step(0.,vProjected.w);
  vec3 source=texture2D(uImage,clamp(uv,0.,1.)).rgb;
  vec3 photo=paletteColor(dot(source,vec3(.2126,.7152,.0722)))*inBeam;
  float mouse=texture2D(uSurfaceField,gl_FragCoord.xy/uResolution).r;
  vec3 n=normalize(vNormal),l=normalize(uLight-vWorld);
  float diffuse=max(0.,dot(n,l));
  float fill=max(0.,dot(n,normalize(vec3(-.6,.8,1.))));
  vec3 color=uShadow*.7+uTone*(.035+fill*.12)+photo*(.22+diffuse*1.65);
  // 原站鼠标所在区域提高透明层的覆盖率，同时压暗；不是刷一层白色。
  color*=1.-mouse*.35;
  float boundary=smoothstep(0.,.06,min(min(vGridUv.x,1.-vGridUv.x),min(vGridUv.y,1.-vGridUv.y)));
  float alpha=clamp(vAlpha+mouse*.5,0.,.92)*boundary*uOpacity*vGrowth;
  if(alpha<.003)discard;
  gl_FragColor=vec4(color,alpha);
  #include <colorspace_fragment>
}
`;
/** 沿用晶石的紧实圆核，空间点在连续噪声场中漂移，不吸附在图像表面。 */
export const moteVertex = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uPixelRatio;
varying float vLight;
varying float vFade;
varying float vVisibility;
${simplex}
void main(){
  vec3 p=position;
  vec3 q=position*.16+uTime*.035;
  p+=vec3(snoise(q),snoise(q+8.3),snoise(q+19.7))*.28;
  vec4 view=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*view;
  gl_PointSize=clamp((.7+aSeed*2.8)*uPixelRatio*8./max(2.,-view.z),1.,7.*uPixelRatio);
  vLight=mix(.18,.75,aSeed);
  vFade=(.1+aSeed*.33)*smoothstep(.2,1.,-view.z);
  vVisibility=1.;
}
`;
export { particleFragment as moteFragment };
