import { useEffect, useRef } from "react";
import type { Work } from "@/content/works";
import AudioPlayer from "./AudioPlayer";
import ProgressiveImage from "./ProgressiveImage";
import { portfolioMedia } from "@/content/works/gallery";

type MediaWork = Extract<Work, { kind: "image" | "video" | "audio" }>;

/** 只呈现媒体本身。背景虚化与开合共用一条时间线，退出完成后才恢复作品墙。 */
export default function MediaViewer({ work, onClose }: { work: MediaWork; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const motion = useRef<Animation | null>(null);
  const closing = useRef(false);
  const media = portfolioMedia.find(item => item.id === work.id && item.main);

  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      motion.current = surface.current!.animate([
        { opacity: work.kind === "image" ? 1 : 0, transform: "scale(.96)", filter: work.kind === "image" ? "none" : "blur(8px)" },
        { opacity: 1, transform: "none", filter: "blur(0px)" },
      ], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    return () => {
      motion.current?.cancel();
      element.querySelectorAll<HTMLMediaElement>("audio,video").forEach(media => media.pause());
      element.close();
    };
  }, []);

  function close() {
    const element = dialog.current!;
    if (closing.current || !element.open) return;
    closing.current = true;
    element.querySelectorAll<HTMLMediaElement>("audio,video").forEach(media => media.pause());
    const current = getComputedStyle(surface.current!);
    const from = { opacity: current.opacity, transform: current.transform, filter: current.filter };
    motion.current?.cancel();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.close();
      return;
    }
    element.dataset.closing = "true";
    motion.current = surface.current!.animate([
      from, { opacity: 0, transform: "scale(.98)", filter: "blur(6px)" },
    ], { duration: 240, easing: "ease-in", fill: "forwards" });
    motion.current.onfinish = () => element.close();
  }

  return (
    <dialog ref={dialog} className="media-viewer" aria-label={work.title} data-lenis-prevent
      onCancel={event => { event.preventDefault(); close(); }}
      onClose={event => { if (!event.currentTarget.open) onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <button className="media-viewer-close" type="button" aria-label="关闭预览" onClick={close} autoFocus>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
      </button>
      <div ref={surface} className="media-viewer-content" data-kind={work.kind}>
        {work.kind === "image" ? (
          <button className="media-viewer-image" type="button" onClick={close} aria-label="关闭图片预览">
            <ProgressiveImage key={work.id} src={work.images[0]?.src ?? work.cover}
              preview={work.cover} alt={work.alt}
              width={media?.textureWidth ?? 1600} height={media?.textureHeight ?? 1000} />
          </button>
        ) : work.kind === "video" ? (
          <div className="media-viewer-video">
            <video src={work.src} poster={work.cover} controls autoPlay playsInline
              width={work.width} height={work.height} preload="metadata" aria-label={work.title} />
            {/* 画面可点回；原生播放、拖动进度、音量和全屏控件保留独立热区。 */}
            <button className="media-viewer-video-dismiss" type="button" onClick={close} aria-label="关闭视频预览" />
          </div>
        ) : <AudioPlayer work={work} onDismiss={close} />}
      </div>
    </dialog>
  );
}
