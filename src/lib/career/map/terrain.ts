import * as THREE from "three";
import { mapStops, ease } from "./stops";
import { paperMaterial, pencilMaterial } from "./materials";

function rawHeight(x: number, z: number) {
  const hills = 3.7 * Math.exp(-((x + 6) ** 2 / 180 + (z + 15) ** 2 / 25))
    + 3.3 * Math.exp(-((x - 23) ** 2 / 90 + (z + 13) ** 2 / 30));
  const coast = ease((12.5 + Math.sin(x * .19) * 1.2 - z) / 4);
  return (1.05 + Math.sin(x * .17 + z * .11) * .36 + Math.cos(z * .29) * .24 + hills) * coast - .16;
}

export function groundHeight(x: number, z: number) {
  let y = rawHeight(x, z);
  for (const stop of mapStops) {
    const distance = Math.hypot(x - stop.x, z - stop.z);
    const flatten = 1 - ease((distance - 2.5) / 1.8);
    y = THREE.MathUtils.lerp(y, rawHeight(stop.x, stop.z), flatten);
  }
  return y;
}

export function createTerrain() {
  const group = new THREE.Group();
  const geometry = new THREE.PlaneGeometry(80, 54, 190, 130);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.getAttribute("position");
  for (let i = 0; i < positions.count; i++) positions.setY(i, groundHeight(positions.getX(i), positions.getZ(i)));
  geometry.computeVertexNormals();
  const material = paperMaterial("#afa986", true);
  group.add(new THREE.Mesh(geometry, material));

  const water = new THREE.Mesh(new THREE.PlaneGeometry(80, 20), paperMaterial("#91aba9", true));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -.075, 21); group.add(water);
  const seaLines: THREE.Vector3[] = [];
  for (let row = 0; row < 19; row++) {
    const z = 13.5 + row * .45;
    for (let i = 0; i < 130; i++) {
      const x = -31 + i * .48;
      if (Math.sin(i * .8 + row) > .7) continue;
      seaLines.push(new THREE.Vector3(x, -.045, z + Math.sin(x * .4 + row) * .13),
        new THREE.Vector3(x + .32, -.045, z + Math.sin((x + .32) * .4 + row) * .13));
    }
  }
  group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seaLines), pencilMaterial(.11, "#6d9298")));

  // Field furrows follow the land's height instead of hovering as flat decals.
  const furrows: THREE.Vector3[] = [];
  for (const field of [{x:-26,z:-7,w:8,d:6},{x:-2,z:-9,w:10,d:5},{x:10,z:0,w:8,d:5},{x:25,z:8,w:8,d:4}]) {
    for (let row = 0; row < field.d * 3; row++) {
      for (let i = 0; i < 30; i++) {
        const x = field.x + i / 30 * field.w;
        const z = field.z + row / 3 + Math.sin(i / 12) * .18;
        if (mapStops.some(p => Math.hypot(p.x-x,p.z-z)<3.6)) continue;
        furrows.push(new THREE.Vector3(x, groundHeight(x,z)+.045,z),
          new THREE.Vector3(x+field.w/30,groundHeight(x+field.w/30,z)+.045,z));
      }
    }
  }
  group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(furrows), pencilMaterial(.18)));

  const path = new THREE.CatmullRomCurve3(mapStops.map(p => new THREE.Vector3(p.x,0,p.z)), false, "centripetal");
  const routePoints = path.getPoints(500).map(p => new THREE.Vector3(p.x, groundHeight(p.x,p.z)+.09,p.z));
  const routeGeometry = new THREE.BufferGeometry().setFromPoints(routePoints);
  const dashed = new THREE.Line(routeGeometry, new THREE.LineDashedMaterial({ color: "#a88769", dashSize: .15, gapSize: .15, transparent: true, opacity: .65 }));
  dashed.computeLineDistances(); group.add(dashed);
  const progressGeometry = routeGeometry.clone();
  progressGeometry.setDrawRange(0, 0);
  const progress = new THREE.Line(progressGeometry, pencilMaterial(.85, "#aa513d")); group.add(progress);
  return { group, routePoints, setProgress(value: number) { progressGeometry.setDrawRange(0, Math.max(0,Math.round(value*routePoints.length))); } };
}
