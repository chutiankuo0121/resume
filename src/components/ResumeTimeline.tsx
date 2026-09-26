import Image from "next/image";
import type { Ref } from "react";
import { experience } from "@/content/experience";
import CareerDiagram from "./CareerDiagram";

export default function ResumeTimeline({ ref }: { ref: Ref<HTMLElement> }) {
  return (
    <section ref={ref} id="career" className="resume-timeline" aria-label="教育与工作经历">
      <div className="career-stage" aria-hidden="true">
        <canvas className="career-dust" aria-hidden="true" />
      </div>

      {/* Original left-hand ruler; one shared desktop date prevents rotated labels stacking. */}
      <div className="career-ruler" aria-hidden="true">
        <div className="career-date">
          <span className="career-years">{experience[0].years}</span>
        </div>
      </div>

      <div className="career-periods">
        {experience.map(period => (
          <article key={period.id} id={`career-${period.id}`} className="career-period"
            data-years={period.years}
            aria-labelledby={`${period.id}-title`}>
            <div className="career-layout">
              <div className="career-copy">
                <p className="career-entry-date">{period.years}</p>
                <header className="career-intro">
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
