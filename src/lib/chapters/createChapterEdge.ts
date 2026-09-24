import * as THREE from "three";

export const EDGE_SAMPLES = 513;
export type EdgePoint = { x: number; y: number };
type EdgeMotion = { x: number; y: number; strength: number; flow: number };
const noiseGLSL = /* glsl */ `
  float edgeHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(edgeHash(i),edgeHash(i+vec2(1.,0.)),f.x),
      mix(edgeHash(i+vec2(0.,1.)),edgeHash(i+vec2(1.)),f.x),f.y);
  }
  vec4 contour(sampler2D curve,float x){
    float index=clamp(x*512.,0.,511.999);
    return mix(texture2D(curve,vec2((floor(index)+.5)/513.,.5)),
      texture2D(curve,vec2((floor(index)+1.5)/513.,.5)),fract(index));
  }
`;

/** The mask and the fine luminous paper edge share one pixel-space contour. */
export function createChapterEdge(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: false, antialias: false });
  renderer.setClearColor(0, 0);
  const data = new Float32Array(EDGE_SAMPLES * 4);
  const curve = new THREE.DataTexture(data, EDGE_SAMPLES, 1, THREE.RGBAFormat, THREE.FloatType);
  curve.minFilter = curve.magFilter = THREE.NearestFilter;
  const material = new THREE.ShaderMaterial({
    name: "ChapterParticleEdge",
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uCurve: { value: curve }, uSize: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 }, uStrength: { value: 0 }, uDouble: { value: 0 },
      uFlow: { value: 0 },
    },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uCurve;
      uniform vec2 uSize;
      uniform float uTime,uStrength,uDouble,uFlow;
      varying vec2 vUv;
      ${noiseGLSL}
      void main(){
        vec2 pixel=vec2(vUv.x,1.-vUv.y)*uSize;
        vec4 line=contour(uCurve,vUv.x);
        float d=(pixel.y-line.x)/sqrt(1.+line.z*line.z);
        float other=(pixel.y-line.y)/sqrt(1.+line.w*line.w);
        if(uDouble>.5 && abs(other)<abs(d))d=other;
        if(abs(d)>65. || uStrength<=0.) { gl_FragColor=vec4(0.); return; }
        vec2 drift=pixel+vec2(uTime*7.,-uTime*4.);
        float grain=edgeHash(floor(drift/1.15));
        float current=noise(vec2(pixel.x*.016-uTime*.3,uTime*.22));
        float shimmer=.45+.55*pow(.5+.5*sin(uTime*2.2+current*16.),3.);
        float fiber=exp(-abs(d+(grain-.5)*3.)/1.7)*(.35+.65*grain);
        float halo=exp(-d*d/110.)*(.13+shimmer*.16);
        float fleck=step(.7,grain)*exp(-d*d/(170.+current*700.))*(.12+shimmer*.42);
        float rim=(fiber+halo)*uStrength;
        float speck=fleck*uStrength*(1.+uFlow*.25);
        vec3 dustColor=d< -7.?vec3(.42,.43,.38):vec3(1.,.98,.88);
        vec3 color=(vec3(1.,.99,.9)*rim+dustColor*speck)/max(.0001,rim+speck);
        gl_FragColor=vec4(color,min(.98,rim+speck));
      }`,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  scene.add(new THREE.Mesh(geometry, material));
  // Independent dust, with stable seeds, lifetimes and velocities. These are
  // actual point sprites rather than a stationary noise pattern on the rim.
  const count = 900;
  const seeds = new Float32Array(count * 4);
  let seed = 91273;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < seeds.length; i++) seeds[i] = random();
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  dustGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  const dustMaterial = new THREE.ShaderMaterial({
    name: "ChapterDriftingDust", transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      uCurve: { value: curve }, uSize: material.uniforms.uSize,
      uTime: material.uniforms.uTime, uStrength: material.uniforms.uStrength,
      uFlow: material.uniforms.uFlow, uDpr: { value: 1 },
      uPointer: { value: new THREE.Vector3(-1000, -1000, 0) },
    },
    vertexShader: /* glsl */ `
      uniform sampler2D uCurve;
      uniform vec2 uSize;
      uniform vec3 uPointer;
      uniform float uTime,uStrength,uFlow,uDpr;
      attribute vec4 aSeed;
      varying float vAlpha,vSide,vFlash;
      ${noiseGLSL}
      void main(){
        float life=fract(uTime/(3.5+aSeed.z*4.)+aSeed.y);
        float side=aSeed.w>.43?1.:-1.;
        float x=fract(aSeed.x+sin(uTime*.19+aSeed.z*20.)*.006)*uSize.x;
        vec4 line=contour(uCurve,x/uSize.x);
        vec2 normal=normalize(vec2(-line.z,1.));
        vec2 tangent=vec2(normal.y,-normal.x);
        float spread=(10.+pow(aSeed.z,2.)*98.)*(1.+uFlow*.42);
        vec2 pos=vec2(x,line.x)+normal*side*(3.+life*spread);
        pos+=tangent*(sin(uTime*.7+aSeed.y*30.)*7.+(noise(vec2(aSeed.x*40.,uTime*.4))-.5)*24.)*life;
        vec2 delta=pos-uPointer.xy;
        float influence=exp(-dot(delta,delta)/6500.)*uPointer.z;
        pos+=delta/max(length(delta),1.)*influence*20.*life;
        float blink=.5+.5*sin(uTime*(1.2+aSeed.z*2.4)+aSeed.x*60.);
        vFlash=pow(blink,10.)*step(.92,aSeed.w);
        vAlpha=smoothstep(0.,.12,life)*(1.-smoothstep(.45,1.,life))
          *(.28+.72*blink)*uStrength*(.5+aSeed.z*.5);
        vSide=side;
        gl_Position=vec4(pos.x/uSize.x*2.-1.,1.-pos.y/uSize.y*2.,0.,1.);
        gl_PointSize=(1.2+aSeed.z*1.9+vFlash*5.)*uDpr;
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha,vSide,vFlash;
      void main(){
        vec2 p=gl_PointCoord-.5;
        float radius=length(p);
        float dotShape=1.-smoothstep(.15,.48,radius);
        float glint=exp(-abs(p.x)*30.)*exp(-abs(p.y)*5.)
          +exp(-abs(p.y)*30.)*exp(-abs(p.x)*5.);
        float alpha=max(dotShape,glint*vFlash*.65)*vAlpha;
        vec3 color=vSide<0.?mix(vec3(.43,.44,.38),vec3(1.,.98,.87),vFlash):vec3(1.,.98,.88);
        gl_FragColor=vec4(color,alpha);
      }`,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.frustumCulled = false;
  dust.renderOrder = 1;
  scene.add(dust);
  return {
    resize(width: number, height: number) {
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.setSize(width, height, false);
      material.uniforms.uSize.value.set(width, height);
      dustMaterial.uniforms.uDpr.value = renderer.getPixelRatio();
      dustGeometry.setDrawRange(0, width < 600 ? 420 : count);
    },
    render(upper: EdgePoint[], lower: EdgePoint[] | null, time: number, strength: number, motion?: EdgeMotion) {
      for (let i = 0; i < EDGE_SAMPLES; i++) {
        // 法线取较宽邻域，避免逐像素锯齿把粒子带拉成竖直条纹。
        const before = Math.max(0, i - 8), after = Math.min(EDGE_SAMPLES - 1, i + 8);
        const slope = (points: EdgePoint[]) => (points[after].y - points[before].y) / Math.max(.001, points[after].x - points[before].x);
        data.set([upper[i].y, lower?.[i].y ?? upper[i].y, slope(upper), slope(lower ?? upper)], i * 4);
      }
      curve.needsUpdate = true;
      material.uniforms.uTime.value = time;
      material.uniforms.uStrength.value = strength;
      material.uniforms.uDouble.value = lower ? 1 : 0;
      material.uniforms.uFlow.value = motion?.flow ?? 0;
      dustMaterial.uniforms.uPointer.value.set(motion?.x ?? -1000, motion?.y ?? -1000, motion?.strength ?? 0);
      renderer.render(scene, camera);
    },
    clear() { renderer.clear(); },
    dispose() {
      curve.dispose(); material.dispose(); geometry.dispose();
      dustGeometry.dispose(); dustMaterial.dispose(); renderer.dispose();
    },
  };
}
