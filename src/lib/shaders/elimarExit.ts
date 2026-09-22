export const paperFragment = /* glsl */ `
uniform sampler2D uScene;
uniform float uReveal;
varying vec2 vUv;
void main(){
  // 原站先让相机离开对象，再淡出整个章节，露出下方浅色页面。
  vec3 scene=texture2D(uScene,vUv).rgb;
  gl_FragColor=vec4(mix(scene,vec3(1.),uReveal),1.);
}
`;
