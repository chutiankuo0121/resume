import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { type Work, workKinds } from "@/content/works";
import GamePreview from "./GamePreview";
import AudioPlayer from "./AudioPlayer";
import ProjectCaseStudy from "./ProjectCaseStudy";

export default function WorkDetail({
  work,
  onClose,
}: {
  work: Work;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const images = "images" in work ? work.images : [];

  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => {
      // 移除播放器前停止媒体，关闭弹窗后不留声音或后台解码。
      element
        .querySelectorAll<HTMLMediaElement>("video,audio")
        .forEach((media) => media.pause());
      element.close();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="work-dialog"
      aria-labelledby="work-detail-title"
      data-lenis-prevent
      onClose={(event) => {
        // close 事件异步派发；React 重挂载已重新打开时，忽略上一轮清理留下的事件。
        if (!event.currentTarget.open) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="work-detail">
        <header className="work-detail-header">
          <span className="work-eyebrow">
            {workKinds.find((kind) => kind.value === work.kind)?.label}
            {work.year && ` / ${work.year}`}
          </span>
          <button
            type="button"
            className="work-close"
            onClick={() => dialog.current?.close()}
            autoFocus
          >
            Close ×
          </button>
        </header>
        <div className="work-detail-media" data-kind={work.kind}>
          {work.kind === "video" ? (
            <video
              src={work.src}
              poster={work.cover}
              controls
              playsInline
              width={work.width}
              height={work.height}
              preload="none"
              aria-label={work.title}
            />
          ) : work.kind === "audio" ? (
            <AudioPlayer work={work} />
          ) : work.kind === "project" ? (
            <a className="work-project-screenshot" href={images[imageIndex].src} target="_blank" rel="noopener noreferrer" aria-label="查看完整项目截图">
              <Image src={images[imageIndex].src} alt={images[imageIndex].alt} fill sizes="(max-width: 799px) 94vw, 1000px" />
            </a>
          ) : (
            <Image
              src={images[imageIndex]?.src ?? work.cover}
              alt={images[imageIndex]?.alt ?? work.alt}
              fill
              sizes="(max-width: 799px) 94vw, 1000px"
            />
          )}
        </div>
        {images.length > 1 && (
          <div className="work-gallery-controls">
            <button
              type="button"
              aria-label="Previous image"
              onClick={() =>
                setImageIndex((i) => (i - 1 + images.length) % images.length)
              }
            >
              ←
            </button>
            <span aria-live="polite">
              {imageIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => setImageIndex((i) => (i + 1) % images.length)}
            >
              →
            </button>
          </div>
        )}
        {work.kind === "project" && (
          <p className="work-gallery-caption">{images[imageIndex].alt} · 点击查看原图</p>
        )}
        <div className="work-detail-copy">
          <div>
            <p className="work-eyebrow">
              {work.source
                ? work.kind === "audio" ? "Music collection" : work.kind === "video" ? "Film collection" : "Image collection"
                : work.kind === "game"
                  ? "Playable collection"
                  : "Selected work"}
            </p>
            <h3 id="work-detail-title">{work.title}</h3>
            <p className="work-tools">{work.tools.join(" / ")}</p>
          </div>
          <div>
            <p>{work.description}</p>
            {work.source && (
              <a
                className="work-visit"
                href={work.source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {work.source.label} · {work.source.author} ↗
              </a>
            )}
            {work.kind === "game" && <GamePreview work={work} />}
            {(work.kind === "website" || work.kind === "project") && work.href && (
              <a
                className="work-visit"
                href={work.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Explore live website ↗
              </a>
            )}
          </div>
        </div>
        {work.kind === "project" && <ProjectCaseStudy work={work} />}
      </div>
    </dialog>
  );
}
