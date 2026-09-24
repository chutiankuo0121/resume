/** 圆形传送门：alpha 揭开真实 DOM；同一个场输出 HDR 亮边供独立 Bloom 使用。 */
export const paperFragment = /* glsl */ `
uniform sampler2D uScene;
uniform float uReveal;
uniform float uBlackout;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uCenter;
varying vec2 vUv;
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),
    mix(hash21(i+vec2(0.,1.)),hash21(i+1.),f.x),f.y);
}
float field(vec2 p){
  float n=0.;float amplitude=.5;
  for(int i=0;i<4;i++){
    n+=amplitude*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+7.1;amplitude*=.5;
  }
  return n;
}
float stars(vec2 uv,float scale){
  vec2 grid=uv*uResolution/scale;
  vec2 cell=floor(grid);
  float seed=hash21(cell);
  vec2 p=fract(grid)-.5-(vec2(seed,hash21(cell+8.7))-.5)*.62;
  float blink=.2+.8*pow(.5+.5*sin(uTime*2.2+seed*31.),3.);
  float core=1.-smoothstep(.025,.11,length(p));
  float ray=(1.-smoothstep(.008,.035,min(abs(p.x),abs(p.y))))
    *(1.-smoothstep(.08,.34,max(abs(p.x),abs(p.y))))*step(.94,seed);
  return (core+ray)*blink*step(.45,seed);
}
void main(){
  if(uReveal<=0.){
    #ifdef PORTAL_GLOW
      gl_FragColor=vec4(0.);
    #else
      gl_FragColor=vec4(texture2D(uScene,vUv).rgb*(1.-uBlackout),1.);
    #endif
    return;
  }
  vec2 metric=vec2(uResolution.x/uResolution.y,1.);
  vec2 q=(vUv-uCenter)*metric;
  vec2 extent=max(uCenter,1.-uCenter)*metric;
  float radius=mix(-.11,length(extent)+.16,uReveal);
  vec2 drift=vec2(uTime*.065,-uTime*.047);
  float broad=field(q*7.+drift)-.47;
  float fine=field(q*42.-drift*2.1)-.47;
  float distanceToRim=length(q)-radius+broad*.105+fine*.025;
  float aa=max(fwidth(distanceToRim)*1.25,1.2/uResolution.y);
  float coverage=smoothstep(-aa,aa,distanceToRim);
  float envelope=smoothstep(0.,.075,uReveal)*(1.-smoothstep(.88,1.,uReveal));
  float band=exp(-abs(distanceToRim)*40.)*envelope;
  float filament=exp(-abs(distanceToRim)*230.)*envelope;
  vec2 sceneUV=uCenter+(vUv-uCenter)*(1.+uReveal*.065);
  vec3 scene=texture2D(uScene,clamp(sceneUV,0.,1.)).rgb*(1.-uBlackout);
  float luma=dot(scene,vec3(.299,.587,.114));
  float contours=min(fwidth(luma)*9.,2.);
  float dust=stars(vUv,11.)+stars(vUv+vec2(uTime*.001,-uTime*.0015),29.)*1.5;
  float breakup=smoothstep(.35,.68,field(q*95.+drift));
  vec3 emission=vec3(.9,.96,1.)*(filament*(.5+breakup*2.)+band*(dust*2.+contours*.4));
  // 圆周外侧变成暗色碎屑，亮线保留晶石本身的细节；洞内透出真实经历内容。
  vec3 surface=mix(scene,vec3(.018)+vec3(min(contours,.65))*.3,band*.9);
  float particleAlpha=clamp(band*dust*.72,0.,.85);
  float alpha=max(coverage,particleAlpha);
  if(uReveal>=1.){alpha=0.;emission=vec3(0.);}
  #ifdef PORTAL_GLOW
    gl_FragColor=vec4(emission,1.);
  #else
    gl_FragColor=vec4(surface,alpha);
  #endif
}
`;

export const portalCompositeFragment = /* glsl */ `
uniform sampler2D uFrame;
uniform sampler2D uEmission;
uniform sampler2D uBloom;
varying vec2 vUv;
void main(){
  vec4 frame=texture2D(uFrame,vUv);
  vec3 light=texture2D(uEmission,vUv).rgb+texture2D(uBloom,vUv).rgb*.65;
  float glowAlpha=1.-exp(-max(light.r,max(light.g,light.b))*.9);
  float alpha=frame.a+glowAlpha*(1.-frame.a);
  vec3 color=(frame.rgb*frame.a+light)/max(alpha,.0001);
  gl_FragColor=vec4(clamp(color,0.,1.),alpha);
}
`;
