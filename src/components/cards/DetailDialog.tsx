"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { CardOrigin } from "@/lib/cardMotion";

/** 统一详情外壳；原生 dialog 保留焦点隔离、Esc 与多层播放器的正确顺序。 */
export default function DetailDialog({
  children, className, labelledBy, label, origin, onClose,
}: {
  children: ReactNode;
  className: string;
  labelledBy: string;
  label: string;
  origin?: CardOrigin;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const motion = useRef<Animation | null>(null);
  const closing = useRef(false);
  const anchor = useRef(origin);

  function collapsed() {
    const bounds = dialog.current!.getBoundingClientRect();
    const start = anchor.current;
    if (!start || !start.width || !start.height)
      return "translateY(18px) scale(.96)";
    // 等比缩放保持文字与圆角形状；只移动合成层，不逐帧重排正文。
    const scale = Math.max(.22, Math.min(.92, start.width / bounds.width, start.height / bounds.height));
    const x = start.left + start.width / 2 - bounds.left - bounds.width / 2;
    const y = start.top + start.height / 2 - bounds.top - bounds.height / 2;
    return `translate(${x}px, ${y}px) scale(${scale})`;
  }

  useEffect(() => {
    const element = dialog.current!;
    closing.current = false;
    element.showModal();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      motion.current = element.animate([
        { opacity: 0, transform: collapsed() },
        { opacity: 1, transform: "none" },
      ], { duration: 440, easing: "cubic-bezier(.2,.8,.2,1)" });
    }
    return () => {
      motion.current?.cancel();
      element.querySelectorAll<HTMLMediaElement>("video,audio").forEach(media => media.pause());
      element.close();
    };
  }, []);

  function close() {
    const element = dialog.current!;
    if (closing.current || !element.open) return;
    closing.current = true;
    // 立即停止声音；退出动画完成后再卸载播放器。
    element.querySelectorAll<HTMLMediaElement>("video,audio").forEach(media => media.pause());
    const current = getComputedStyle(element);
    const from = { opacity: current.opacity, transform: current.transform };
    motion.current?.cancel();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.close();
      return;
    }
    element.dataset.closing = "true";
    motion.current = element.animate([from, { opacity: 0, transform: collapsed() }], {
      duration: 260, easing: "cubic-bezier(.4,0,.3,1)", fill: "forwards",
    });
    motion.current.onfinish = () => element.close();
  }

  return (
    <dialog ref={dialog} className={`detail-dialog ${className}`} aria-labelledby={labelledBy}
      data-lenis-prevent
      onCancel={event => {
        // 游戏也是原生 dialog；它的 Esc 只暂停游戏，不关闭下面的作品详情。
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        close();
      }}
      onClose={event => { if (event.target === event.currentTarget && !event.currentTarget.open) onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="detail-shell">
        <header className="detail-header">
          <span className="card-eyebrow">{label}</span>
          <button type="button" className="card-close" onClick={close} aria-label="关闭详情" autoFocus>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
