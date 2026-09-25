import * as THREE from "three";
import { createTextDetailTexture } from "./textDetailTexture";

/** Sample the same rendered atlas shown underneath the opening portal. */
export function createPortalArrival(canvas: HTMLCanvasElement) {
  const atlas = document.querySelector<HTMLCanvasElement>(".atlas-canvas");
  const stage = document.querySelector<HTMLElement>(".career-stage");
  const text = createTextDetailTexture(stage, ".atlas-intro,.atlas-reading", ".atlas-markers");
  const empty = new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);
  empty.needsUpdate = true;
  const texture = atlas ? new THREE.CanvasTexture(atlas) : undefined;
  if (texture) { texture.generateMipmaps=false; texture.minFilter=THREE.LinearFilter; }
  const uniforms = {
    uArrival:{value:(texture ?? empty) as THREE.Texture},
    uArrivalMask:{value:empty},
    uArrivalText:{value:text.texture},
    uArrivalRect:{value:new THREE.Vector4(0,0,1,1)},
    uArrivalReady:{value:0},
  };
  let width=0,height=0;
  return {uniforms,update(){
    const viewport=canvas.getBoundingClientRect();text.update(viewport);
    if(!atlas||!texture||atlas.dataset.mapReady!=="true"){uniforms.uArrivalReady.value=0;return;}
    if(width!==atlas.width||height!==atlas.height){texture.dispose();width=atlas.width;height=atlas.height;}
    texture.needsUpdate=true;uniforms.uArrivalReady.value=1;
    const box=atlas.getBoundingClientRect();
    uniforms.uArrivalRect.value.set(box.left-viewport.left,box.top-viewport.top,Math.max(1,box.width),Math.max(1,box.height));
  },dispose(){text.dispose();texture?.dispose();empty.dispose();}};
}
