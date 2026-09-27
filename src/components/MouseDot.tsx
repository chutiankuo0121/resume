"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createContextCursor } from "@/lib/createContextCursor";

/** The reading dot becomes an action hint where content can be explored. */
export default function MouseDot() {
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const position = useRef({ x: 0, y: 0, active: false });
  const [host, setHost] = useState<HTMLDialogElement | null>(null);

  useEffect(() => {
    const sync = () => {
      const open = document.querySelectorAll<HTMLDialogElement>("dialog[open]");
      setHost(open.item(open.length - 1));
    };
    const observer = new MutationObserver(records => {
      if (records.some(record => record.target instanceof HTMLDialogElement ||
        [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element &&
          (node.matches("dialog") || node.querySelector("dialog"))))) sync();
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open"] });
    sync();
    return () => observer.disconnect();
  }, []);

  useEffect(() => createContextCursor(dot.current!, label.current!, position.current, host), [host]);

  const cursor = <div ref={dot} className="mouse-dot" aria-hidden="true" data-mode="default">
    <span className="cursor-core" />
    <span className="cursor-ring" />
    <svg className="cursor-arrows" width="26" height="16" viewBox="0 0 26 16" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M2 8h22M7 3 2 8l5 5m12-10 5 5-5 5" />
    </svg>
    <svg className="cursor-play" width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="m2 2 8 5-8 5Z" />
    </svg>
    <span ref={label} className="cursor-label" />
  </div>;
  return host ? createPortal(cursor, host) : cursor;
}
