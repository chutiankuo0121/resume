import Image from "next/image";
import type { Ref } from "react";
import { experience } from "@/content/experience";

export default function ResumeTimeline({ ref }: { ref: Ref<HTMLElement> }) {
  return (
    <section
      ref={ref}
      id="career"
      className="resume-timeline"
      aria-label="Experience timeline"
    >
      <div className="career-ruler" aria-hidden="true" />
      <div className="career-periods">
        {experience.map((period) => (
          <article
            key={period.id}
            id={`career-${period.id}`}
            className="career-period"
            data-compact={period.compact}
            data-landscape={period.width > period.height}
            aria-labelledby={`${period.id}-title`}
          >
            <div className="career-stage">
              <div className="career-background" aria-hidden="true">
                <Image src={period.background} alt="" fill sizes="100vw" />
              </div>
              <div className="career-layout">
                <p className="career-years">{period.years}</p>
                <div className="career-intro">
                  <h2 id={`${period.id}-title`}>{period.title}</h2>
                  <p className="career-role">{period.role}</p>
                  <p className="career-description">{period.introduction}</p>
                </div>
                <div className="career-story">
                  <p className="career-statement">
                    {period.statement.split("，").map((part, index, parts) => (
                      <span key={index}>{part}{index < parts.length - 1 ? "，" : ""}</span>
                    ))}
                  </p>
                  <p className="career-detail">{period.description}</p>
                  {"projects" in period && (
                    <div className="career-projects">
                      {period.projects.map((project) => (
                        <a className="career-project" key={project.href} href={project.href} target="_blank" rel="noopener noreferrer">
                          {project.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <figure className="career-visual">
                  <Image
                    src={period.image}
                    alt={period.imageAlt}
                    width={period.width}
                    height={period.height}
                    sizes="(max-width: 799px) 85vw, (max-width: 1599px) 40vw, 640px"
                  />
                  <figcaption>{period.caption}</figcaption>
                </figure>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
