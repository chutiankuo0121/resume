import { opening } from "@/content/opening";

export default function OpeningTitles() {
  return (
    <div className="opening-titles">
      {opening.scenes.map(({ id, world, lines, translation }, index) => {
        const Heading = index === 0 ? "h1" : "h2";
        return (
          <section className="opening-beat" data-world={world} key={id}>
            <div className="opening-beat-copy">
              <Heading className="opening-chinese" lang="zh-CN">
                {world === "crystal"
                  ? lines.map(line => <span className="opening-fragment" key={line}>{line}</span>)
                  : lines.join("")}
              </Heading>
              {world === "hole" && (
                <p className="opening-translation" lang="en">{translation.join(" ")}</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
