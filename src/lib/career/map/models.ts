import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { paperMaterial, pencilMaterial } from "./materials";
import { groundHeight } from "./terrain";
import { mapStops } from "./stops";

/** Procedural, original miniature architecture. Geometry is batched by ink. */
class Drawing {
  parts: THREE.BufferGeometry[] = [];
  add(geometry: THREE.BufferGeometry, x:number,y:number,z:number, rx=0,ry=0,rz=0) {
    geometry.deleteAttribute("uv");
    geometry.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(1,1,1)));
    this.parts.push(geometry.index ? geometry.toNonIndexed() : geometry);
    if (geometry.index) geometry.dispose();
  }
  box(x:number,y:number,z:number,w:number,h:number,d:number,ry=0) { this.add(new THREE.BoxGeometry(w,h,d),x,y,z,0,ry); }
  cylinder(x:number,y:number,z:number,r:number,h:number,top=r,segments=10) { this.add(new THREE.CylinderGeometry(top,r,h,segments),x,y,z); }
  ball(x:number,y:number,z:number,r:number,stretch=1) {
    const shape=new THREE.IcosahedronGeometry(r,1); shape.scale(1,stretch,1); this.add(shape,x,y,z);
  }
  roof(x:number,y:number,z:number,w:number,h:number,d:number,ry=0) {
    const shape = new THREE.Shape(); shape.moveTo(-w/2,0);shape.lineTo(0,h);shape.lineTo(w/2,0);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,steps:1});
    geometry.translate(0,0,-d/2); this.add(geometry,x,y,z,0,ry);
  }
  finish(color:string, accent=0, outline=.28) {
    const group=new THREE.Group();
    if (!this.parts.length) return {group, material:paperMaterial(color)};
    const merged=mergeGeometries(this.parts)!;
    this.parts.forEach(part=>part.dispose());this.parts=[];
    const material=paperMaterial(color);material.uniforms.uAccent.value=accent;
    group.add(new THREE.Mesh(merged,material));
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(merged,28),pencilMaterial(outline)));
    return {group,material};
  }
}

function windows(draw:Drawing,x:number,y:number,z:number,count:number,step=.42,rows=1) {
  for(let row=0;row<rows;row++)for(let i=0;i<count;i++)draw.box(x+(i-(count-1)/2)*step,y+row*.65,z,.17,.29,.035);
}

export function createLandmarks() {
  const materials: THREE.ShaderMaterial[][]=[];
  const root=new THREE.Group();
  mapStops.forEach((stop,index)=>{
    const walls=new Drawing(),roof=new Drawing(),ink=new Drawing();
    // Small foundations and stairs give each destination a readable silhouette.
    walls.box(0,.1,0,5.1,.2,4.1);
    for(let i=0;i<4;i++) walls.box(0,.04+i*.035,2.15+i*.14,1.8-i*.14,.08,.32);
    if(index===0){
      // Campus: two wings, a courtyard, and a slender academic clock tower.
      for(const side of [-1,1]){
        walls.box(side*1.7,.83,0,1.05,1.5,3.5);roof.roof(side*1.7,1.58,0,1.25,.5,3.7);
        windows(ink,side*1.7,.6,1.77,2,.44,2);
        for(let j=0;j<6;j++)ink.box(side*2.235,.6+j%2*.65,-1.35+Math.floor(j/2)*1.25,.025,.3,.2);
      }
      walls.box(0,.85,-1.4,2.4,1.5,.8);roof.roof(0,1.6,-1.4,2.6,.45,1.05);
      walls.box(0,1.6,-1.3,.68,3.1,.75);walls.box(0,3.05,-1.3,.82,.17,.9);
      roof.add(new THREE.ConeGeometry(.65,.95,4),0,3.56,-1.3,0,Math.PI/4);
      ink.cylinder(0,.17,.15,.58,.06);windows(ink,0,2.15,-.915,1,.4,2);
      ink.box(0,.59,-.925,.35,.82,.03);
    }else if(index===1){
      // Research library and an observatory dome.
      walls.box(-.45,.88,.1,3.7,1.55,2.55);roof.roof(-.45,1.66,.1,4,.8,2.8);
      for(let i=0;i<6;i++)walls.cylinder(-1.95+i*.6,.73,1.7,.08,1.22);
      walls.box(-.45,1.39,1.7,3.8,.18,.38);windows(ink,-.45,.86,1.395,6,.5);
      walls.cylinder(1.7,1.32,-.7,.75,2.35);
      roof.add(new THREE.SphereGeometry(.86,14,8,0,Math.PI*2,0,Math.PI/2),1.7,2.5,-.7);
      ink.box(1.7,1.3,.058,.22,.62,.04);
    }else if(index===2){
      // Trading port: warehouse, lighthouse, jetty and a sailing boat.
      walls.box(-.7,.72,-.2,2.9,1.2,2.25);roof.roof(-.7,1.32,-.2,3.1,.75,2.5);
      windows(ink,-.7,.75,.94,4,.65);
      walls.cylinder(1.5,1.63,-.3,.48,3,.32,12);
      roof.cylinder(1.5,2.85,-.3,.6,.19);ink.cylinder(1.5,3.15,-.3,.32,.47);
      roof.add(new THREE.ConeGeometry(.56,.48,12),1.5,3.62,-.3);
      walls.box(0,.18,3.05,1.3,.15,3.3);
      for(const x of [-.55,.55])for(let i=0;i<6;i++)ink.cylinder(x,.35,1.5+i*.52,.035,.6);
      const hull=new THREE.SphereGeometry(.8,12,6);hull.scale(.55,.28,1.9);roof.add(hull,2.2,.12,3.4);
      ink.cylinder(2.2,1.1,3.4,.028,2.2);
      const sail=new THREE.BufferGeometry();sail.setAttribute("position",new THREE.Float32BufferAttribute([2.21,2.15,3.4,2.21,.62,2.3,2.21,.62,3.4],3));sail.computeVertexNormals();walls.add(sail,0,0,0);
    }else if(index===3){
      // Automation workshop: repeated bays, pipework and a water wheel.
      walls.box(-.2,.72,0,3.7,1.2,2.7);
      for(let i=0;i<4;i++)roof.roof(-1.58+i*.94,1.32,0,.94,.45,2.85);
      windows(ink,-.2,.8,1.38,6,.53);
      walls.cylinder(1.85,1.42,-1,.25,2.8,.2);
      ink.cylinder(1.85,2.82,-1,.3,.13);
      roof.add(new THREE.TorusGeometry(.78,.095,6,16),-2.24,.91,.1,0,Math.PI/2);
      for(let i=0;i<10;i++){
        const a=i/10*Math.PI*2;ink.box(-2.26,.91+Math.cos(a)*.4,.1+Math.sin(a)*.4,.07,.75,.055,0);
      }
      for(let i=0;i<3;i++)roof.box(.45+i*.48,.38,1.88,.35,.45,.55);
    }else if(index===4){
      // A glass-roofed image atelier and an outdoor projection screen.
      walls.box(-.6,.87,0,3.2,1.55,2.6);roof.roof(-.6,1.64,0,3.4,.74,2.82);
      for(let i=0;i<6;i++)ink.box(-1.9+i*.52,.97,1.315,.34,.85,.025);
      for(let i=0;i<5;i++)ink.box(-1.83+i*.61,1.99,.74,.045,.045,1.65);
      walls.box(1.65,1.55,-.65,1.42,1.66,.14);ink.box(1.65,1.55,-.56,1.24,1.4,.04);
      for(const x of [1.1,2.2])ink.box(x,.67,-.65,.07,1.3,.07);
      roof.cylinder(.45,.59,2.05,.19,.17);roof.box(.45,.82,2.05,.7,.3,.32);
      roof.add(new THREE.CylinderGeometry(.13,.13,.27,10),.86,.82,2.05,0,0,Math.PI/2);
    }else if(index===5){
      // Product laboratory: linked buildings, solar courtyard, signal antenna.
      for(let i=0;i<3;i++){
        const x=-1.55+i*1.5,y=.88+i*.32;
        walls.box(x,y/2+.15,-.25,1.3,y,2.5);roof.box(x,y+.22,-.25,1.4,.17,2.62);
        windows(ink,x,y/2+.18,1.025,3,.34);
      }
      for(let i=0;i<4;i++)roof.box(-1.65+i*.93,.28,1.72,.76,.07,.7);
      ink.cylinder(1.7,2.23,-1,.026,1.5);roof.add(new THREE.TorusGeometry(.43,.035,5,16),1.7,2.54,-1,0,.4);
      roof.ball(1.7,2.54,-1,.1);
    }else{
      // The final observatory looks out over the coast.
      walls.cylinder(0,.77,0,1.55,1.34,1.55,20);walls.cylinder(0,1.5,0,1.7,.18,1.7,20);
      roof.add(new THREE.SphereGeometry(1.58,20,12,0,Math.PI*2,0,Math.PI/2),0,1.58,0);
      ink.add(new THREE.TorusGeometry(1.59,.035,5,32,Math.PI),0,1.6,0,Math.PI/2);
      walls.box(-2,.5,.25,1.4,.85,1.5);roof.box(-2,.99,.25,1.5,.12,1.6);
      for(let i=0;i<7;i++){const a=i/7*Math.PI;ink.box(Math.cos(a)*1.56,.8,Math.sin(a)*1.56,.14,.55,.055,-a+Math.PI/2);}
      for(let i=0;i<3;i++)walls.box(0,.1-i*.07,2.4+i*.32,3.6+i*.48,.13,.38);
      ink.cylinder(2.1,.9,.55,.045,1.6);roof.add(new THREE.CylinderGeometry(.12,.18,.8,10),2.1,1.68,.55,0,0,-.65);
    }
    const group=new THREE.Group();group.position.set(stop.x,groundHeight(stop.x,stop.z),stop.z);
    const wallDrawing=walls.finish("#b6ac91",0,.3);
    const roofDrawing=roof.finish(stop.color,0,.32);
    const inkDrawing=ink.finish("#685f4c",.2,.12);
    group.add(wallDrawing.group,roofDrawing.group,inkDrawing.group);root.add(group);
    materials.push([wallDrawing.material,roofDrawing.material]);
  });
  return {group:root,materials};
}

export function createLandscape(route:THREE.Vector3[]) {
  const leaves=new Drawing(),trunks=new Drawing(),houses=new Drawing(),roofs=new Drawing();
  let seed=31241;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
  for(let i=0;i<540;i++){
    const x=(random()-.5)*66,z=(random()-.5)*36;
    if(z>11||Math.hypot(x/34,z/20)>.95||mapStops.some(p=>Math.hypot(x-p.x,z-p.z)<3.65)
      || route.some((p,j)=>j%8===0&&Math.hypot(x-p.x,z-p.z)<.65))continue;
    if(Math.sin(x*.24+z*.3)<-.2&&z>-7)continue;
    const y=groundHeight(x,z),height=.75+random()*1.2,r=.26+random()*.22;
    trunks.cylinder(x,y+height*.3,z,.036,height*.6,.025,5);
    if(random()>.36){leaves.add(new THREE.ConeGeometry(r,height,6),x,y+height*.76,z);leaves.add(new THREE.ConeGeometry(r*.76,height*.76,6),x,y+height*1.01,z);}
    else leaves.ball(x,y+height*.8,z,r*1.27,1.3);
  }
  // A handful of small villages along the horizon, with room around landmarks.
  for(let i=0;i<44;i++){
    const x=(random()-.5)*57,z=-8-random()*6;
    if(mapStops.some(p=>Math.hypot(x-p.x,z-p.z)<4))continue;
    const y=groundHeight(x,z),w=.45+random()*.35,d=.65+random()*.55,h=.45+random()*.7;
    houses.box(x,y+h/2,z,w,h,d);roofs.roof(x,y+h,z,w+.1,.36,d+.1);
  }
  const root=new THREE.Group();
  root.add(leaves.finish("#819078",.16,.18).group,trunks.finish("#867659",0,.12).group,
    houses.finish("#b3a68e",0,.2).group,roofs.finish("#a19a83",0,.22).group);
  return root;
}
