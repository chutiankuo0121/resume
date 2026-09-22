import type { FrameClock } from "../transition";
import { LOADING_HOLE } from "./config";

export type LoadingTask = "model" | "particles" | "lighting" | "fonts" | "scene";
export type LoadingState = { progress: number; reveal: number; failed: boolean };

// 进度代表开场所需资源与绘制准备，不把后面的整批作品媒体算入首屏等待。
const WEIGHTS: Record<LoadingTask, number> = {
  model: 22, particles: 16, lighting: 18, fonts: 24, scene: 20,
};

export function createLoadingProgress(
  clock: FrameClock,
  root: HTMLElement,
  onComplete: () => void,
) {
  const state: LoadingState = { progress: 0, reveal: 0, failed: false };
  const finished = new Set<LoadingTask>();
  const digits = [...root.querySelectorAll<HTMLElement>(".prelude-digit-strip")]
    .map((element) => ({ element, place: Number(element.dataset.place) }));
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  let target = 0, last = 0, hold = 0, exitTime = 0, previousNumber = -1;
  let completed = false;
  const unsubscribe = clock.subscribe((timestamp) => {
    // 后台不消耗揭幕时间，回到标签页仍能看到完整交接。
    const dt = last ? Math.min((timestamp - last) / 1000, 0.05) : 0;
    last = timestamp;
    if (state.failed || completed || document.hidden) return;
    // 只追赶已完成的真实任务，不生成随机进度。缓存命中时也以短缓动读出数字。
    const difference = target - state.progress;
    state.progress += Math.min(difference, dt * (media.matches ? 3 : 0.72),
      difference * (1 - Math.exp(-dt * (media.matches ? 14 : 6))));
    if (difference < 0.002) state.progress = target;
    const integer = state.progress === 1 ? 100 : Math.floor(state.progress * 100);
    if (integer !== previousNumber) {
      root.setAttribute("aria-valuenow", String(integer));
      root.setAttribute("aria-valuetext", `${integer}%`);
      previousNumber = integer;
    }
    // 三位数字独立滚动；高位只在进位前滚动，末尾的额外 0 让 9→0 无缝衔接。
    const value = media.matches ? integer : state.progress * 100;
    for (const { element, place } of digits) {
      const whole = Math.floor(value / place) % 10;
      const carry = Math.max(0, value % place - (place - 1));
      const fraction = media.matches ? 0 : carry * carry * (3 - 2 * carry);
      element.style.transform = `translateY(${-(whole + fraction) * 100 / 11}%)`;
    }
    if (state.progress < 1) return;
    hold += dt;
    if (hold < (media.matches ? 0.1 : LOADING_HOLE.completeHold)) return;
    exitTime += dt;
    const t = Math.min(1, exitTime / (media.matches ? 0.15 : LOADING_HOLE.expansionDuration));
    // 三次缓入缓出：中段快速膨胀，首尾速度归零，停在原首页尺寸。
    state.reveal = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    root.style.setProperty("--loading-copy-opacity", String(1 - Math.min(1, t / 0.45)));
    if (t === 1) {
      completed = true;
      unsubscribe();
      onComplete();
    }
  });
  return {
    state,
    complete(task: LoadingTask) {
      if (state.failed || finished.has(task)) return;
      finished.add(task);
      target = [...finished].reduce((sum, key) => sum + WEIGHTS[key], 0) / 100;
    },
    fail() { state.failed = true; },
    dispose: unsubscribe,
  };
}
