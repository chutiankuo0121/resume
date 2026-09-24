"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createScene } from "@/lib/createScene";
import { createTransitionTimeline, type Chapter } from "@/lib/transition";
import ChapterAxis from "./ChapterAxis";
import ScrollIndicator from "./ScrollIndicator";
import Scrollbar from "./Scrollbar";
import ResumeTimeline from "./ResumeTimeline";
import ExploreHub from "./ExploreHub";
import Contact from "./Contact";
import OpeningTitles from "./OpeningTitles";
import { opening } from "@/content/opening";
import { loadTypography } from "@/lib/typography";
import LoadingPrelude from "./LoadingPrelude";
import { createLoadingProgress } from "@/lib/loading/progress";
import { preloadPreviews } from "@/lib/loading/previews";
import ChapterMasks from "./ChapterMasks";
import Soundscape from "./sound/Soundscape";

export default function AstraExperience() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const journey = useRef<HTMLDivElement>(null);
  const career = useRef<HTMLElement>(null);
  const explore = useRef<HTMLElement>(null);
  const contact = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const axis = useRef<HTMLElement>(null);
  const prelude = useRef<HTMLElement>(null);
  const masks = useRef<SVGSVGElement>(null);
  const readyRef = useRef(false);
  const exploringRef = useRef(false);
  const timeline = useRef<ReturnType<typeof createTransitionTimeline> | null>(
    null,
  );
  const [chapter, setChapter] = useState<Chapter>("intro");
  const [ready, setReady] = useState(false);
  const [exploring, setExploring] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (
      !canvas.current ||
      !journey.current ||
      !stage.current ||
      !axis.current ||
      !career.current ||
      !explore.current ||
      !contact.current ||
      !prelude.current ||
      !masks.current
    )
      return;
    const scroll = createTransitionTimeline(
      journey.current,
      stage.current,
      axis.current,
      career.current,
      explore.current,
      contact.current,
      masks.current,
      setChapter,
    );
    timeline.current = scroll;
    let disposed = false;
    const previewAbort = new AbortController();
    readyRef.current = false;
    scroll.setPaused(true);
    const loading = createLoadingProgress(scroll.clock, prelude.current, () => {
      if (disposed) return;
      readyRef.current = true;
      setReady(true);
      scroll.setPaused(exploringRef.current);
      // 初次定位发生在增强布局之前；加载结束后对齐真实锚点，避免停在不可点击的转场中。
      const anchor = location.hash.slice(1);
      if (!exploringRef.current && (anchor === "explore" || anchor === "contact"))
        scroll.seek(anchor, true);
    });
    const fail = (message: string) => {
      if (disposed) return;
      loading.fail();
      previewAbort.abort();
      readyRef.current = false;
      scroll.setPaused(true);
      setReady(false);
      setError(message);
    };
    void preloadPreviews(progress => {
      if (!disposed) loading.update("previews", progress);
    }, previewAbort.signal).then(failures => {
      if (disposed || previewAbort.signal.aborted || !failures.length) return;
      console.warn("部分预览图片预载未完成，页面展示时将再次请求:", failures);
    }).catch(error => {
      if (disposed || previewAbort.signal.aborted) return;
      console.warn("预览资源预载未完成，保留页面按需加载:", error);
      loading.complete("previews");
    });
    // 开场与字体一起就绪，避免首屏先闪现系统字体再突然换字形。
    void loadTypography([
      opening.name, opening.englishName, opening.focus,
      "0123456789%",
      ...opening.statements.map(({ text, english }) => `${text} ${english}`),
    ].join(" ")).then(() => {
      if (!disposed) loading.complete("fonts");
    }).catch(() => fail("开场字体载入失败，请重新加载预览。"));
    const disposeScene = createScene({
      canvas: canvas.current,
      transition: scroll.state,
      clock: scroll.clock,
      loading: loading.state,
      onProgress: loading.complete,
      onReady: () => loading.complete("scene"),
      onError: fail,
    });
    return () => {
      disposed = true;
      previewAbort.abort();
      loading.dispose();
      disposeScene();
      scroll.dispose();
      timeline.current = null;
    };
  }, [retry]);

  const setExplorationOpen = useCallback((open: boolean) => {
    exploringRef.current = open;
    setExploring(open);
    timeline.current?.setExploring(open);
    timeline.current?.setPaused(open || !readyRef.current);
  }, []);

  const prepareExplorationOpen = useCallback((complete: () => void) => {
    if (timeline.current) return timeline.current.prepareExploreOpen(complete);
    complete();
  }, []);

  const returnToExplore = useCallback(() => {
    timeline.current?.prepareExploreReturn();
  }, []);

  function reload() {
    readyRef.current = false;
    setError("");
    setReady(false);
    setRetry((value) => value + 1);
  }

  return (
    <Soundscape ready={ready && !error}>
    <main
      id="journey"
      className={`astra ${ready ? "is-ready" : ""}`}
      data-exploring={exploring}
      data-loading={!ready}
    >
      <div ref={journey} className="journey" inert={exploring || !ready}>
        <div ref={stage} className={`experience ${ready ? "is-ready" : ""}`}>
          <canvas
            ref={canvas}
            className="scene"
            aria-label="黑洞雾气与悬浮晶石，滚动切换场景，移动鼠标转动晶石"
          />
          <OpeningTitles />
          <ScrollIndicator />
        </div>
      </div>
      <div inert={exploring || !ready}>
        <ResumeTimeline ref={career} />
      </div>
      <div className="chapter-gap chapter-gap--entry" aria-hidden="true" />
      <div inert={!ready}>
        <ExploreHub
          ref={explore}
          onOpenChange={setExplorationOpen}
          onReturnToExplore={returnToExplore}
          onPrepareOpen={prepareExplorationOpen}
        />
      </div>
      <div className="chapter-gap chapter-gap--exit" aria-hidden="true" />
      <Contact ref={contact} inactive={exploring || !ready} />
      <ChapterMasks ref={masks} />
      <ChapterAxis
        ref={axis}
        current={chapter}
        soundHidden={exploring}
        onNavigate={(target) => timeline.current?.seek(target)}
      />
      {ready && !error && (
        <Scrollbar
          onScrollTo={(position) => timeline.current?.scrollTo(position)}
        />
      )}
      {!ready && (
        <LoadingPrelude key={retry} ref={prelude} error={error} onRetry={reload} />
      )}
    </main>
    </Soundscape>
  );
}
