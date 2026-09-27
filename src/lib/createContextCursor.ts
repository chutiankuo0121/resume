import { CURSOR_INTENT_EVENT, cursorIntentAt } from "./cursorIntent";

/** One event-driven cursor: pointer events collect input; one frame reads intent and paints. */
export function createContextCursor(cursor: HTMLElement, label: HTMLElement,
  position: { x: number; y: number; active: boolean }, host: HTMLDialogElement | null) {
  const fine = matchMedia("(any-hover: hover) and (any-pointer: fine)");
  const html = document.documentElement;
  let frame = 0, x = position.x, y = position.y, width = innerWidth;
  let active = position.active, pressed = false, recheck = true;
  let target: Element | null = null;
  let previousMode = "", previousText = "", previousSide = "", previousPressed = "";

  function conceal() {
    cursor.style.opacity = "0";
    delete html.dataset.contextCursor;
  }
  function draw() {
    frame = 0;
    if (!active || !fine.matches || document.hidden) { conceal(); return; }
    // Only scroll/dialog changes need a hit test. Pointer motion already supplies its target.
    if (recheck || !target?.isConnected) {
      target = document.elementFromPoint(x, y);
      recheck = false;
    }
    const mode = cursorIntentAt(target);
    if (mode === "hidden") { conceal(); return; }
    // During a dialog's scale/translate entrance, fixed descendants use its local coordinates.
    let localX = x, localY = y;
    if (host && getComputedStyle(host).transform !== "none") {
      const box = host.getBoundingClientRect();
      localX = (x - box.left) / (box.width / host.offsetWidth) - host.clientLeft;
      localY = (y - box.top) / (box.height / host.offsetHeight) - host.clientTop;
    }
    const text = mode === "view" ? "查看" : mode === "play" ? "播放"
      : mode === "dragging" ? "拖动中" : mode === "drag" ? "拖动" : "";
    const side = x > width - 120 ? "left" : "right";
    const down = String(pressed);
    if (previousMode !== mode) cursor.dataset.mode = previousMode = mode;
    if (previousText !== text) label.textContent = previousText = text;
    if (previousSide !== side) cursor.dataset.side = previousSide = side;
    if (previousPressed !== down) cursor.dataset.pressed = previousPressed = down;
    cursor.style.transform = `translate3d(${localX}px,${localY}px,0)`;
    cursor.style.opacity = "1";
    if (!html.dataset.contextCursor) html.dataset.contextCursor = "true";
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(draw); }
  function pointer(event: PointerEvent) {
    if (event.pointerType !== "mouse") { hide(); return; }
    active = true;
    x = event.clientX; y = event.clientY;
    position.x = x; position.y = y; position.active = true;
    target = event.target instanceof Element ? event.target : null;
    schedule();
  }
  function down(event: PointerEvent) {
    if (event.button !== 0) return;
    pressed = true;
    pointer(event);
  }
  function up(event: PointerEvent) {
    pressed = false;
    recheck = true;
    pointer(event);
  }
  function hide() {
    active = pressed = false;
    position.active = false;
    cancelAnimationFrame(frame);
    frame = 0;
    conceal();
  }
  function scroll() { if (active) { recheck = true; schedule(); } }
  function resize() { width = innerWidth; scroll(); }
  function keyboard(event: KeyboardEvent) { if (event.key === "Tab") hide(); }
  function intentChanged() { if (active) schedule(); }
  window.addEventListener("pointermove", pointer, { capture: true, passive: true });
  window.addEventListener("pointerover", pointer, { capture: true, passive: true });
  window.addEventListener("pointerdown", down, { capture: true, passive: true });
  window.addEventListener("pointerup", up, { capture: true, passive: true });
  window.addEventListener("pointercancel", hide);
  window.addEventListener("blur", hide);
  window.addEventListener("resize", resize);
  window.addEventListener("scroll", scroll, { capture: true, passive: true });
  window.addEventListener("keydown", keyboard);
  document.addEventListener(CURSOR_INTENT_EVENT, intentChanged);
  document.addEventListener("visibilitychange", hide);
  html.addEventListener("pointerleave", hide);
  fine.addEventListener("change", hide);
  schedule();
  return () => {
    cancelAnimationFrame(frame);
    conceal();
    window.removeEventListener("pointermove", pointer, true);
    window.removeEventListener("pointerover", pointer, true);
    window.removeEventListener("pointerdown", down, true);
    window.removeEventListener("pointerup", up, true);
    window.removeEventListener("pointercancel", hide);
    window.removeEventListener("blur", hide);
    window.removeEventListener("resize", resize);
    window.removeEventListener("scroll", scroll, true);
    window.removeEventListener("keydown", keyboard);
    document.removeEventListener(CURSOR_INTENT_EVENT, intentChanged);
    document.removeEventListener("visibilitychange", hide);
    html.removeEventListener("pointerleave", hide);
    fine.removeEventListener("change", hide);
  };
}
