import Image from "next/image";
import type { Ref } from "react";
import { experience } from "@/content/experience";

export default function ResumeTimeline({ ref }: { ref: Ref<HTMLElement> }) {
  return (
    <section ref={ref} id="career" className="resume-timeline" aria-label="教育与工作经历">
      <div className="career-stage" aria-hidden="true">
        <canvas className="career-particles" />
      </div>

      {/* Keep the handoff layer and the mobile navigation backdrop. */}
      <div className="career-ruler" aria-hidden="true" />

      <div className="career-periods">
        {experience.map(period => (
          <article key={period.id} id={`career-${period.id}`} className="career-period"
            aria-labelledby={`${period.id}-title`}>
            <div className="career-layout">
              <header className="career-intro">
                <h2 id={`${period.id}-title`} className="career-headline">
                  {(period.statement || period.title).split("，").map((part, i, parts) => (
                    <span key={i}>{part}{i < parts.length - 1 ? "，" : ""}</span>
                  ))}
                </h2>
                <div className="career-identity">
                  <p className="career-entry-date">{period.years}</p>
                  <p className="career-affiliation">
                    <span className="career-company">{period.title}</span>{" "}
                    <span className="career-role">{period.role}</span>
                  </p>
                </div>
                <div className="career-rule" aria-hidden="true" />
              </header>
              <div className="career-opening" aria-hidden="true" />
              <div className="career-copy">
                {period.introduction && <p className="career-description">{period.introduction}</p>}
                {"illustration" in period && (
                  <div className="career-art-track">
                    <figure className="career-illustration">
                      <Image
                        src={period.illustration.src} alt={period.illustration.alt}
                        width={period.illustration.width} height={period.illustration.height}
                        sizes="(max-width: 799px) calc(100vw - 48px), (max-width: 903px) calc(100vw - 144px), 760px"
                        loading="eager"
                      />
                    </figure>
                  </div>
                )}
                <div className="career-story">
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
