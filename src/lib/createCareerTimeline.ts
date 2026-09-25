import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mapPose, mapStopTime, MAP_RUNWAY } from "./career/map/stops";
import type { createMapScene } from "./career/map/createMapScene";

export function createCareerTimeline(root: HTMLElement, scrollTo: (position: number) => void, pause: (paused: boolean) => void) {
  gsap.registerPlugin(ScrollTrigger);
  const stage=root.querySelector<HTMLElement>(".career-stage")!;
  const period=root.querySelector<HTMLElement>(".career-period")!;
  const canvas=root.querySelector<HTMLCanvasElement>(".atlas-canvas")!;
  const intro=root.querySelector<HTMLElement>(".atlas-intro")!;
  const panels=[...root.querySelectorAll<HTMLElement>(".atlas-reading")];
  const markers=[...root.querySelectorAll<HTMLElement>(".atlas-marker")];
  const links=[...root.querySelectorAll<HTMLElement>("[data-map-stop]")];
  const dialog=root.querySelector<HTMLDialogElement>(".atlas-dialog")!;
  const details=[...dialog.querySelectorAll<HTMLElement>("[data-map-detail]")];
  const media=matchMedia("(prefers-reduced-motion: reduce)");
  let units=0,start=0,height=innerHeight,disposed=false,scene:ReturnType<typeof createMapScene>|undefined;
  let staticMode=false,lastTime=gsap.ticker.time,renderedOnce=false,focusBefore:HTMLElement|null=null;
  const pointer={x:0,y:0,turn:0,tilt:0};
  const drag={active:false,id:-1,x:0,y:0,turn:0,tilt:0};
  function paint() {
    const pose=mapPose(units);
    root.dataset.mapIndex=String(pose.index);
    intro.style.opacity=pose.index<0?String(pose.text):"0";
    intro.style.visibility=pose.index<0?"visible":"hidden";
    intro.inert=pose.index>=0;
    panels.forEach((panel,index)=>{
      const visible=index===pose.index;
      panel.style.opacity=visible?String(pose.text):"0";
      panel.style.visibility=visible?"visible":"hidden";
      panel.style.transform="translateY("+(visible?(1-pose.text)*14:14)+"px)";
      panel.inert=!visible||pose.text<.05;
      panel.setAttribute("aria-hidden",String(!visible));
    });
    links.forEach(link=>{
      const active=Number(link.dataset.mapStop)===pose.index;
      if(active)link.setAttribute("aria-current","step");else link.removeAttribute("aria-current");
    });
  }
  function layout() {
    const next=media.matches||innerHeight<620;
    if(next!==staticMode){staticMode=next;if(next)units=0;}
    root.toggleAttribute("data-map-static",staticMode);
    height=stage.clientHeight||innerHeight;
    paint();
  }
  layout();
  const trigger=ScrollTrigger.create({trigger:period,start:"top top",end:"bottom bottom",invalidateOnRefresh:true,
    onUpdate(self){if(!staticMode){units=Math.max(0,Math.min(MAP_RUNWAY,(self.scroll()-self.start)/height));paint();}},
    onRefresh(self){start=self.start;height=stage.clientHeight||innerHeight;if(!staticMode)units=Math.max(0,Math.min(MAP_RUNWAY,(self.scroll()-start)/height));paint();}
  });
  function resize(){layout();ScrollTrigger.refresh();}
  window.addEventListener("resize",resize);media.addEventListener("change",resize);
  void import("./career/map/createMapScene").then(({createMapScene})=>{
    if(disposed)return;
    try{scene=createMapScene(canvas,markers);root.dataset.mapRenderer="ready";}
    catch(error){root.dataset.mapRenderer="fallback";console.warn("经历地图使用平面导航回退:",error);}
  }).catch(error=>{if(!disposed){root.dataset.mapRenderer="fallback";console.warn("经历地图载入失败:",error);}});
  function tick(time:number){
    const dt=Math.min(.05,Math.max(0,time-lastTime));lastTime=time;
    if(!scene||document.hidden||dialog.open)return;
    const box=stage.getBoundingClientRect();
    if(renderedOnce&&(box.bottom<0||box.top>innerHeight*1.2))return;
    scene.frame(units,time,dt,pointer,staticMode);renderedOnce=true;
  }
  gsap.ticker.add(tick);
  function click(event:MouseEvent){
    const target=event.target as Element;
    const read=target.closest<HTMLElement>("[data-map-read]");
    if(read){
      const index=Number(read.dataset.mapRead);
      details.forEach((detail,i)=>detail.hidden=i!==index);
      focusBefore=read;dialog.showModal();pause(true);
      dialog.querySelector<HTMLElement>(".atlas-dialog-scroll")!.scrollTop=0;
      return;
    }
    const stop=target.closest<HTMLElement>("[data-map-stop]");
    if(!stop)return;
    pointer.turn=pointer.tilt=0;
    const time=mapStopTime(Number(stop.dataset.mapStop));
    if(staticMode){units=time;paint();}else scrollTo(start+time*height);
  }
  function close(){if(!disposed){pause(false);focusBefore?.focus({preventScroll:true});}}
  function backdrop(event:MouseEvent){if(event.target===dialog)dialog.close();}
  function pointerMove(event:PointerEvent){
    if(event.pointerType==="touch")return;
    pointer.x=(event.clientX/innerWidth-.5)*2;pointer.y=(event.clientY/innerHeight-.5)*2;
    if(!drag.active||event.pointerId!==drag.id)return;
    pointer.turn=Math.max(-.7,Math.min(.7,drag.turn+(event.clientX-drag.x)*.003));
    pointer.tilt=Math.max(-.22,Math.min(.2,drag.tilt+(event.clientY-drag.y)*.0015));
  }
  function down(event:PointerEvent){
    if(event.button!==0||event.pointerType==="touch"||staticMode)return;
    drag.active=true;drag.id=event.pointerId;drag.x=event.clientX;drag.y=event.clientY;drag.turn=pointer.turn;drag.tilt=pointer.tilt;
    canvas.setPointerCapture(event.pointerId);canvas.dataset.dragging="";
  }
  function up(event:PointerEvent){if(drag.id!==event.pointerId)return;drag.active=false;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);delete canvas.dataset.dragging;}
  function leave(){if(!drag.active){pointer.x=pointer.y=0;}}
  root.addEventListener("click",click);dialog.addEventListener("click",backdrop);dialog.addEventListener("close",close);
  root.addEventListener("pointermove",pointerMove,{passive:true});root.addEventListener("pointerleave",leave);
  canvas.addEventListener("pointerdown",down);canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);
  return {dispose(){
    disposed=true;gsap.ticker.remove(tick);trigger.kill();scene?.dispose();
    if(dialog.open)dialog.close();
    root.removeEventListener("click",click);dialog.removeEventListener("click",backdrop);dialog.removeEventListener("close",close);
    root.removeEventListener("pointermove",pointerMove);root.removeEventListener("pointerleave",leave);
    canvas.removeEventListener("pointerdown",down);canvas.removeEventListener("pointerup",up);canvas.removeEventListener("pointercancel",up);
    window.removeEventListener("resize",resize);media.removeEventListener("change",resize);
    panels.forEach(panel=>{panel.inert=false;panel.removeAttribute("aria-hidden");panel.removeAttribute("style");});
    intro.inert=false;intro.removeAttribute("style");
    links.forEach(link=>link.removeAttribute("aria-current"));
    delete root.dataset.mapRenderer;delete root.dataset.mapIndex;delete root.dataset.mapStatic;
  }};
}
