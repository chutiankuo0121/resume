export type CursorIntent = "default" | "action" | "view" | "play" | "drag" | "dragging" | "hidden";

export const CURSOR_INTENT_EVENT = "cursor-intent-change";

/** Canvas scenes publish their existing hit-test result only when it changes. */
export function setCursorIntent(element: HTMLElement, intent: CursorIntent) {
  if (element.dataset.cursor === intent) return;
  element.dataset.cursor = intent;
  element.dispatchEvent(new Event(CURSOR_INTENT_EVENT, { bubbles: true }));
}

export function cursorIntentAt(target: Element | null): CursorIntent {
  if (!target || target.closest("[inert], [data-closing='true'], iframe, video, audio, input, textarea, select, [contenteditable='true']"))
    return "hidden";
  if (target.closest(":disabled, [aria-disabled='true']")) return "default";
  if (target.closest("[data-cursor='dragging']")) return "dragging";
  const control = target.closest("button, a[href], summary, [role='button'], [role='scrollbar']");
  if (control && !control.hasAttribute("data-cursor")) return "action";
  const intent = target.closest<HTMLElement>("[data-cursor]")?.dataset.cursor;
  if (intent === "view" || intent === "play" || intent === "drag" || intent === "hidden") return intent;
  return control ? "action" : "default";
}
