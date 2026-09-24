import * as THREE from "three";
import { createCrystal } from "../createCrystal";
import { particleVertex, particleFragment } from "../shaders/particles";
import { fullscreenVertex, blurFragment, particleComposite } from "../shaders/composite";

/** The opening model and point kernel, composited transparently into the landscape. */
export function createContactCrystal(renderer: THREE.WebGLRenderer) {
  const lightScene = new THREE.Scene(), pointScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, .1, 100);
  const target = () => new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
  });
  const lighting = target(), blurX = target(), soft = target(), sharp = target();
  lighting.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
  lighting.depthTexture.minFilter = lighting.depthTexture.magFilter = THREE.NearestFilter;
  const points = new THREE.ShaderMaterial({
    vertexShader: particleVertex, fragmentShader: particleFragment,
    transparent: true, depthTest: true, depthWrite: true,
    uniforms: {
      uTime: { value: 0 }, uPixelRatio: { value: 1 }, uViewportScale: { value: .7 },
      uMotionDepthOffset: { value: 1 }, uEntry: { value: 1 },
      uModelDepth: { value: lighting.depthTexture }, uModelCoverage: { value: lighting.texture },
      uDepthSize: { value: new THREE.Vector2(1, 1) },
      uCameraClip: { value: new THREE.Vector2(camera.near, camera.far) },
    },
  });
  const crystal = createCrystal({ lightScene, pointScene, pointMaterial: points, onProgress() {} });
  const center = new THREE.Vector3(), size = new THREE.Vector3();
  let disposed = false, ready = false, width = 1, height = 1;
  const loaded = crystal.ready.then(() => {
    if (disposed) return;
    const box = new THREE.Box3().setFromObject(lightScene);
    box.getCenter(center); box.getSize(size);
    ready = true;
  });
  const blur = new THREE.ShaderMaterial({
    vertexShader: fullscreenVertex, fragmentShader: blurFragment,
    depthTest: false, depthWrite: false,
    uniforms: { uInput: { value: lighting.texture }, uStep: { value: new THREE.Vector2() } },
  });
  const post = new THREE.Scene(), postCamera = new THREE.Camera();
  const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blur);
  post.add(postQuad);
  const material = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { uSoft: { value: soft.texture }, uSharp: { value: sharp.texture } },
    vertexShader: `varying vec2 vUv;
      void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: /* glsl */`
      uniform sampler2D uSoft,uSharp;
      varying vec2 vUv;
      ${particleComposite}
      void main(){
        vec4 surface=texture2D(uSoft,vUv);
        float point=texture2D(uSharp,vUv).r;
        float grain=smoothstep(.003,.07,abs(point-.09084171));
        float alpha=max(surface.a*.78,grain);
        float light=composeParticles(.025,surface,point,1.);
        gl_FragColor=vec4(sRGBTransferEOTF(vec4(vec3(light),1.)).rgb,alpha);
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.position.z = mesh.renderOrder = 2;
  mesh.frustumCulled = false;
  const clear = new THREE.Color();
  const neutral = new THREE.Color().setRGB(.09084171, .09084171, .09084171);
  const orbit = new THREE.Vector3();
  return {
    mesh, ready: loaded,
    resize(w: number, h: number) {
      width = w; height = h;
      const dpr = renderer.getPixelRatio();
      for (const frame of [lighting, blurX, soft]) frame.setSize(Math.max(1, Math.round(w*dpr*.5)), Math.max(1, Math.round(h*dpr*.5)));
      sharp.setSize(Math.max(1, Math.round(w*dpr)), Math.max(1, Math.round(h*dpr)));
      points.uniforms.uDepthSize.value.set(lighting.width, lighting.height);
      points.uniforms.uPixelRatio.value = dpr;
      points.uniforms.uViewportScale.value = w < 800 ? .55 : .7;
      mesh.scale.set(w, h, 1);
    },
    render(dt: number, time: number, x: number, y: number, crystalHeight: number,
      pointerX: number, pointerY: number, reduced: boolean) {
      if (!ready || disposed) return;
      crystal.setPointer(pointerX, pointerY);
      crystal.update(dt, 1, reduced, 0);
      const distance = size.y / (2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))
        * height / crystalHeight + Math.max(size.x, size.z)*.4;
      camera.position.copy(center).add(orbit.set(Math.sin(1.16)*distance, .15, Math.cos(1.16)*distance));
      camera.lookAt(center);
      camera.aspect = width / height;
      camera.setViewOffset(width, height, width/2-x, height/2-y, width, height);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      points.uniforms.uTime.value = time;
      points.uniforms.uMotionDepthOffset.value = distance;
      const previousTarget = renderer.getRenderTarget();
      const previousAlpha = renderer.getClearAlpha();
      const previousAutoClear = renderer.autoClear;
      renderer.getClearColor(clear);
      renderer.autoClear = false;
      renderer.setClearColor(0, 0);
      renderer.setRenderTarget(lighting); renderer.clear(); renderer.render(lightScene, camera);
      blur.uniforms.uInput.value = lighting.texture;
      blur.uniforms.uStep.value.set(.004, 0);
      renderer.setRenderTarget(blurX); renderer.clear(); renderer.render(post, postCamera);
      blur.uniforms.uInput.value = blurX.texture;
      blur.uniforms.uStep.value.set(0, .004);
      renderer.setRenderTarget(soft); renderer.clear(); renderer.render(post, postCamera);
      // Explicit linear neutral matches the opening's point compositor.
      renderer.setClearColor(neutral, 1);
      renderer.setRenderTarget(sharp); renderer.clear(); renderer.render(pointScene, camera);
      renderer.setRenderTarget(previousTarget);
      renderer.setClearColor(clear, previousAlpha);
      renderer.autoClear = previousAutoClear;
    },
    dispose() {
      disposed = true; crystal.dispose(); points.dispose(); blur.dispose(); material.dispose();
      postQuad.geometry.dispose(); mesh.geometry.dispose(); mesh.removeFromParent();
      for (const frame of [lighting, blurX, soft, sharp]) frame.dispose();
    },
  };
}
