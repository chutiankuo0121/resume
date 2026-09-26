import * as THREE from "three";
import { createParticleGeometry } from "../assets";

/** A stable half of the opening's ambient cloud; never include crystal-surface points. */
export function createCareerParticleGeometry(data: ArrayBuffer) {
  const geometry = createParticleGeometry(data);
  const ambient = geometry.getAttribute("aAmbient");
  const sourceLight = geometry.getAttribute("aLight");
  const light = new Float32Array(ambient.count);
  const visible: number[] = [];
  let ambientCount = 0;
  for (let i = 0; i < ambient.count; i++) {
    if (ambient.getX(i) > .5 && ambientCount++ % 2 === 0) visible.push(i);
    // The opening's mostly dark grains sit on grey. Here they need silver values
    // on black; compensate for the shared fragment's 1.5 light multiplier.
    // Own this array: the binary buffer is also used by the opening and contact.
    light[i] = (.6 + .3 * sourceLight.getX(i)) / 1.5;
  }
  geometry.setAttribute("aLight", new THREE.BufferAttribute(light, 1));
  geometry.setIndex(visible);
  return geometry;
}
