import * as THREE from "three";
import { simplex } from "../shaders/noise";
import {
  boundaryGLSL,
  createBoundaryUniforms,
  type BoundaryState,
} from "../hub/boundaryField";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}
`;
const fragmentShader = /* glsl */ `
uniform sampler2D uFrame;
uniform sampler2D uPointerField;
uniform float uTime;
uniform float uStrength;
uniform float uAspect;
varying vec2 vUv;
${simplex}
${boundaryGLSL}
void main(){
  // 截取的是已经显示为 sRGB 的主画面，先还原线性光，再只叠加鼠标附近的亮度。
  vec3 boundary=boundaryField(vUv);
  vec4 color=sRGBTransferEOTF(boundarySample(uFrame,vUv,vUv,boundary.y));
  vec2 p=vUv*vec2(uAspect,1.);
  float flow=snoise(vec3(p*2.5,uTime*.08));
  vec2 uv=vUv+vec2(flow*.004/uAspect,flow*.004);
  float brush=texture2D(uPointerField,uv).r;
  // 在最终线性画面上叠加反馈场亮度，卡片、天空和水面共享同一束柔光。
  color.rgb+=vec3(brush*uStrength);
  color.rgb=mix(color.rgb,vec3(.26),boundary.y*.08);
  gl_FragColor=vec4(boundaryGrain(color.rgb,vUv,boundary.y),boundary.x);
  #include <colorspace_fragment>
  #include <premultiplied_alpha_fragment>
}
`;

/** 最后合成柔光，避免卡片、雾和水面各自加光造成接缝或重复曝光。 */
export function createPointerLight(
  renderer: THREE.WebGLRenderer,
  field: THREE.IUniform<THREE.Texture>,
  time: THREE.IUniform<number>,
  boundaryState: BoundaryState,
) {
  let frame = new THREE.FramebufferTexture(1, 1);
  const boundary = createBoundaryUniforms(boundaryState);
  const material = new THREE.ShaderMaterial({
    name: "SkillsPointerLight",
    vertexShader,
    fragmentShader,
    premultipliedAlpha: true,
    uniforms: {
      ...boundary.uniforms,
      uFrame: { value: frame },
      uPointerField: field,
      uTime: time,
      uStrength: { value: 0.065 },
      uAspect: { value: 1 },
    },
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.name = "skills-pointer-light";
  quad.frustumCulled = false;
  const scene = new THREE.Scene(),
    camera = new THREE.Camera();
  scene.add(quad);
  return {
    resize(width: number, height: number) {
      material.uniforms.uAspect.value = width / height;
      if (frame.image.width === width && frame.image.height === height) return;
      frame.dispose();
      frame = new THREE.FramebufferTexture(width, height);
      frame.name = "skills-light-frame";
      material.uniforms.uFrame.value = frame;
    },
    render() {
      boundary.update();
      // 复用已完成的抗锯齿画面，无需重新绘制模型，也不改变原有透明层的合成。
      renderer.copyFramebufferToTexture(frame);
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.render(scene, camera);
      renderer.autoClear = autoClear;
    },
    dispose() {
      frame.dispose();
      quad.geometry.dispose();
      material.dispose();
      scene.clear();
    },
  };
}
