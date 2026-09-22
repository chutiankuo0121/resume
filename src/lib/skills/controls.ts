/** 鼠标笔触和触摸共用事件入口；独立浏览支持横拖与纵向轻扫，不推动底层页面。 */
export function bindSkillControls({
  stage,
  movePointer,
  dragBy,
  settle,
  stop,
}: {
  stage: HTMLElement;
  movePointer: (x: number, y: number, active: boolean) => void;
  dragBy: (steps: number) => void;
  settle: (velocity: number) => void;
  stop: () => void;
}) {
  let id: number | null = null,
    dragging = false;
  let startX = 0,
    startY = 0,
    lastX = 0,
    lastY = 0,
    vertical = false,
    lastAt = 0,
    velocity = 0,
    suppressClickUntil = 0;
  const blocked = () =>
    stage.inert || Boolean(document.querySelector("dialog[open]"));
  const surface = (target: EventTarget | null) =>
    target instanceof Element &&
    !target.closest(".skills-index") &&
    (!target.closest("button") || target.closest(".skills-hit"));
  const span = () => Math.max(240, stage.clientWidth * 0.55);

  function down(event: PointerEvent) {
    if (
      blocked() ||
      !surface(event.target) ||
      !event.isPrimary ||
      event.button !== 0
    )
      return;
    id = event.pointerId;
    dragging = false;
    velocity = 0;
    suppressClickUntil = 0;
    startX = lastX = event.clientX;
    startY = lastY = event.clientY;
    vertical = false;
    lastAt = event.timeStamp;
    stop();
    movePointer(event.clientX, event.clientY, true);
  }
  function move(event: PointerEvent) {
    if (blocked()) {
      cancel();
      return;
    }
    movePointer(
      event.clientX,
      event.clientY,
      Boolean(surface(event.target)) || dragging,
    );
    if (event.pointerId !== id) return;
    const dx = event.clientX - startX,
      dy = event.clientY - startY;
    if (!dragging) {
      if (Math.hypot(dx, dy) < 8) return;
      vertical = event.pointerType === "touch" && Math.abs(dy) > Math.abs(dx);
      dragging = true;
      stage.setPointerCapture(event.pointerId);
      stage.dataset.dragging = "true";
    }
    event.preventDefault();
    const step = vertical
      ? (lastY - event.clientY) / Math.max(260, stage.clientHeight * 0.55)
      : (lastX - event.clientX) / span();
    velocity = Math.max(
      -3,
      Math.min(3, step / Math.max(0.016, (event.timeStamp - lastAt) / 1000)),
    );
    lastAt = event.timeStamp;
    lastX = event.clientX;
    lastY = event.clientY;
    dragBy(step);
  }
  function release() {
    const captured = id;
    id = null;
    dragging = false;
    delete stage.dataset.dragging;
    if (captured !== null && stage.hasPointerCapture(captured))
      stage.releasePointerCapture(captured);
  }
  function up(event: PointerEvent) {
    if (event.pointerId !== id) return;
    const moved = dragging;
    release();
    if (moved) {
      suppressClickUntil = performance.now() + 500;
      if (!blocked()) settle(event.timeStamp - lastAt < 100 ? velocity : 0);
    }
    if (event.pointerType !== "mouse") movePointer(0, 0, false);
  }
  function cancel() {
    release();
    movePointer(0, 0, false);
  }
  function click(event: MouseEvent) {
    if (event.detail > 0 && performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
  function leave() {
    if (!dragging) movePointer(0, 0, false);
  }
  function lostCapture(event: PointerEvent) {
    // 触屏会先隐式捕获到按钮。接管到 stage 时，按钮冒泡的 lost 不是拖拽取消。
    if (event.target === stage && event.pointerId === id) cancel();
  }
  stage.addEventListener("pointerdown", down);
  stage.addEventListener("pointermove", move);
  stage.addEventListener("pointerup", up);
  stage.addEventListener("pointercancel", cancel);
  stage.addEventListener("lostpointercapture", lostCapture);
  stage.addEventListener("pointerleave", leave);
  stage.addEventListener("click", click, true);
  window.addEventListener("blur", cancel);
  return {
    cancel,
    dispose() {
      cancel();
      stage.removeEventListener("pointerdown", down);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerup", up);
      stage.removeEventListener("pointercancel", cancel);
      stage.removeEventListener("lostpointercapture", lostCapture);
      stage.removeEventListener("pointerleave", leave);
      stage.removeEventListener("click", click, true);
      window.removeEventListener("blur", cancel);
    },
  };
}
