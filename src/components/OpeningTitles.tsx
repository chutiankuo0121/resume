import { opening } from "@/content/opening";

export default function OpeningTitles() {
  return (
    <div className="opening-titles">
      <header className="opening-identity">
        <div className="opening-identity-copy">
          <p className="opening-eyebrow">A personal constellation</p>
          <h1>{opening.name}</h1>
          <p className="opening-name" lang="en">{opening.englishName}</p>
          <p className="opening-focus">{opening.focus}</p>
        </div>
      </header>
      <div className="opening-statements">
        {opening.statements.map(({ text, english, motion }) => (
          <section className="opening-statement" data-motion={motion} key={motion}>
            {/* 读屏读取完整句子；逐字动画只用于视觉，不拆散语义。 */}
            <h2 aria-label={text}>
              <span aria-hidden="true">
                {Array.from(text).map((letter, index) => (
                  <span className="opening-letter" key={index}>{letter}</span>
                ))}
              </span>
            </h2>
            <p lang="en">{english}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
