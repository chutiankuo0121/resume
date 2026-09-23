"use client";

import type { ReactNode, PointerEvent } from "react";

/** 只让封面轻微跟随指针；阅读区不倾斜，触屏与减少动态模式保持静止。 */
export default function CardArtwork({ children, className = "" }: { children: ReactNode; className?: string }) {
  function move(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--tilt-x", `${-((event.clientY - box.top) / box.height - .5) * 6}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${((event.clientX - box.left) / box.width - .5) * 6}deg`);
  }
  return <div className={`card-artwork ${className}`} onPointerMove={move} onPointerLeave={event => {
    event.currentTarget.style.removeProperty("--tilt-x");
    event.currentTarget.style.removeProperty("--tilt-y");
  }}>{children}</div>;
}
