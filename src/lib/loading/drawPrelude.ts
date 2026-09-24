import { LOADING_PRELUDE } from "./config";

/** 独立的二维遮罩，不增加 WebGL 上下文，也不复制首页黑洞的绘制逻辑。 */
export function createPreludeDrawing(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d")!;
  const { barLength, strokeWidth, arcSweep } = LOADING_PRELUDE;
  let width = 1, height = 1, dpr = 1;
  let progress = 0, morph = 0, zoom = 0, reduced = false, time = 0;

  function draw() {
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);
    canvas.style.opacity = String(reduced ? 1 - zoom : 1);

    // 小屏仍保留足够大的进度条；横竖屏都按对角线计算最终覆盖范围。
    const unit = Math.min(1, width / 640, height / 420);
    const radius = barLength / arcSweep;
    const focusX = -(1 - Math.cos(arcSweep / 2)) * radius / 2;
    const travel = reduced ? 0 : zoom ** 3;
    const endScale = (Math.hypot(width, height) + Math.abs(focusX) * unit * 2)
      / (strokeWidth * unit) * 1.15;
    const scale = 1 + (endScale - 1) * travel;

    context.save();
    context.translate(width / 2 - focusX * unit * (scale - 1), height / 2);
    context.scale(unit * scale, unit * scale);
    context.lineWidth = strokeWidth;
    context.lineCap = "round";
    context.lineJoin = "round";

    if (morph === 0) {
      const barWidth = barLength + strokeWidth;
      context.beginPath();
      context.roundRect(-barWidth / 2, -strokeWidth / 2,
        barWidth, strokeWidth, strokeWidth / 2);
      context.fillStyle = "#303030";
      context.fill();
      // 外轮廓与填充前端都保留圆角；0% 不露白点，100% 与形变首帧完全重合。
      context.save();
      context.clip();
      if (progress > 0) {
        context.beginPath();
        context.roundRect(-barWidth / 2, -strokeWidth / 2,
          barWidth * progress, strokeWidth, strokeWidth / 2);
        context.fillStyle = "#fff";
        context.fill();
      }
      context.restore();
    } else {
      // 保持弧长不变，只增加曲率：直线自然弯成开口向右的 C，没有换字或缩成细线。
      const sweep = arcSweep * morph;
      const bendRadius = barLength / sweep;
      const offset = (1 - Math.cos(sweep / 2)) * bendRadius / 2;
      context.rotate(-Math.PI / 2 * morph);
      context.beginPath();
      for (let i = 0; i <= 96; i++) {
        const angle = (i / 96 - 0.5) * sweep;
        const x = Math.sin(angle) * bendRadius;
        const y = (1 - Math.cos(angle)) * bendRadius - offset;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      // 笔画先挖穿黑幕，再逐步撤去白墨。镜头推进后窗口覆盖屏幕，直接交给原场景。
      context.strokeStyle = "#fff";
      if (zoom > 0 && !reduced) {
        context.globalCompositeOperation = "destination-out";
        context.stroke();
        context.globalCompositeOperation = "source-over";
        const fade = Math.min(1, zoom / 0.75);
        context.globalAlpha = 1 - fade * fade * (3 - 2 * fade);
      }
      context.stroke();
    }
    if (!reduced && zoom < .52) {
      const fade = 1 - Math.min(1, zoom / .52);
      for (let i = 0; i < 34; i++) {
        const t = (i + .5) / 34;
        if (morph === 0 && t > progress) continue;
        const sweep = arcSweep * Math.max(morph, .0001);
        const bend = barLength / sweep;
        const offset = (1 - Math.cos(sweep / 2)) * bend / 2;
        const angle = (t - .5) * sweep;
        // 与进度条 / C 形笔画共用同一条参数曲线。
        const x = morph === 0 ? (t - .5) * barLength : Math.sin(angle) * bend;
        const y = morph === 0 ? 0 : (1 - Math.cos(angle)) * bend - offset;
        const px = x;
        const py = y;
        const blink = Math.pow(.5 + .5 * Math.sin(time * 2.2 + i * 2.4), 5);
        const size = (i % 7 === 0 ? 2.5 : 1.2) * blink;
        context.fillStyle = `rgba(255,255,255,${blink * fade * .9})`;
        context.beginPath();
        context.moveTo(px, py - size);
        context.lineTo(px + size, py);
        context.lineTo(px, py + size);
        context.lineTo(px - size, py);
        context.closePath();
        context.fill();
      }
    }
    context.restore();
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    draw();
  }
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  return {
    render(nextProgress: number, nextMorph: number, nextZoom: number, reduceMotion: boolean, seconds: number) {
      progress = nextProgress;
      morph = nextMorph;
      zoom = nextZoom;
      reduced = reduceMotion;
      time = seconds;
      draw();
    },
    dispose() { observer.disconnect(); },
  };
}
