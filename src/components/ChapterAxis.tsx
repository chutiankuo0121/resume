import type { Ref } from "react";
import type { Chapter } from "@/lib/transition";

type Props = {
  ref: Ref<HTMLElement>;
  current: Chapter;
  onNavigate: (chapter: Chapter) => void;
};

const chapters = [
  { id: "intro", number: "01/", label: "Prologue" },
  { id: "crystal", number: "02/", label: "Crystal" },
  { id: "career", number: "03/", label: "Journey" },
  { id: "explore", number: "04/", label: "Explore" },
  { id: "contact", number: "05/", label: "Contact" },
] as const;

export default function ChapterAxis({ ref, current, onNavigate }: Props) {
  return (
    <nav ref={ref} className="chapter-axis" aria-label="Chapters">
      <div className="axis-bar">
        <span className="axis-title">Index</span>
        <ol className="axis-items">
          {chapters.map(({ id, number, label }) => (
            <li className="axis-item" key={id}>
              <button
                className="axis-link"
                aria-label={`Go to ${label}`}
                aria-current={current === id ? "step" : undefined}
                onClick={() => onNavigate(id)}
              >
                <span className="axis-number">{number}</span>
                <span className="axis-label">{label}</span>
                {/* 反色覆盖层与正文同位置，遮罩只显示当前章节已经走过的部分。 */}
                <span className="axis-fill" aria-hidden="true">
                  <span className="axis-number">{number}</span>
                  <span className="axis-label">{label}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
