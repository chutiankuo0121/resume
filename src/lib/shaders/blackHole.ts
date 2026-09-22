// 黑洞的真实点层：缓慢正弦流动 + 鼠标附近排斥。
export const holePointVertex = /* glsl */ `
attribute float aSize;
attribute float aIntensity;
uniform float uTime;
uniform float uPixelRatio;
uniform vec2 uPointer;
uniform float uPointerWeight;
uniform float uHoleScale;
uniform vec2 uHoleCenter;
varying float vIntensity;
void main(){
  vec3 p=position;
  p.x+=sin(uTime*1.5+position.y*6.)/24.;
  p.y+=cos(uTime*1.5+position.x*6.)/24.;
  vec2 mouse=p.xy-uPointer*vec2(.75,-.75)*uPointerWeight;
  float distanceToMouse=length(mouse);
  float influence=1.-smoothstep(0.,.62,distanceToMouse);
  p.xy+=mouse/max(distanceToMouse,.001)*influence*.16*uPointerWeight;
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mv;
  // 点与雾场共用推进中心和倍率，保持空间关系；直接重绘点，避免放大贴图变糊。
  vec2 center=(uHoleCenter*2.-1.)*gl_Position.w;
  gl_Position.xy=center+(gl_Position.xy-center)*uHoleScale;
  gl_PointSize=clamp(aSize*uPixelRatio*(3.333/-mv.z),.7,2.8*uPixelRatio)*uHoleScale;
  vIntensity=aIntensity;
}
`;
export const holePointFragment = /* glsl */ `
varying float vIntensity;
void main(){
  float distanceToCenter=length(gl_PointCoord-.5);
  if(distanceToCenter>.399)discard;
  // 低透明度小圆点参与后续雾气场，既影响亮度，也影响覆盖。
  float alpha=.31*(1.-distanceToCenter*2.);
  gl_FragColor=vec4(vec3(vIntensity),alpha);
}
`;

export const transitionFragment = /* glsl */ `
uniform sampler2D uCrystal;
uniform sampler2D uParticles;
uniform vec2 uResolution;
uniform vec2 uHoleCenter;
uniform float uTime;
uniform float uHoleScale;
uniform float uHoleApproach;
uniform float uCrystalReveal;
varying vec2 vUv;
float hash21(vec2 p){
  p=fract(p*vec2(233.34,851.73));
  p+=dot(p,p+23.45);
  return fract(p.x*p.y);
}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  vec2 u=f*f*f*(f*(f*6.-15.)+10.);
  float a=hash21(i),b=hash21(i+vec2(1.,0.));
  float c=hash21(i+vec2(0.,1.)),d=hash21(i+1.);
  return a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y;
}
float fbm(vec2 p){
  float value=0.,amplitude=1.5;
  for(int i=0;i<5;i++){
    value+=amplitude*noise(p);
    p*=2.;amplitude*=.5;
  }
  return value*.5+.5;
}
// 14 层内缘控制覆盖，7 层外场控制亮度；立方层距产生层叠褶皱。
vec4 fogField(vec2 uv,vec2 center,float time,vec4 particles,vec4 particlesWide){
  float n=fbm(uv*1.3+time*.042);
  n+=fbm(uv*2.-time*.15)*1.6335;
  n+=fbm(uv*5.+time*.1)*2.;
  float radius=.01+n*.025;
  float dist=length(uv-center);
  vec4 inner=vec4(1.),outer=vec4(1.);
  for(int i=0;i<14;i++){
    float f=float(i),offset=.00025*f*f*f;
    float falloff=1.-smoothstep(radius+offset-.1,radius+offset+.1,dist);
    inner-=vec4(0.,0.,0.,1.)*falloff/pow(f+1.,1.2);
  }
  for(int i=0;i<7;i++){
    float f=float(i),offset=.075*f*f*f;
    float falloff=1.-smoothstep(radius+offset-.1,radius+offset+.1,dist);
    outer-=vec4(falloff/pow(f+1.,1.2));
  }
  vec4 folds=(1.-clamp(outer,0.,1.))*clamp(inner,0.,1.)+inner/3.;
  vec4 particleMix=mix(1.-particlesWide,particles,.5)*inner;
  vec4 particleOffset=particles-dist*.5;
  float movingNoise=fbm(uv*outer.r*12.+time*.22)*.5+.5;
  vec4 field=particles*folds+folds+particleMix+particleOffset;
  vec4 fade=particlesWide/6.-dist*2.;
  return clamp(field*movingNoise-fade-1.2,.01,.99);
}
vec4 readHoleParticles(vec2 uv){
  // 缩小后部分采样坐标落在纹理外；返回透明，避免边界像素被拉成长直线。
  vec2 inside=step(vec2(0.),uv)*step(uv,vec2(1.));
  return texture2D(uParticles,uv)*inside.x*inside.y;
}
void main(){
  vec3 color=vec3(0.);
  if(uCrystalReveal>0.){
    // 入洞结束后的黑场中才切换场景，晶石从黑色显露，不与洞缘混合。
    color=texture2D(uCrystal,vUv).rgb*uCrystalReveal;
  }else if(uHoleApproach<1.){
    vec2 metric=uResolution/min(uResolution.x,uResolution.y);
    // 在连续雾场内推近，褶皱随洞口向外展开；按短边度量，圆形不会拉伸。
    vec2 sourceUv=uHoleCenter+(vUv-uHoleCenter)/uHoleScale;
    vec2 uv=.5+(sourceUv-vec2(.5,.505))*metric*.51;
    vec2 center=.5+(uHoleCenter-vec2(.5,.505))*metric*.51;
    // 加载时缩小同一个雾场，并按相同坐标采样原尺寸粒子层。
    // 小于一像素的粒子由纹理插值保留，避免重绘时被 GPU 强制放大成密集粗点。
    vec2 particleUv=uHoleScale<1.?sourceUv:vUv;
    vec4 dust=readHoleParticles(particleUv);
    vec4 dustWide=readHoleParticles(particleUv*.9);
    vec4 fog=fogField(uv,center,uTime,dust,dustWide);
    color=fog.rgb*fog.a;
  }
  gl_FragColor=vec4(color,1.);
}
`;
