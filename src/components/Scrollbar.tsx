import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

type Props = {
  onScrollTo: (position: number) => void;
};

/** 透明轨道上的反色细滑块；只控制真实页面滚动，不创建第二条动画时间线。 */
export default function Scrollbar({ onScrollTo }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLDivElement>(null);
  const metrics = useRef({ max: 0, travel: 0, height: 0 });
  const drag = useRef<{ id: number; offset: number } | null>(null);

  useEffect(() => {
    const rail = track.current!;
    const handle = thumb.current!;
    function update() {
      const pageHeight = document.documentElement.scrollHeight;
      const max = Math.max(0, pageHeight - window.innerHeight);
      rail.hidden = max === 0;
      if (!max) return;
      const height = Math.min(
        rail.clientHeight,
        Math.max(64, (rail.clientHeight * window.innerHeight) / pageHeight),
      );
      const travel = rail.clientHeight - height;
      const progress = Math.max(0, Math.min(1, window.scrollY / max));
      metrics.current = { max, travel, height };
      handle.style.height = `${height}px`;
      handle.style.transform = `translateY(${travel * progress}px)`;
      rail.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    }
    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, []);

  function moveTo(clientY: number, offset: number) {
    const { max, travel } = metrics.current;
    if (travel <= 0) return;
    const y = clientY - track.current!.getBoundingClientRect().top - offset;
    onScrollTo(Math.max(0, Math.min(1, y / travel)) * max);
  }

  function start(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || drag.current) return;
    event.preventDefault();
    const rail = event.currentTarget;
    const { max, travel, height } = metrics.current;
    if (!max) return;
    const y = event.clientY - rail.getBoundingClientRect().top;
    const top = travel * Math.max(0, Math.min(1, window.scrollY / max));
    // 整个透明热区都能抓住滑块；点击空轨道时，以滑块中心跳转。
    const offset = y >= top && y <= top + height ? y - top : height / 2;
    drag.current = { id: event.pointerId, offset };
    rail.dataset.dragging = "";
    rail.setPointerCapture(event.pointerId);
    moveTo(event.clientY, offset);
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    // 操作滚动条时不把指针传给场景，避免拖动同时转动水晶。
    event.stopPropagation();
    if (drag.current?.id === event.pointerId)
      moveTo(event.clientY, drag.current.offset);
  }

  function end(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function keydown(event: KeyboardEvent<HTMLDivElement>) {
    const page = window.innerHeight * 0.9;
    const targets: Record<string, number> = {
      ArrowUp: window.scrollY - 40,
      ArrowDown: window.scrollY + 40,
      PageUp: window.scrollY - page,
      PageDown: window.scrollY + page,
      Home: 0,
      End: metrics.current.max,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    onScrollTo(Math.max(0, Math.min(metrics.current.max, targets[event.key])));
  }

  return (
    <div
      ref={track}
      className="page-scrollbar"
      data-lenis-prevent-touch
      role="scrollbar"
      aria-label="Page scroll"
      aria-controls="journey"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      tabIndex={0}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onKeyDown={keydown}
    >
      <div ref={thumb} className="scrollbar-thumb" />
    </div>
  );
}
