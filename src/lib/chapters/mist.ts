import * as THREE from "three";

const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uProgress;
uniform float uExit;
uniform vec2 uSize;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
    mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
}
float cloud(vec2 p){
  float n=noise(p)*.57;
  p=mat2(.8,-.6,.6,.8)*p*2.13+5.7;
  n+=noise(p)*.28;
  return n+noise(p*2.07-9.3)*.15;
}
void main(){
  float p=uProgress;
  // 雾场只由滚动进度驱动，倒放经过同一位置时得到完全相同的厚度与卷动。
  vec2 q=(vUv-.5)*vec2(uSize.x/uSize.y,1.);
  float travel=p*1.8;
  vec2 drift=vec2(-travel*.29,travel*.17);
  float back=cloud(q*1.65+drift);
  float front=cloud(q*(3.6-p*.8)+vec2(back*.7,-back*.55)-drift*1.5);
  float field=mix(back,front,.4)+length(q)*.13;
  float close=smoothstep(0.,.43,p);
  float reopen=1.-smoothstep(mix(.55,.80,uExit),1.,p);
  float amount=min(close,reopen);
  float density=smoothstep(field-.25,field+.29,amount*1.85-.48);
  float veil=smoothstep(0.,.28,amount)*.12*(1.-smoothstep(.6,1.,amount));
  float alpha=max(density,veil);
  float light=smoothstep(field-.24,field+.28,smoothstep(.54,.80,p)*1.85-.48)*uExit;
  vec3 paper=vec3(238.,238.,233.)/255.;
  vec3 ink=vec3(.016+front*.045)*sin(amount*3.14159265);
  vec3 color=mix(ink,paper,light);
  float grain=(hash(floor(vUv*uSize))-.5)*.012*sin(amount*3.14159265);
  gl_FragColor=vec4(color+grain,alpha);
}
`;

/** 单个雾幕覆盖真实 DOM 和 WebGL 场景；只在章节交接期间绘制，不复制页面截图。 */
export function createChapterMist(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader: fragment,
    uniforms: { uProgress: { value: 0 }, uExit: { value: 0 }, uSize: { value: new THREE.Vector2() } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(geometry, material));
  let width = 0, height = 0, previous = -1, wasExit = false;
  return {
    draw(progress: number, exit: boolean) {
      if (width !== window.innerWidth || height !== window.innerHeight) {
        width = window.innerWidth;
        height = window.innerHeight;
        // 雾没有锐利图像细节；限制覆盖层缓冲大小，原场景的清晰度不受影响。
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25, Math.sqrt(1_200_000 / (width * height))));
        renderer.setSize(width, height, false);
        material.uniforms.uSize.value.set(width, height);
        previous = -1;
      }
      if (previous === progress && wasExit === exit) return;
      previous = progress;
      wasExit = exit;
      material.uniforms.uProgress.value = progress;
      material.uniforms.uExit.value = exit ? 1 : 0;
      renderer.render(scene, camera);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      scene.clear();
    },
  };
}
