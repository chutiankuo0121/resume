import * as THREE from "three";

export const PAPER = "#f2eddf";
const vertex = /* glsl */ `
varying vec3 vWorld, vNormal;
#include <fog_pars_vertex>
void main(){
  vec4 world=modelMatrix*vec4(position,1.);
  vWorld=world.xyz; vNormal=normalize(mat3(modelMatrix)*normal);
  vec4 mvPosition=viewMatrix*world;
  gl_Position=projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const fragment = /* glsl */ `
uniform vec3 uPaper,uColor,uInk;
uniform float uAccent,uTerrain;
varying vec3 vWorld,vNormal;
#include <fog_pars_fragment>
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float stroke(float v,float width){
  float a=max(fwidth(v),.035);
  return 1.-smoothstep(width,width+a,abs(fract(v)-.5));
}
void main(){
  vec3 n=normalize(vNormal);
  float light=dot(n,normalize(vec3(-.6,1.,.4)))*.5+.5;
  float shade=1.-light;
  float wobble=sin(vWorld.x*7.+vWorld.y*10.)*.07;
  float hatch=stroke((vWorld.x+vWorld.z*.65+vWorld.y*.85)*7.+wobble,.045);
  float crosshatch=stroke((vWorld.x-vWorld.z*.6+vWorld.y)*8.,.03);
  float grain=hash(gl_FragCoord.xy)*.025;
  vec3 pigment=mix(uPaper,uColor,.11+uAccent*.4);
  vec3 color=mix(pigment,uInk,shade*.2+grain);
  color=mix(color,uInk,hatch*smoothstep(.12,.65,shade)*.35);
  color=mix(color,uInk,crosshatch*smoothstep(.45,.8,shade)*.18);
  if(uTerrain>.5){
    float contour=stroke(vWorld.y*1.5,.018)*smoothstep(.5,1.4,vWorld.y);
    color=mix(color,uInk,contour*.14);
    float edge=length(vWorld.xz/vec2(37.,24.));
    color=mix(color,uPaper,smoothstep(.76,1.03,edge));
  }
  gl_FragColor=vec4(color,1.);
  #include <fog_fragment>
  #include <colorspace_fragment>
}`;

export function paperMaterial(color = "#b7b39b", terrain = false) {
  return new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uPaper: { value: new THREE.Color(PAPER) }, uColor: { value: new THREE.Color(color) },
      uInk: { value: new THREE.Color("#554f40") }, uAccent: { value: 0 }, uTerrain: { value: Number(terrain) } },
  });
}

export function pencilMaterial(opacity = .25, color = "#665e49") {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
}
