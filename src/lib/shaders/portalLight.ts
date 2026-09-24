/** Shared by circular and horizontal reveals; distances are viewport-height units. */
export const portalLightGLSL = /* glsl */ `
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

vec3 portalLight(float distanceToRim,float envelope,vec2 uv,vec2 q,float contours){
  float band=exp(-abs(distanceToRim)*40.)*envelope;
  float filament=exp(-abs(distanceToRim)*230.)*envelope;
  vec2 drift=vec2(uTime*.065,-uTime*.047);
  float dust=stars(uv,11.)+stars(uv+vec2(uTime*.001,-uTime*.0015),29.)*1.5;
  float breakup=smoothstep(.35,.68,field(q*95.+drift));
  return vec3(.9,.96,1.)*(filament*(.5+breakup*2.)+band*(dust*2.+contours*.4));
}
`;

/** Point-sprite glints shared by the seams and opening. */
export const portalDustFragment = /* glsl */ `
      varying float vAlpha,vFlash;
      void main(){
        vec2 p=gl_PointCoord-.5;
        float radius=length(p);
        float dotShape=1.-smoothstep(.15,.48,radius);
        float glint=exp(-abs(p.x)*30.)*exp(-abs(p.y)*5.)
          +exp(-abs(p.y)*30.)*exp(-abs(p.x)*5.);
        float alpha=max(dotShape,glint*vFlash*.65)*vAlpha;
        vec3 color=vec3(.9,.96,1.)*(.5+vFlash*2.);
        gl_FragColor=vec4(color,alpha);
      }`;
