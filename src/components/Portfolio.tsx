import { useEffect, useRef, useState } from "react";
import { works, type Work } from "@/content/works";
import { createPortfolioScene } from "@/lib/portfolio/createScene";
import { loadPortfolioMedia } from "@/lib/portfolio/media";
import WorkDetail from "./works/WorkDetail";
import type { PortalPresentation } from "@/lib/hub/presentation";
import { loadTypography } from "@/lib/typography";

export default function Portfolio({
  presentation,
  active: enabled,
}: {
  presentation: PortalPresentation;
  active: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<ReturnType<typeof createPortfolioScene> | null>(null);
  const [active, setActive] = useState<Work | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    const audioTitles = works.filter((work) => work.kind === "audio")
      .map((work) => `${work.title} ${work.source?.author ?? "Sound"}`).join(" ");
    Promise.all([
      loadPortfolioMedia(works, abort.signal),
      loadTypography(`Selected works. AI / TOOLS / VISUAL EXPLORATIONS ${audioTitles}`),
    ])
      .then(([media]) => {
        if (abort.signal.aborted) return;
        const control = createPortfolioScene({
          presentation,
          canvas: canvas.current!,
          root: root.current!,
          media,
          onReady: () => setReady(true),
          onSelect: setActive,
        });
        scene.current = control;
      })
      .catch(() => {
        if (!abort.signal.aborted)
          setError("The 3D view could not load. Please refresh to try again.");
      });
    return () => {
      abort.abort();
      scene.current?.dispose();
      scene.current = null;
    };
  }, [presentation]);

  function close() {
    setActive(null);
    scene.current?.restore();
    canvas.current?.focus({ preventScroll: true });
  }

  return (
    <section
      ref={root}
      inert={!enabled}
      id="work"
      className="portfolio"
      aria-label="Selected work"
    >
      <div className="work-stage">
        <canvas
          ref={canvas}
          className="work-canvas"
          tabIndex={0}
          aria-label="Drag, scroll or use arrow keys to explore. Click a work, or press Enter to open the centered work. Plus and minus zoom. Home returns to the collection title."
        />
        <h2 className="work-sr-only">
          Selected works — ideas in every direction
        </h2>
        {!ready && !error && (
          <p className="work-status" role="status">
            Opening the collection…
          </p>
        )}
        {error && (
          <p className="work-status" role="alert">
            {error}
          </p>
        )}
        {active && <WorkDetail key={active.id} work={active} onClose={close} />}
      </div>
    </section>
  );
}
