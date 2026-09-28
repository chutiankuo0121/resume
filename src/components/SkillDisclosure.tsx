"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

/** 保留原生 details 的键盘操作，收起动画结束后才关闭内容。 */
export default function SkillDisclosure({ title, children }: {
  title: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const details = root.current!, summary = trigger.current!, content = body.current!;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const originalStyle = content.getAttribute("style");
    const originalInert = content.inert;
    let expanded = false;
    let animation: gsap.core.Tween | undefined;
    content.inert = true;

    function finish() {
      details.open = expanded;
      content.style.removeProperty("height");
      content.style.removeProperty("opacity");
      animation = undefined;
    }
    function toggle(event: MouseEvent) {
      event.preventDefault();
      expanded = !expanded;
      animation?.kill();
      summary.setAttribute("aria-expanded", String(expanded));
      content.inert = !expanded;
      if (motion.matches) {
        finish();
        return;
      }
      if (!details.open) {
        details.open = true;
        content.style.height = "0px";
        content.style.opacity = "0";
      }
      // 只持有当前动画；快速反向从当前高度接续，不把历次点击留在 Context 中。
      animation = gsap.to(content, {
        height: expanded ? content.scrollHeight : 0,
        opacity: expanded ? 1 : 0,
        duration: expanded ? 0.42 : 0.3,
        ease: expanded ? "power2.out" : "power2.inOut",
        onComplete: finish,
      });
    }
    function preference() {
      if (motion.matches) {
        animation?.kill();
        finish();
      }
    }
    summary.addEventListener("click", toggle);
    motion.addEventListener("change", preference);
    return () => {
      summary.removeEventListener("click", toggle);
      motion.removeEventListener("change", preference);
      animation?.kill();
      details.open = false;
      summary.setAttribute("aria-expanded", "false");
      content.inert = originalInert;
      if (originalStyle === null) content.removeAttribute("style");
      else content.setAttribute("style", originalStyle);
    };
  }, []);

  return <details ref={root}>
    <summary ref={trigger} aria-expanded={false}>
      <strong>{title}</strong><span className="media-disclosure" aria-hidden="true">＋</span>
    </summary>
    <div ref={body} className="media-disclosure-content">{children}</div>
  </details>;
}
