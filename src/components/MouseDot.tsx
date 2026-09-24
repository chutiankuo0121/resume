"use client";

import { useEffect, useRef } from "react";

/** The small cursor dot from the previous portfolio, without its elastic ring. */
export default function MouseDot() {
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = dot.current;
    if (!element) return;
    const cursor: HTMLDivElement = element;

    function move(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      cursor.style.opacity = "1";
    }

    function hide() {
      cursor.style.opacity = "0";
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("blur", hide);
    document.documentElement.addEventListener("pointerleave", hide);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", hide);
      document.documentElement.removeEventListener("pointerleave", hide);
    };
  }, []);

  return <div ref={dot} className="mouse-dot" aria-hidden="true" />;
}
