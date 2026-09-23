import { useContext, useLayoutEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { soundtrack } from "@/content/soundtrack";
import { SoundContext } from "./Soundscape";

/** 细线音量标识与原有章节轴共用差值反色；提示浮层不随侧栏旋转。 */
export default function SoundToggle({ floating = false }: { floating?: boolean }) {
  const sound = useContext(SoundContext);
  const button = useRef<HTMLButtonElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const visible = Boolean(sound?.ready && sound.prompt);
  useLayoutEffect(() => {
    if (!visible || !button.current || !bubble.current) return;
    const trigger = button.current, hint = bubble.current;
    function position() {
      const rect = trigger.getBoundingClientRect();
      const mobile = innerWidth < 800;
      hint.style.left = `${mobile ? Math.max(12, Math.min(innerWidth - 272, rect.left)) : rect.right + 16}px`;
      hint.style.top = `${Math.max(12, Math.min(innerHeight - hint.offsetHeight - 12, mobile ? rect.bottom + 12 : rect.top - 24))}px`;
    }
    const resize = new ResizeObserver(position);
    resize.observe(trigger);
    const chapters = trigger.closest(".axis-bar")?.querySelector(".axis-items");
    if (chapters) resize.observe(chapters);
    position();
    window.addEventListener("resize", position);
    return () => { resize.disconnect(); window.removeEventListener("resize", position); };
  }, [visible, floating]);
  if (!sound || !sound.ready) return null;
  const failed = sound.error === "load";
  const label = failed ? "重新播放背景音乐" : sound.enabled ? "关闭背景音乐" : "开启背景音乐";
  function choose(value: boolean) {
    sound!.choose(value);
    button.current?.focus({ preventScroll: true });
  }
  const hint = <div ref={bubble} className="sound-prompt" role="region" aria-label="背景音乐">
    <p className="sound-prompt-title">{failed ? "再听一次？" : "开启声音？"}</p>
    <p>{failed ? "音乐暂时未能播放，可以点击重试。" : "让声音陪你走过这段旅程。"}</p>
    <div className="sound-prompt-actions">
      <button type="button" onClick={() => choose(false)}>保持安静</button>
      <button type="button" onClick={() => choose(true)}>{failed ? "重试" : "开启音乐"}</button>
    </div>
    {soundtrack?.credit && <small className="sound-credit">
      <a href={soundtrack.credit.href} target="_blank" rel="noreferrer">{soundtrack.title} · {soundtrack.credit.name}</a>
      {" / "}<a href={soundtrack.credit.licenseHref} target="_blank" rel="noreferrer">{soundtrack.credit.license}</a>
    </small>}
  </div>;

  return <>
    <button ref={button} type="button" className={`sound-toggle${floating ? " sound-toggle--floating" : ""}`}
      onClick={() => sound.choose(!sound.enabled)} aria-label={label} title={label}
      aria-pressed={sound.enabled} aria-busy={sound.loading} data-playing={sound.playing}>
      <span className="sound-bars" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map(index => <i key={index} style={{ "--bar": index } as CSSProperties} />)}
      </span>
    </button>
    {visible && (floating ? hint : createPortal(hint, document.body))}
  </>;
}
