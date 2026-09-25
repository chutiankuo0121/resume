import Image from "next/image";
import type { Ref, CSSProperties } from "react";
import { experience } from "@/content/experience";
import { careerCollagePaths } from "@/lib/career/collage";
import { careerRunway } from "@/lib/career/choreography";

export default function ResumeTimeline({ ref }: { ref: Ref<HTMLElement> }) {
  return (
    <section ref={ref} id="career" className="resume-timeline" aria-label="教育与工作经历">
      <div className="career-ruler" aria-hidden="true" />
      <div className="career-periods">
        {experience.map((period, index) => {
          const paths = careerCollagePaths(index);
          const prefix = `career-paper-${index}`;
          return (
            <article key={period.id} id={`career-${period.id}`} className="career-period"
              data-career-index={index} aria-labelledby={`${period.id}-title`}
              style={{ "--career-ink": period.ink, "--career-runway": careerRunway(period.pages.length) + 1 } as CSSProperties}>
              <div className="career-stage">
                <div className="career-scene">
                  <div className="career-paper" aria-hidden="true" />
                  <figure className="career-visual" role="img" aria-label={period.imageAlt}>
                    <svg className="career-defs" aria-hidden="true">
                      <defs>
                        <mask id={`${prefix}-background`} maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox" x="0" y="0" width="1" height="1" style={{ maskType: "luminance" }}>
                          <rect width="1" height="1" fill="white" />
                          <path d={paths.cutout} fill="black" />
                        </mask>
                        <clipPath id={`${prefix}-middle`} clipPathUnits="objectBoundingBox"><path d={paths.middle} /></clipPath>
                        <clipPath id={`${prefix}-front`} clipPathUnits="objectBoundingBox"><path d={paths.front} /></clipPath>
                      </defs>
                    </svg>
                    <div className="career-artboard">
                      <div className="career-background" style={{ maskImage: `url(#${prefix}-background)` }}>
                        <Image src={period.image} alt="" fill sizes="(max-width: 799px) 80vw, 60vw" loading={index === 0 ? "eager" : "lazy"} />
                      </div>
                      <div className="career-piece career-piece--middle">
                        <div className="career-cutout" style={{ clipPath: `url(#${prefix}-middle)` }}>
                          <Image src={period.image} alt="" fill sizes="(max-width: 799px) 80vw, 60vw" />
                        </div>
                      </div>
                      <div className="career-piece career-piece--front">
                        <div className="career-cutout" style={{ clipPath: `url(#${prefix}-front)` }}>
                          <Image src={period.image} alt="" fill sizes="(max-width: 799px) 80vw, 60vw" />
                        </div>
                      </div>
                    </div>
                  </figure>
                  <div className="career-layout">
                    <header className="career-intro">
                      <div className="career-dateline"><span>{String(index + 1).padStart(2, "0")} / {String(experience.length).padStart(2, "0")}</span><p className="career-years">{period.years}</p></div>
                      <p className="career-company">{period.title}{period.location && <span> · {period.location}</span>}</p>
                      <h2 id={`${period.id}-title`}>{period.role}</h2>
                    </header>
                    <div className="career-story">
                      {period.pages.map((page, pageIndex) => (
                        <div className="career-copy-page" key={pageIndex} data-copy-page={pageIndex}>
                          {page.heading && <h3>{page.heading}</h3>}
                          {page.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
                          {period.projects && pageIndex === period.pages.length - 1 && (
                            <div className="career-projects">{period.projects.map(project => <a key={project.href} href={project.href} target="_blank" rel="noopener noreferrer">{project.label}</a>)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                    <nav className="career-reading" aria-label={`${period.title}阅读进度`}>
                      {period.pages.map((page, pageIndex) => <button key={pageIndex} type="button" data-career-page={pageIndex} aria-label={`阅读第 ${pageIndex + 1} 部分${page.heading ? `：${page.heading}` : ""}`}><span /></button>)}
                      <span className="career-page-number" aria-hidden="true">01 / {String(period.pages.length).padStart(2, "0")}</span>
                    </nav>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
