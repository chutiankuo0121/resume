import Image from "next/image";
import { useRef, useState, type CSSProperties } from "react";
import { type Work } from "@/content/works";
import { portfolioMedia } from "@/content/works/gallery";
import type { CardOrigin } from "@/lib/cardMotion";
import DetailDialog from "../cards/DetailDialog";
import ProjectCaseStudy from "./ProjectCaseStudy";

/** 自己的产品保留职责、成果和实机截图；媒体作品由轻量预览单独负责。 */
export default function ProjectDetail({ work, origin, onClose }: {
  work: Extract<Work, { kind: "project" | "website" }>;
  origin?: CardOrigin;
  onClose: () => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const imageButton = useRef<HTMLButtonElement>(null);
  const [loadedSize, setLoadedSize] = useState<{ src: string; width: number; height: number }>();
  const images = "images" in work ? work.images : [];
  const source = images[imageIndex]?.src ?? work.cover;
  const alt = images[imageIndex]?.alt ?? work.alt;
  const media = portfolioMedia.find(item => item.id === work.id && item.src === source)
    ?? portfolioMedia.find(item => item.id === work.id);
  // 首帧复用作品墙的尺寸，不为判断横竖画幅额外请求媒体。原图加载后校准。
  const size = loadedSize?.src === source ? loadedSize
    : { width: media?.textureWidth ?? 1600, height: media?.textureHeight ?? 1000 };
  const aspect = size.width / size.height;
  const portrait = aspect < .95;

  return (
    <DetailDialog className={`work-dialog${portrait ? " work-dialog--portrait" : ""}`}
      labelledBy="work-detail-title" label={`项目${work.year ? ` / ${work.year}` : ""}`}
      origin={origin} onClose={onClose}>
      <div className="work-hero" data-portrait={portrait} data-zoomed={zoomed}
        style={{ "--media-aspect": aspect } as CSSProperties}>
        <div className="work-gallery">
          <div className="work-detail-media" data-kind={work.kind}>
            <button ref={imageButton} type="button" className="work-image-button"
              onClick={() => setZoomed(value => !value)} aria-label={zoomed ? "返回作品介绍" : "放大查看图片"}>
              <Image key={source} src={source} alt={alt} width={size.width} height={size.height}
                loading="eager" sizes={portrait && !zoomed ? "(max-width: 799px) 90vw, 420px" : "(max-width: 799px) 94vw, 1044px"}
                onLoad={event => {
                  const image = event.currentTarget;
                  if (image.naturalWidth && image.naturalHeight)
                    setLoadedSize({ src: source, width: image.naturalWidth, height: image.naturalHeight });
                }} />
            </button>
          </div>
          {(images.length > 1 || zoomed) && (
            <div className="work-gallery-controls">
              {images.length > 1 && <>
                <button type="button" className="card-close" aria-label="上一张图片"
                  onClick={() => setImageIndex(i => (i - 1 + images.length) % images.length)}>←</button>
                <span aria-live="polite">{imageIndex + 1} / {images.length}</span>
                <button type="button" className="card-close" aria-label="下一张图片"
                  onClick={() => setImageIndex(i => (i + 1) % images.length)}>→</button>
              </>}
              {zoomed && <button type="button" className="card-button" onClick={() => {
                setZoomed(false);
                imageButton.current?.focus({ preventScroll: true });
              }}>返回作品介绍</button>}
            </div>
          )}
          {work.kind === "project" && <p className="work-gallery-caption">{alt}</p>}
        </div>
        <div className="work-detail-copy" hidden={zoomed}>
          <div className="work-detail-heading">
            <h3 id="work-detail-title">{work.title}</h3>
            {work.tools.length > 0 && <ul className="card-tags" aria-label="相关工具">
              {work.tools.map(tool => <li key={tool}>{tool}</li>)}
            </ul>}
          </div>
          <div className="work-detail-description">
            <p>{work.description}</p>
            <div className="work-actions">
              <button type="button" className="card-button" onClick={() => {
                setZoomed(true);
                imageButton.current?.focus({ preventScroll: true });
              }}>查看完整图片 ↗</button>
              {work.href && (
                <a className="card-button" href={work.href} target="_blank" rel="noopener noreferrer">访问项目 ↗</a>
              )}
            </div>
          </div>
        </div>
      </div>
      {work.kind === "project" && !zoomed && <ProjectCaseStudy work={work} />}
    </DetailDialog>
  );
}
