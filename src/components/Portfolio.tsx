import { useEffect, useRef, useState } from "react";
import type { createPortfolioScene } from "@/lib/portfolio/createScene";
import { preloadWorkDetail, useWorkDetail } from "./works/useWorkDetail";
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
  const { detail, error: detailError, open, clear } = useWorkDetail();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    let started = false;
    async function load() {
      if (started || abort.signal.aborted) return;
      started = true;
      performance.mark("portfolio:prepare");
      try {
        const [{ createPortfolioScene }, { portfolioMedia, works }] = await Promise.all([
          import("@/lib/portfolio/createScene"), import("@/content/works/gallery"),
        ]);
        const audioTitles = works.filter(work => work.kind === "audio")
          .map(work => `${work.title} ${work.author}`).join(" ");
        await loadTypography(`Selected works. AI / TOOLS / VISUAL EXPLORATIONS ${audioTitles}`);
        if (abort.signal.aborted) return;
        const control = createPortfolioScene({
          presentation,
          canvas: canvas.current!,
          root: root.current!,
          media: portfolioMedia,
          onReady: () => setReady(true),
          onSelect: work => { void open(work.id); },
          onIntent: preloadWorkDetail,
        });
        scene.current = control;
      } catch {
        if (!abort.signal.aborted)
          setError("The 3D view could not load. Please refresh to try again.");
      }
    }
    // 保留同一个实时场景；在经历末段提前准备，首页不争抢整库媒体连接。
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void load();
    }, { rootMargin: "1600px" });
    observer.observe(root.current!);
    function followLocation() {
      if (["#work", "#explore"].includes(location.hash)) void load();
    }
    followLocation();
    window.addEventListener("hashchange", followLocation);
    const element = root.current!;
    const activate = () => { if (presentation.expansion > 0) void load(); };
    element.addEventListener("portal-update", activate);
    return () => {
      abort.abort();
      observer.disconnect();
      window.removeEventListener("hashchange", followLocation);
      element.removeEventListener("portal-update", activate);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [presentation, open]);

  useEffect(() => {
    if (!enabled) {
      clear();
      scene.current?.restore();
    }
  }, [enabled, clear]);

  useEffect(() => {
    if (detailError) scene.current?.restore();
  }, [detailError]);

  function close() {
    clear();
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
        {(error || detailError) && (
          <p className="work-status" role="alert">
            {error || detailError}
          </p>
        )}
        {detail && <detail.Component key={detail.work.id} work={detail.work} onClose={close} />}
      </div>
    </section>
  );
}
