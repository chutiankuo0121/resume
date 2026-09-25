import * as THREE from "three";
import { PAPER } from "./materials";
import { createTerrain, groundHeight } from "./terrain";
import { createLandscape, createLandmarks } from "./models";
import { mapStops, mapPose } from "./stops";

export function createMapScene(canvas: HTMLCanvasElement, markers: HTMLElement[]) {
  const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();scene.background=new THREE.Color(PAPER);scene.fog=new THREE.Fog(PAPER,65,112);
  const camera=new THREE.OrthographicCamera(-30,30,20,-20,.1,160);
  const terrain=createTerrain(),landmarks=createLandmarks();
  scene.add(terrain.group,createLandscape(terrain.routePoints),landmarks.group);
  const halo=new THREE.Mesh(new THREE.RingGeometry(2.9,2.94,80),new THREE.MeshBasicMaterial({color:"#a4513f",transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide}));
  halo.rotation.x=-Math.PI/2;scene.add(halo);
  const count=170,positions=new Float32Array(count*3),seeds=new Float32Array(count);
  for(let i=0;i<count;i++){
    const a=i*2.39996,r=.9+((i*37)%101)/101*2.3;
    positions.set([Math.cos(a)*r,((i*19)%71)/71*2.8,Math.sin(a)*r],i*3);seeds[i]=((i*53)%97)/97;
  }
  const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute("position",new THREE.BufferAttribute(positions,3));dustGeometry.setAttribute("aSeed",new THREE.BufferAttribute(seeds,1));
  const dustMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    uniforms:{uTime:{value:0},uStrength:{value:0},uColor:{value:new THREE.Color("#b58669")},uDpr:{value:renderer.getPixelRatio()}},
    vertexShader:`attribute float aSeed;uniform float uTime,uStrength,uDpr;varying float vAlpha;void main(){vec3 p=position;p.x+=sin(uTime*.35+aSeed*31.)*uStrength*.45;p.y+=uStrength*(.5+aSeed);p.z+=cos(uTime*.3+aSeed*17.)*uStrength*.45;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=(1.5+aSeed*3.5)*uDpr;vAlpha=uStrength*.22;}`,
    fragmentShader:`uniform vec3 uColor;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);float a=(1.-smoothstep(.16,.5,d))*vAlpha;if(a<.005)discard;gl_FragColor=vec4(uColor,a);
      #include <colorspace_fragment>
    }`,
  });
  const dust=new THREE.Points(dustGeometry,dustMaterial);dust.frustumCulled=false;scene.add(dust);
  let width=1,height=1,disposed=false,initialized=false;
  const target=new THREE.Vector3(0,0,0),desired=new THREE.Vector3();
  let span=48,bearing=.37,elevation=.72;
  const projected=new THREE.Vector3();const localPointer={x:0,y:0};
  function resize(){
    const box=canvas.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);
    renderer.setSize(width,height,false);initialized=false;
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  function frame(units:number,seconds:number,dt:number,pointer:{x:number;y:number;turn:number;tilt:number},reduced:boolean){
    if(disposed)return;
    const pose=mapPose(units),mobile=width<800;
    function waypoint(index:number){
      if(index<0)return {x:0,y:1,z:0,span:mobile?150:47,bearing:.36};
      const stop=mapStops[index];return {x:stop.x,y:groundHeight(stop.x,stop.z)+.5,z:stop.z,span:mobile?23:17,bearing:.38+stop.bearing};
    }
    const from=waypoint(pose.previous),to=waypoint(pose.index),t=pose.flight;
    const position=pose.index<0?to:{x:THREE.MathUtils.lerp(from.x,to.x,t),y:THREE.MathUtils.lerp(from.y,to.y,t),z:THREE.MathUtils.lerp(from.z,to.z,t),span:THREE.MathUtils.lerp(from.span,to.span,t)+Math.sin(t*Math.PI)*2.5,bearing:THREE.MathUtils.lerp(from.bearing,to.bearing,t)};
    desired.set(position.x,position.y,position.z);
    const follow=reduced||!initialized?1:1-Math.exp(-dt*8);
    target.lerp(desired,follow);span=THREE.MathUtils.lerp(span,position.span,follow);
    bearing=THREE.MathUtils.lerp(bearing,position.bearing+pointer.turn,follow);
    elevation=THREE.MathUtils.lerp(elevation,.72+pointer.tilt,follow);
    localPointer.x=THREE.MathUtils.lerp(localPointer.x,reduced?0:pointer.x,follow);
    localPointer.y=THREE.MathUtils.lerp(localPointer.y,reduced?0:pointer.y,follow);
    const orbit=bearing+localPointer.x*.025,pitch=elevation+localPointer.y*.016;
    camera.position.copy(target).add(new THREE.Vector3(Math.sin(orbit)*Math.cos(pitch),Math.sin(pitch),Math.cos(orbit)*Math.cos(pitch)).multiplyScalar(54));
    camera.lookAt(target);
    const aspect=width/height,shift=mobile?0:(pose.index<0?.1:THREE.MathUtils.lerp(pose.previous<0?.1:.22,.22,t));
    camera.left=-span*aspect*(.5+shift);camera.right=span*aspect*(.5-shift);
    const vertical=mobile?(pose.index<0?-.15:-.17):0;
    camera.top=span*(.5+vertical);camera.bottom=-span*(.5-vertical);camera.updateProjectionMatrix();
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    terrain.setProgress(pose.index<0?0:Math.max(0,pose.index-1+t)/6);
    landmarks.materials.forEach((materials,index)=>materials.forEach((material,j)=>{
      const strength=pose.index===index?pose.ink:0;
      material.uniforms.uAccent.value=THREE.MathUtils.lerp(material.uniforms.uAccent.value,strength*(j===0?.32:1),follow);
    }));
    halo.visible=pose.index>=0;
    if(pose.index>=0){
      const stop=mapStops[pose.index],y=groundHeight(stop.x,stop.z);
      halo.position.set(stop.x,y+.055,stop.z);(halo.material as THREE.MeshBasicMaterial).opacity=pose.ink*.28;
      dust.position.set(stop.x,y,stop.z);dustMaterial.uniforms.uColor.value.set(stop.color);
    }
    dustMaterial.uniforms.uTime.value=seconds;dustMaterial.uniforms.uStrength.value=reduced?0:Math.sin(pose.flight*Math.PI);
    markers.forEach((marker,index)=>{
      const stop=mapStops[index];projected.set(stop.x,groundHeight(stop.x,stop.z)+3.9,stop.z).project(camera);
      const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height;
      const safe=projected.z<1&&x>(mobile?16:50)&&x<width-26&&y>70&&y<height*(mobile?.6:.81)
        &&(pose.index<0||mobile||x>width*.46);
      marker.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-100%)`;
      marker.hidden=!safe;marker.dataset.active=String(index===pose.index);
    });
    renderer.render(scene,camera);initialized=true;canvas.dataset.mapReady="true";
  }
  return {frame,dispose(){
    disposed=true;observer.disconnect();
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
    scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line||object instanceof THREE.Points){geometries.add(object.geometry);(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();delete canvas.dataset.mapReady;
  }};
}
