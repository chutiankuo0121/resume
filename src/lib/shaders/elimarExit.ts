import { portalLightGLSL } from "./portalLight";
import { pictureDetailGLSL } from "./pictureDetail";

/** 圆形传送门：alpha 揭开真实 DOM；同一个场输出 HDR 亮边供独立 Bloom 使用。 */
export const paperFragment = /* glsl */ `
uniform sampler2D uScene, uArrival, uArrivalText;
uniform vec4 uArrivalRect;
uniform float uArrivalReady;
uniform vec3 uGhostWake[6];
uniform float uReveal;
uniform float uBlackout;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uCenter;
uniform vec3 uPointer;
uniform vec2 uViewport;
uniform float uFlow;
varying vec2 vUv;
${portalLightGLSL}
${pictureDetailGLSL}
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
  float distanceToRim=length(q)-radius+broad*.105+fine*.025*(1.+uFlow*.3);
  // Radial form of the collage seam's 105/135px local influence and 24px
  // displacement. One field controls coverage AND emission, keeping them aligned.
  vec2 normal=q/max(length(q),.0001);
  vec2 tangent=vec2(-normal.y,normal.x);
  vec2 delta=(vUv-uPointer.xy)*metric*uViewport.y;
  float along=dot(delta,tangent)/105.;
  float across=dot(delta,normal)/135.;
  float proximity=exp(-along*along-across*across)*uPointer.z;
  float offset=clamp((distanceToRim*uViewport.y-dot(delta,normal))/45.,-5.,5.);
  float e=exp(2.*offset);
  distanceToRim-=proximity*((e-1.)/(e+1.))*24./uViewport.y;
  // Backward sampling repels the star field around the cursor without moving
  // the hole's centre or the scene behind it.
  float repel=exp(-dot(delta,delta)/6500.)*uPointer.z;
  vec2 dustUV=vUv-delta/max(length(delta),1.)*repel*20./uViewport;
  float aa=max(fwidth(distanceToRim)*1.25,1.2/uResolution.y);
  float coverage=smoothstep(-aa,aa,distanceToRim);
  float envelope=smoothstep(0.,.075,uReveal)*(1.-smoothstep(.88,1.,uReveal));
  float band=exp(-abs(distanceToRim)*40.)*envelope;
  vec2 sceneUV=uCenter+(vUv-uCenter)*(1.+uReveal*.065);
  vec3 original=texture2D(uScene,clamp(sceneUV,0.,1.)).rgb;
  vec3 scene=original*(1.-uBlackout);
  float luma=dot(scene,vec3(.299,.587,.114));
  float contours=min(fwidth(luma)*9.,2.);
  float dust=stars(dustUV,11.)+stars(dustUV+vec2(uTime*.001,-uTime*.0015),29.)*1.5;
  vec3 emission=portalLight(distanceToRim,envelope,dustUV,q,contours);
  // 圆周外侧变成暗色碎屑，亮线保留晶石本身的细节；洞内透出真实经历内容。
  vec3 surface=mix(scene,vec3(.018)+vec3(min(contours,.65))*.3,band*.9);
  float particleAlpha=clamp(band*dust*.72,0.,.85);
  float alpha=max(coverage,particleAlpha);
  #ifndef PORTAL_GLOW
    // Extract BEFORE blackout: fading the surface must not erase its detail field.
    vec2 pixel=vec2(vUv.x,1.-vUv.y)*uViewport;
    vec2 arrivalUV=(pixel-uArrivalRect.xy)/uArrivalRect.zw;
    vec3 arriving=texture2D(uArrival,clamp(vec2(arrivalUV.x,1.-arrivalUV.y),0.,1.)).rgb;
    float arrivalDetail=pictureDetails(arriving);
    vec2 margin=min(arrivalUV,1.-arrivalUV)*uArrivalRect.zw;
    float valid=smoothstep(0.,5.,min(margin.x,margin.y))*uArrivalReady;
    float textDetail=pictureDetails(texture2D(uArrivalText,vUv).rgb);
    // Each side owns its source: career content must never leak onto the crystal.
    float outgoingDetail=pictureDetails(original)*.5;
    float incomingDetail=max(arrivalDetail*valid*.5,textDetail*.6);
    float hover=0.;
    for(int i=0;i<6;i++){
      vec2 mouseDelta=(vUv-uGhostWake[i].xy)*uViewport/105.;
      hover=max(hover,exp(-dot(mouseDelta,mouseDelta))*uGhostWake[i].z*(1.-float(i)*.12));
    }
    float distancePx=abs(distanceToRim)*uViewport.y;
    float detailBand=(1.-smoothstep(28.,150.,distancePx))*smoothstep(2.,10.,distancePx);
    float weight=min(1.6,1.+hover*.9)*detailBand*envelope;
    float outgoingGhost=pictureGhostEmission(outgoingDetail,vUv,uViewport,uTime)*weight;
    float incomingGhost=pictureGhostEmission(incomingDetail,vUv,uViewport,uTime)*weight;
    surface+=vec3(.9,.96,1.)*outgoingGhost*.8*coverage;
    // On the white DOM side a silver contour has contrast without obscuring text.
    float ghostAlpha=clamp(incomingGhost*.38,0.,.38)*(1.-coverage);
    float combined=alpha+ghostAlpha*(1.-alpha);
    surface=(surface*alpha+vec3(.24,.31,.38)*ghostAlpha*(1.-alpha))/max(combined,.0001);
    alpha=combined;
  #endif
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
