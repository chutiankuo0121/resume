import { useEffect, useRef, useState, type CSSProperties } from "react";

/** Keep the already-viewed cover painted until the full image is decoded. */
export default function ProgressiveImage({ src, preview, alt, width, height }: {
  src: string;
  preview: string;
  alt: string;
  width: number;
  height: number;
}) {
  const image = useRef<HTMLImageElement>(null);
  const [decodedSource, setDecodedSource] = useState("");
  const ready = decodedSource === src;

  useEffect(() => {
    const element = image.current!;
    let cancelled = false;
    let frame = 0;
    void element.decode().then(() => {
      if (cancelled) return;
      // The preview gets a painted frame even when the original is cached.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (!cancelled) setDecodedSource(src);
        });
      });
    }).catch(() => { /* A failed original leaves the cover visible. */ });
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [src]);

  return (
    <span className="media-progressive" data-ready={ready}
      style={{ "--image-aspect": width / height } as CSSProperties}>
      <img className="media-progressive-preview" src={preview} alt="" aria-hidden="true"
        crossOrigin="anonymous" width={width} height={height} decoding="sync" />
      <img ref={image} className="media-progressive-full" src={src} alt={alt}
        width={width} height={height} decoding="async" loading="eager" fetchPriority="high" />
    </span>
  );
}
