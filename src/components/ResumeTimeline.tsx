import Image from "next/image";
import type { CSSProperties, Ref } from "react";
import { experience } from "@/content/experience";
import CareerDiagram from "./CareerDiagram";

export default function ResumeTimeline({ ref }: { ref: Ref<HTMLElement> }) {
  return (
    <section ref={ref} id="career" className="resume-timeline" aria-label="教育与工作经历">
      <div className="career-stage" aria-hidden="true">
        {experience.map((period, index) => (
          <div className="career-backdrop" data-scene={period.scene} key={period.id}
            style={{ zIndex: index, "--scene-position": period.position } as CSSProperties}>
            <div className="career-picture">
              <Image src={period.background} alt="" fill sizes="100vw" loading={index === 0 ? "eager" : "lazy"} />
            </div>
          </div>
        ))}
      </div>

      {/* One date slot for the entire chapter: rotated sticky labels cannot stack. */}
      <div className="career-ruler" aria-hidden="true">
        <div className="career-date">
          <span className="career-years">{experience[0].years}</span>
          <span className="career-era">教育经历</span>
        </div>
        <div className="career-reading">
          <span className="career-current">01</span>
          <div className="career-reading-track"><span /></div>
          <span className="career-total">{String(experience.length).padStart(2, "0")}</span>
        </div>
      </div>

      <div className="career-periods">
        {experience.map((period, index) => (
          <article key={period.id} id={`career-${period.id}`} className="career-period"
            data-years={period.years} data-era={index === 0 ? "教育经历" : "工作经历"}
            aria-labelledby={`${period.id}-title`}>
            <div className="career-layout">
              <div className="career-copy">
                <header className="career-intro">
                  <p className="career-entry-date">{period.years}</p>
                  <p className="career-role">{period.role}</p>
                  <h2 id={`${period.id}-title`}>{period.title}</h2>
                  {period.introduction && <p className="career-description">{period.introduction}</p>}
                </header>
                {"illustration" in period && (
                  <div className="career-art-track">
                    <figure className="career-illustration">
                      <Image
                        src={period.illustration.src} alt={period.illustration.alt}
                        width={period.illustration.width} height={period.illustration.height}
                        sizes="(max-width: 799px) calc(100vw - 51px), (max-width: 1199px) 49vw, 40vw"
                        loading="eager"
                      />
                    </figure>
                  </div>
                )}
                {"diagram" in period && (
                  <div className="career-art-track career-art-track--diagram">
                    <figure className="career-illustration career-illustration--diagram">
                      <CareerDiagram kind={period.diagram} />
                    </figure>
                  </div>
                )}
                <div className="career-story">
                  {period.statement && <p className="career-statement">
                    {period.statement.split("，").map((part, i, parts) => (
                      <span key={i}>{part}{i < parts.length - 1 ? "，" : ""}</span>
                    ))}
                  </p>}
                  <div className="career-sections">
                    {period.sections.map((section, i) => (
                      <section className="career-copy-section" key={i}>
                        {section.heading && <h3>{section.heading}</h3>}
                        {section.paragraphs.map((paragraph, j) => (
                          <p key={j} className={`career-paragraph${/^\d+\.\s/.test(paragraph) ? " career-paragraph--numbered" : ""}`}>{paragraph}</p>
                        ))}
                      </section>
                    ))}
                  </div>
                  {"projects" in period && (
                    <div className="career-projects">
                      {period.projects.map(project => (
                        <a className="career-project" key={project.href} href={project.href} target="_blank" rel="noopener noreferrer">{project.label}</a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
