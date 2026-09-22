import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { GameWork } from "@/content/works";
import { WorkPlaybackContext } from "./WorkPlaybackContext";

/**
 * 一个 iframe 对应一次试玩。关闭时同步通知子页面清理，再销毁整个运行环境。
 * 原生 modal 留在作品组件内：返回作品保留详情；浏览器后退则随宿主一并卸载。
 */
export default function GamePlayer({
  work,
  onClose,
}: {
  work: GameWork;
  onClose: () => void;
}) {
  const setPlaying = useContext(WorkPlaybackContext);
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [locked, setLocked] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!setPlaying) throw new Error("GamePlayer requires WorkPlaybackContext");

  useEffect(() => {
    const element = dialog.current!;
    setPlaying(true);
    element.showModal();
    return () => {
      element.close();
      setPlaying(false);
    };
  }, [setPlaying]);

  useLayoutEffect(() => {
    const player = frame.current!;
    // 不能把 iframe 的 load 当成成功：404 页也会触发 load，等待游戏自己的就绪消息。
    let timeout = window.setTimeout(() => setStatus("error"), 30_000);
    let lastProgress = 0;
    let awaitingReady = true;
    function receive(event: MessageEvent) {
      if (
        event.origin !== location.origin ||
        event.source !== player.contentWindow ||
        event.data?.channel !== "astra-game"
      )
        return;
      switch (event.data.type) {
        case "progress": {
          // Godot 的资源包较大；下载有新进展时继续等待，停滞才显示重试。
          const value = event.data.progress;
          if (
            !awaitingReady ||
            typeof value !== "number" ||
            !Number.isFinite(value) ||
            value <= lastProgress ||
            value > 1
          )
            break;
          lastProgress = value;
          clearTimeout(timeout);
          timeout = window.setTimeout(() => setStatus("error"), 30_000);
          setProgress(value);
          break;
        }
        case "ready":
          awaitingReady = false;
          clearTimeout(timeout);
          setStatus("ready");
          player.focus({ preventScroll: true });
          break;
        case "lock":
          setLocked(event.data.locked === true);
          break;
        case "error":
          awaitingReady = false;
          clearTimeout(timeout);
          setLocked(false);
          setStatus("error");
          break;
      }
    }
    window.addEventListener("message", receive);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("message", receive);
      // 游戏是本站静态资源。同步事件保证断开连接发生在移除 iframe 之前。
      player.contentWindow?.dispatchEvent(new Event("portfolio:dispose"));
    };
  }, [attempt]);

  function retry() {
    setStatus("loading");
    setLocked(false);
    setProgress(0);
    setAttempt((value) => value + 1);
  }

  return (
    <dialog
      ref={dialog}
      className="game-player"
      aria-label={`正在游玩 ${work.title}`}
      data-lenis-prevent
      data-locked={locked}
      onCancel={(event) => {
        // Esc 交给游戏暂停；只有明确点击返回，才结束这一局并关闭播放器。
        event.preventDefault();
        frame.current?.contentWindow?.postMessage(
          { channel: "astra-game", type: "pause" },
          location.origin,
        );
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
    >
      <iframe
        key={attempt}
        ref={frame}
        src={work.entry}
        title={work.title}
        allow="autoplay; fullscreen"
        onError={() => setStatus("error")}
      />
      <button
        className="game-return"
        type="button"
        onClick={() => dialog.current?.close()}
      >
        ← 返回作品集
      </button>
      {status !== "ready" && (
        <div
          className="game-loading"
          role={status === "error" ? "alert" : "status"}
        >
          <span className="work-eyebrow">互动游戏 / {work.title}</span>
          <p>
            {status === "loading"
              ? `正在加载 ${work.title}…${progress > 0 ? ` ${Math.round(progress * 100)}%` : ""}`
              : "游戏加载失败。"}
          </p>
          {status === "error" && <button onClick={retry}>重新加载 ↗</button>}
        </div>
      )}
    </dialog>
  );
}
