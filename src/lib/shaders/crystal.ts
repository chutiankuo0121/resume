// 网格柔雾与表面点共用刚体旋转，空间游尘不参与。局部前向轴与晶石一致。
export const crystalTransform = /* glsl */ `
uniform vec2 uLook;
uniform float uBasisYaw;
uniform mat4 uCrystalPlacement;
vec3 rotateCrystal(vec3 p){
  vec3 pivot=vec3(-0.142648969772722,2.5886050000000003,-0.6168853168249138);
  vec3 q=p-pivot;
  float restYaw=uBasisYaw;
  q.xz=mat2(cos(restYaw),sin(restYaw),-sin(restYaw),cos(restYaw))*q.xz;
  float yaw=restYaw+uLook.x*.122173;
  // 鼠标 Y 向下为正，正俯仰让晶石正面向下转动。
  float pitch=uLook.y*.05236;
  q.yz=mat2(cos(pitch),sin(pitch),-sin(pitch),cos(pitch))*q.yz;
  q.xz=mat2(cos(yaw),-sin(yaw),sin(yaw),cos(yaw))*q.xz;
  return (uCrystalPlacement*vec4(q+pivot,1.)).xyz;
}
`;

// 网格只提供柔雾明暗和深度遮挡，不直接作为实体材质画到屏幕上。
export const lightVertex = /* glsl */ `
varying vec2 vUv;
${crystalTransform}
void main(){
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(rotateCrystal(position),1.);
}
`;

// 明暗目标：红通道保存数值亮度，alpha 保存不透明表面的覆盖。
export const lightFragment = /* glsl */ `
uniform sampler2D uLighting;
varying vec2 vUv;
void main(){
  gl_FragColor=vec4(texture2D(uLighting,vUv).r,0.,0.,1.);
}
`;
