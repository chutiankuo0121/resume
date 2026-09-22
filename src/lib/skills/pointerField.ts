import * as THREE from "three";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}
`;
const fragmentShader = /* glsl */ `
uniform sampler2D uPrevious;
uniform vec2 uBrush;
uniform float uAspect;
uniform float uRetention;
uniform float uInk;
uniform float uRadius;
varying vec2 vUv;
void main(){
  vec2 delta=(vUv-uBrush)*vec2(1.,1./uAspect);
  float stamp=1.-smoothstep(0.,uRadius,length(delta));
  float old=texture2D(uPrevious,vUv).r*uRetention;
  gl_FragColor=vec4(vec3(mix(old,1.,stamp*uInk)),1.);
}
`;

/** 独立反馈场：局部坐标驱动几何；视口坐标同时驱动材质明暗与最终合成柔光。 */
export function createPointerField(
  renderer: THREE.WebGLRenderer,
  { aspect = 35 / 23, thickness = 0.1, persistence = 0.85 } = {},
) {
  const options = {
    type: THREE.HalfFloatType,
    depthBuffer: false,
    stencilBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  };
  let previous = new THREE.WebGLRenderTarget(192, 128, options);
  let next = new THREE.WebGLRenderTarget(192, 128, options);
  const texture = { value: previous.texture };
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uPrevious: texture,
      uBrush: { value: new THREE.Vector2() },
      uAspect: { value: aspect },
      uRetention: { value: 1 },
      uInk: { value: 0 },
      uRadius: { value: thickness },
    },
    depthTest: false,
    depthWrite: false,
  });
  const geometry = new THREE.PlaneGeometry(2, 2),
    scene = new THREE.Scene();
  scene.add(new THREE.Mesh(geometry, material));
  const camera = new THREE.Camera(),
    cursor = new THREE.Vector2();
  let touching = false,
    energy = 0,
    initialized = false;
  function clear() {
    const target = renderer.getRenderTarget(),
      color = renderer.getClearColor(new THREE.Color()),
      alpha = renderer.getClearAlpha();
    renderer.setClearColor(0, 1);
    for (const buffer of [previous, next]) {
      renderer.setRenderTarget(buffer);
      renderer.clear();
    }
    renderer.setRenderTarget(target);
    renderer.setClearColor(color, alpha);
    touching = false;
    energy = 0;
  }
  clear();
  return {
    texture,
    clear,
    setAspect(value: number) {
      material.uniforms.uAspect.value = value;
    },
    update(dt: number, uv: THREE.Vector2 | null) {
      if (!uv && energy < 0.001 && initialized) return;
      const firstFrame = !initialized;
      initialized = true;
      const uniforms = material.uniforms;
      if (uv) {
        if (!touching) cursor.copy(uv);
        uniforms.uBrush.value.copy(cursor);
        const beforeX = cursor.x,
          beforeY = cursor.y;
        // 先以 7.5/s 追随，再在上一位置盖圆形笔触，不沿鼠标连线挤出一条脊。
        cursor.lerp(uv, 1 - Math.exp(-7.5 * dt));
        const speed =
          Math.hypot(cursor.x - beforeX, cursor.y - beforeY) /
          Math.max(dt * 60, 0.001);
        uniforms.uRadius.value = Math.min(0.2, thickness + speed * 0.3);
      }
      const retention = Math.pow(persistence, dt * 10);
      uniforms.uRetention.value = retention;
      // 原站 60fps 每帧混合 5%；换算成时间常数，高刷机器不会更浓。
      uniforms.uInk.value = uv ? 1 - Math.pow(0.95, dt * 60) : 0;
      touching = Boolean(uv);
      energy = uv ? 1 : energy * retention;
      if (!uv && energy < 0.001 && !firstFrame) {
        clear();
        return;
      }
      const target = renderer.getRenderTarget();
      renderer.setRenderTarget(next);
      renderer.render(scene, camera);
      renderer.setRenderTarget(target);
      [previous, next] = [next, previous];
      texture.value = previous.texture;
    },
    dispose() {
      previous.dispose();
      next.dispose();
      material.dispose();
      geometry.dispose();
      scene.clear();
    },
  };
}
