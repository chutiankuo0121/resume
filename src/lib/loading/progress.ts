import type { FrameClock } from "../transition";
import { LOADING_PRELUDE } from "./config";

export type LoadingTask = "model" | "particles" | "lighting" | "fonts" | "scene" | "previews";
export type LoadingState = { progress: number; morph: number; reveal: number; failed: boolean };

// 进度统计开场绘制准备与全站预览图片；作品原始媒体仍按需加载。
const WEIGHTS: Record<LoadingTask, number> = {
  model: 10, particles: 8, lighting: 8, fonts: 9, scene: 10, previews: 55,
};

export function createLoadingProgress(
  clock: FrameClock,
  root: HTMLElement,
  onComplete: () => void,
) {
  const state: LoadingState = { progress: 0, morph: 0, reveal: 0, failed: false };
  const tasks = new Map<LoadingTask, number>();
  const startedAt = performance.now();
  const digits = [...root.querySelectorAll<HTMLElement>(".prelude-digit-strip")]
    .map((element) => ({ element, place: Number(element.dataset.place) }));
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  let target = 0, last = 0, exitTime = 0, previousNumber = -1;
  let completed = false, fast = false;
  const { completeHold, morphDuration, letterHold, zoomDuration } = LOADING_PRELUDE;
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  const unsubscribe = clock.subscribe((timestamp) => {
    // 后台不消耗揭幕时间，回到标签页仍能看到完整交接。
    const dt = last ? Math.min((timestamp - last) / 1000, 0.05) : 0;
    last = timestamp;
    if (state.failed || completed || document.hidden) return;
    // 只追赶已完成的真实任务，不生成随机进度。缓存命中时也以短缓动读出数字。
    const difference = target - state.progress;
    state.progress += Math.min(difference, dt * (media.matches || fast ? 4 : 0.72),
      difference * (1 - Math.exp(-dt * (media.matches || fast ? 20 : 6))));
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
    if (state.progress === 1) exitTime += dt * (fast && !media.matches ? 1.8 : 1);
    const bend = clamp((exitTime - completeHold) / morphDuration);
    // 形变首尾都静止，让 C 有一次完整的定格，再启动镜头推进。
    const morph = bend < 0.5 ? 4 * bend ** 3 : 1 - (-2 * bend + 2) ** 3 / 2;
    state.reveal = media.matches
      ? clamp((exitTime - 0.1) / 0.2)
      : clamp((exitTime - completeHold - morphDuration - letterHold) / zoomDuration);
    state.morph = media.matches ? 0 : morph;
    root.style.setProperty("--loading-copy-opacity", String(1 - clamp(state.reveal / 0.3)));
    if (state.reveal === 1) {
      completed = true;
      unsubscribe();
      onComplete();
    }
  });
  function update(task: LoadingTask, progress: number) {
    if (state.failed || completed) return;
    tasks.set(task, Math.max(tasks.get(task) ?? 0, clamp(progress)));
    target = [...tasks].reduce((sum, [key, value]) => sum + WEIGHTS[key] * value, 0) / 100;
    // 根据这一次的真实就绪速度加速；不凭上次访问标记跳过资源检查。
    if (target === 1) fast = performance.now() - startedAt < 1500;
  }
  return {
    state,
    update,
    complete(task: LoadingTask) { update(task, 1); },
    fail() { state.failed = true; },
    dispose() { unsubscribe(); },
  };
}
