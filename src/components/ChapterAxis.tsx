import type { Ref } from "react";
import type { Chapter } from "@/lib/transition";
import SoundToggle from "./sound/SoundToggle";

type Props = {
  ref: Ref<HTMLElement>;
  current: Chapter;
  onNavigate: (chapter: Chapter) => void;
  soundHidden?: boolean;
};

const chapters = [
  { id: "intro", number: "01/", label: "序章" },
  { id: "crystal", number: "02/", label: "晶石" },
  { id: "career", number: "03/", label: "经历" },
  { id: "explore", number: "04/", label: "探索" },
  { id: "contact", number: "05/", label: "联系" },
] as const;

function AxisText({ text }: { text: string }) {
  return (
    <span className="axis-text">
      {Array.from(text, (character, index) => (
        <span className="axis-glyph" key={index}>{character}</span>
      ))}
    </span>
  );
}

export default function ChapterAxis({ ref, current, onNavigate, soundHidden }: Props) {
  return (
    <nav ref={ref} className="chapter-axis" aria-label="章节导航">
      <div className="axis-bar">
        <span className="axis-title"><AxisText text="目录" /></span>
        {!soundHidden && <SoundToggle />}
        <ol className="axis-items">
          {chapters.map(({ id, number, label }) => (
            <li className="axis-item" key={id}>
              <button
                className="axis-link"
                data-chapter={id}
                aria-label={`前往${label}`}
                aria-current={current === id ? "step" : undefined}
                onClick={() => onNavigate(id)}
              >
                <span className="axis-number">{number}</span>
                <span className="axis-label"><AxisText text={label} /></span>
                {/* 反色覆盖层与正文同位置，遮罩只显示当前章节已经走过的部分。 */}
                <span className="axis-fill" aria-hidden="true">
                  <span className="axis-number">{number}</span>
                  <span className="axis-label"><AxisText text={label} /></span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
