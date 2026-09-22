import type { ProjectWork } from "@/content/works";

/** 项目指标与职责随作品数据维护，收录媒体仍沿用简洁详情。 */
export default function ProjectCaseStudy({ work }: { work: ProjectWork }) {
  const { caseStudy } = work;
  return (
    <section className="work-case-study" aria-label="项目成果与实现">
      <p className="work-case-role">项目职责 / {caseStudy.role}</p>
      <dl className="work-case-metrics">
        {caseStudy.metrics.map((metric) => (
          <div key={metric.label}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
      <p className="work-case-note">{caseStudy.metricNote}</p>
      <div className="work-case-sections">
        {caseStudy.sections.map((section) => (
          <section key={section.title}>
            <h4>{section.title}</h4>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
    </section>
  );
}
