import * as THREE from "three";
import { fullscreenVertex } from "../shaders/composite";
import { boundaryGLSL, createBoundaryUniforms } from "../hub/boundaryField";
import { contactTransitionField } from "./transitionField";
import { createTextDetailTexture } from "../textDetailTexture";

/** Extract live facets from the rendered collage without moving its geometry. */
export function createContactGhost(renderer: THREE.WebGLRenderer, stage: HTMLElement) {
  const field = contactTransitionField(stage);
  const boundary = createBoundaryUniforms(field);
  const text = createTextDetailTexture(stage.querySelector<HTMLElement>(".signal-content"),
    ".signal-header,.signal-copy,.signal-word,.signal-specimen,.signal-footer");
  let frame = new THREE.FramebufferTexture(1, 1);
  const material = new THREE.ShaderMaterial({
    name: "ContactInteractiveDetails", vertexShader: fullscreenVertex,
    depthTest: false, depthWrite: false, premultipliedAlpha: true,
    uniforms: { ...boundary.uniforms, uFrame: { value: frame }, uText: { value: text.texture } },
    fragmentShader: /* glsl */`
      uniform sampler2D uFrame, uText;
      varying vec2 vUv;
      ${boundaryGLSL}
      void main(){
        vec3 picture=sRGBTransferEOTF(texture2D(uFrame,vUv)).rgb;
        // Painted rock has denser texture than the directory tiles.
        // DOM lettering is absent from the framebuffer, but belongs to this side too.
        float textDetail=pictureDetails(texture2D(uText,vUv).rgb);
        float detail=max(pictureDetails(picture)*.5,textDetail*.6);
        float coverage=boundaryPictureCoverage(vUv,true);
        gl_FragColor=boundaryPicture(picture,detail,vUv,
          boundaryPictureDistance(vUv,true),coverage);
        #include <colorspace_fragment>
        #include <premultiplied_alpha_fragment>
      }
    `,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const scene = new THREE.Scene(), camera = new THREE.Camera();
  scene.add(new THREE.Mesh(geometry, material));
  return {
    resize() {
      const size = renderer.getDrawingBufferSize(new THREE.Vector2());
      if (frame.image.width === size.x && frame.image.height === size.y) return;
      frame.dispose();
      frame = new THREE.FramebufferTexture(size.x, size.y);
      material.uniforms.uFrame.value = frame;
    },
    render() {
      if (!field.active) return;
      boundary.update();
      text.update(renderer.domElement.getBoundingClientRect());
      renderer.copyFramebufferToTexture(frame);
      const autoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.render(scene, camera);
      renderer.autoClear = autoClear;
    },
    dispose() {
      text.dispose(); frame.dispose(); boundary.dispose(); material.dispose(); geometry.dispose();
    },
  };
}
