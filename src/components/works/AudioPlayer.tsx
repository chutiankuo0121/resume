import Image from "next/image";
import { useEffect, useRef } from "react";
import type { AudioWork } from "@/content/works";

/** 只为当前打开的一首歌建立音频分析器，关闭时释放声音、动画与音频上下文。 */
export default function AudioPlayer({ work }: { work: AudioWork }) {
  const audio = useRef<HTMLAudioElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = audio.current!;
    const surface = canvas.current!;
    const ctx = surface.getContext("2d")!;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let context: AudioContext | undefined;
    let analyser: AnalyserNode | undefined;
    let source: MediaElementAudioSourceNode | undefined;
    let frame = 0, width = 1, height = 1, disposed = false;
    const frequencies = new Uint8Array(256);
    const layers = Array.from({ length: 6 }, () => new Float32Array(128));

    function draw() {
      frame = 0;
      ctx.clearRect(0, 0, width, height);
      const live = !element.paused && !element.ended && !motion.matches;
      if (live) analyser?.getByteFrequencyData(frequencies);
      const progress = element.currentTime / work.duration;
      const center = height / 2, margin = Math.min(40, width * .07);
      const span = width - margin * 2;
      // 原站以多层不同阻尼的点列形成声波尾迹；播放时由真实频谱驱动，
      // 暂停时使用导入的整曲波形，进度对应真实时间，不用随机数伪造节奏。
      for (let layer = 5; layer >= 0; layer--) {
        for (let i = 0; i < 128; i++) {
          const x = i / 127;
          const bin = Math.floor(Math.abs(x - .5) * 2 * 100) + 3;
          const level = live && analyser ? frequencies[bin] / 255 :
            work.waveform[Math.min(work.waveform.length - 1, Math.floor(x * work.waveform.length))] * .58;
          const target = level * (i % 2 ? -1 : 1) * height * .37;
          layers[layer][i] += (target - layers[layer][i]) * (live ? .45 / (1 + layer * .8) : 1);
          ctx.fillStyle = x <= progress ? `rgba(55,88,99,${.8 - layer * .1})` :
            `rgba(32,32,28,${.8 - layer * .12})`;
          ctx.beginPath();
          ctx.arc(margin + x * span, center + layers[layer][i], layer ? .8 : 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (live && !document.hidden) frame = requestAnimationFrame(draw);
    }
    function refresh() {
      cancelAnimationFrame(frame);
      draw();
    }
    async function play() {
      if (!context) {
        context = new AudioContext();
        analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = .78;
        source = context.createMediaElementSource(element);
        source.connect(analyser);
        analyser.connect(context.destination);
      }
      await context.resume();
      if (!disposed) refresh();
    }
    const resize = new ResizeObserver(() => {
      width = surface.clientWidth;
      height = surface.clientHeight;
      const dpr = Math.min(devicePixelRatio, 2);
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      refresh();
    });
    resize.observe(surface);
    element.addEventListener("play", play);
    element.addEventListener("pause", refresh);
    element.addEventListener("seeked", refresh);
    element.addEventListener("ended", refresh);
    document.addEventListener("visibilitychange", refresh);
    motion.addEventListener("change", refresh);
    return () => {
      disposed = true;
      element.removeEventListener("play", play);
      element.removeEventListener("pause", refresh);
      element.removeEventListener("seeked", refresh);
      element.removeEventListener("ended", refresh);
      document.removeEventListener("visibilitychange", refresh);
      motion.removeEventListener("change", refresh);
      resize.disconnect();
      cancelAnimationFrame(frame);
      element.pause();
      source?.disconnect();
      analyser?.disconnect();
      void context?.close();
    };
  }, [work]);

  return (
    <div className="work-audio">
      <div className="work-audio-caption">
        <Image src={work.cover} alt={work.alt} width={56} height={56} />
        <span>{work.source?.author ?? work.title}<small>AI MUSIC / {Math.floor(work.duration / 60)}:{String(Math.floor(work.duration % 60)).padStart(2, "0")}</small></span>
      </div>
      <canvas ref={canvas} aria-hidden="true" />
      <audio ref={audio} src={work.src} controls preload="none" aria-label={work.title} />
    </div>
  );
}
