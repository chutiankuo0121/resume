"use client";

import { useEffect } from "react";

// 用等宽的盲文空格固定粒子位置，避免浏览器合并普通空格。
const collapse = [
  "·⠀⠀∘⠀⠀◉⠀⠀∘⠀⠀·",
  "⠀·⠀⠀∘⠀◉⠀∘⠀⠀·⠀",
  "⠀⠀·⠀⠀∘◉∘⠀⠀·⠀⠀",
  "⠀⠀⠀·⠀∘◉∘⠀·⠀⠀⠀",
  "⠀⠀⠀⠀·∘◉∘·⠀⠀⠀⠀",
  "⠀⠀⠀⠀⠀∘◉∘⠀⠀⠀⠀⠀",
  "⠀⠀⠀⠀⠀⠀◎⠀⠀⠀⠀⠀⠀",
  "⠀⠀⠀⠀⠀⠀●⠀⠀⠀⠀⠀⠀",
];
const frames = [...collapse, ...collapse.slice(1, -1).reverse()];

/** 标签页里的微型黑洞；不参与页面渲染，后台暂停，减少动态模式保持静止。 */
export default function AnimatedTabTitle() {
  useEffect(() => {
    const original = document.title;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    function draw() {
      document.title = frames[frame];
      frame = (frame + 1) % frames.length;
    }
    function sync() {
      clearInterval(timer);
      timer = undefined;
      if (motion.matches) {
        document.title = frames[0];
        return;
      }
      if (document.hidden) return;
      draw();
      timer = setInterval(draw, 240);
    }
    sync();
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      document.title = original;
    };
  }, []);
  return null;
}
