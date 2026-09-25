import type { Ref, CSSProperties } from "react";
import { experience } from "@/content/experience";
import { mapStops, MAP_RUNWAY } from "@/lib/career/map/stops";

export default function ResumeTimeline({ ref }: { ref: Ref<HTMLElement> }) {
  return (
    <section ref={ref} id="career" className="resume-timeline career-atlas" aria-label="个人经历地图">
      <div className="career-ruler" aria-hidden="true" />
      <div className="career-periods">
        <div className="career-period" style={{"--map-runway":MAP_RUNWAY+1} as CSSProperties}>
          <div className="career-stage">
            <div className="atlas-world">
              <svg className="atlas-fallback" viewBox="0 0 1000 650" aria-hidden="true">
                <path d="M140 350 Q160 150 420 150 T890 300 Q980 470 710 520 T140 350Z" />
                <path className="atlas-fallback-route" d="M190 380 Q200 240 330 250 T400 430 T530 340 T670 410 T760 250 T860 340" />
                {mapStops.map(stop=><g key={stop.label} transform={`translate(${150+(stop.x+22)*13},${280+stop.z*12})`}><circle r="9"/><text y="-20" textAnchor="middle">{stop.place}</text></g>)}
              </svg>
              <canvas className="atlas-canvas" aria-label="手绘风格三维经历地图：校园、研究馆、港口、工坊、创作空间、实验室与观测站" />
              <div className="atlas-paper-grain" aria-hidden="true" />
              <div className="atlas-markers" aria-label="地图地点">
                {mapStops.map((stop,index)=><button key={stop.label} className="atlas-marker" data-map-stop={index} aria-label={`前往${stop.place}，${stop.label}`}><span>{String(index+1).padStart(2,"0")}</span><strong>{stop.place}</strong><i/></button>)}
              </div>
              <div className="atlas-masthead"><span>褚天阔</span><span>个人经历 / JOURNEY ATLAS</span></div>
              <button className="atlas-overview-button" data-map-stop="-1"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6 9 3l6 3 6-3v15l-6 3-6-3-6 3Z M9 3v15 M15 6v15"/></svg>全览地图</button>
              <header className="atlas-intro career-intro">
                <p className="atlas-eyebrow">教育与工作经历</p>
                <h2>所行，<br/>皆有回响。</h2>
                <p className="atlas-deck">从金融工程出发，<br/>走过研究、创作与产品，<br/>在探索中连接下一段可能。</p>
                <button className="atlas-start" data-map-stop="0">从这里出发 <span>↗</span></button>
              </header>
              <div className="atlas-readings">
                {experience.map((entry,index)=><article key={entry.id} className="atlas-reading" data-map-reading={index} aria-labelledby={`atlas-${entry.id}`}>
                  <p className="atlas-eyebrow">{String(index+1).padStart(2,"0")} / {entry.years}</p>
                  <p className="atlas-company">{entry.title}</p>
                  <h2 id={`atlas-${entry.id}`}>{entry.role}</h2>
                  <p className="atlas-summary">{mapStops[index].summary}</p>
                  <button className="atlas-read-button" data-map-read={index}>阅读这段经历 <span>＋</span></button>
                </article>)}
              </div>
              <div className="atlas-compass" aria-hidden="true"><span>N</span><svg viewBox="0 0 60 60"><path d="M30 4 35 26 56 30 35 34 30 56 25 34 4 30 25 26Z"/><path d="M30 4v52M4 30h52"/></svg></div>
              <footer className="atlas-footer">
                <p className="atlas-instruction">滚动沿途探索 <span>· 拖动转动地图</span></p>
                <nav className="atlas-route" aria-label="经历地点导航">
                  {mapStops.map((stop,index)=><button key={stop.label} data-map-stop={index}><span>{String(index+1).padStart(2,"0")}</span><i/><strong>{stop.label}</strong></button>)}
                </nav>
                <div className="atlas-footer-meta"><span>一幅关于成长的意象地图</span><span>大学 — 2026</span></div>
              </footer>
            </div>
          </div>
        </div>
      </div>
      <dialog className="atlas-dialog" aria-label="完整经历" data-lenis-prevent>
        <form method="dialog"><button className="atlas-dialog-close" aria-label="关闭经历详情">关闭 <span>×</span></button></form>
        <div className="atlas-dialog-scroll" data-lenis-prevent>
          {experience.map((entry,index)=><article key={entry.id} data-map-detail={index}>
            <p className="atlas-eyebrow">{String(index+1).padStart(2,"0")} / {entry.years}{entry.location && ` / ${entry.location}`}</p>
            <p className="atlas-company">{entry.title}</p><h2>{entry.role}</h2>
            {entry.pages.map((page,pageIndex)=><section key={pageIndex}>{page.heading&&<h3>{page.heading}</h3>}{page.paragraphs.map((p,i)=><p key={i}>{p}</p>)}</section>)}
            {entry.projects&&<div className="atlas-projects">{entry.projects.map(project=><a key={project.href} href={project.href} target="_blank" rel="noopener noreferrer">{project.label}</a>)}</div>}
          </article>)}
        </div>
      </dialog>
    </section>
  );
}
