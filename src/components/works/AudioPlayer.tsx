import { useEffect, useRef } from "react";
import type { AudioWork } from "@/content/works";

/** 使用导入时提取的整曲波形。只更新真实播放进度，不为简单预览另建音频处理链。 */
export default function AudioPlayer({ work, onDismiss }: { work: AudioWork; onDismiss: () => void }) {
  const audio = useRef<HTMLAudioElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = audio.current!;
    const surface = canvas.current!;
    const ctx = surface.getContext("2d")!;
    let width = 1, height = 1;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const progress = element.currentTime / work.duration;
      const margin = Math.min(40, width * .07);
      for (let i = 0; i < 128; i++) {
        const x = i / 127;
        const level = work.waveform[Math.min(work.waveform.length - 1, Math.floor(x * work.waveform.length))];
        ctx.fillStyle = x <= progress ? "#b5d3c8" : "#f5f5efd9";
        ctx.beginPath();
        ctx.arc(margin + x * (width - margin * 2), height / 2 + level * (i % 2 ? -1 : 1) * height * .28, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const resize = new ResizeObserver(() => {
      width = surface.clientWidth;
      height = surface.clientHeight;
      const dpr = Math.min(devicePixelRatio, 2);
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    });
    resize.observe(surface);
    element.addEventListener("timeupdate", draw);
    element.addEventListener("seeked", draw);
    return () => {
      resize.disconnect();
      element.removeEventListener("timeupdate", draw);
      element.removeEventListener("seeked", draw);
      element.pause();
    };
  }, [work]);

  return (
    <div className="work-audio">
      <button type="button" className="work-audio-wave" onClick={onDismiss} aria-label="关闭音频预览">
        <canvas ref={canvas} aria-hidden="true" />
      </button>
      <audio ref={audio} src={work.src} controls autoPlay preload="metadata" aria-label={work.title} />
    </div>
  );
}
