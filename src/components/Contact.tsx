"use client";

import { useEffect, useRef, type RefObject } from "react";
import Image from "next/image";
import { profile } from "@/content/profile";

export default function Contact({
  ref,
  inactive,
}: {
  ref: RefObject<HTMLElement | null>;
  inactive: boolean;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    import("@/lib/contact/createContactScene").then(({ createContactScene }) => {
      if (cancelled || !ref.current || !stage.current || !canvas.current) return;
      dispose = createContactScene(ref.current, stage.current, canvas.current);
    });
    return () => { cancelled = true; dispose?.(); };
  }, [ref]);
  return (
    <section
      ref={ref}
      id="contact"
      className="contact"
      inert={inactive}
      aria-labelledby="contact-title"
    >
      <div ref={stage} className="contact-stage">
        <div className="signal-fallback" aria-hidden="true">
          <div className="signal-lens" />
          <div className="signal-rock signal-rock--left" />
          <div className="signal-rock signal-rock--right" />
        </div>
        <canvas ref={canvas} className="signal-art" aria-hidden="true" />
        <div className="signal-content">
          <div className="signal-shade" aria-hidden="true" />
          <div className="signal-copy">
            <h2 id="contact-title"><span>下一段探索，</span><span>从对话开始。</span></h2>
            <p className="signal-description">一个想法，一次合作，或一句你好。</p>
            <div className="signal-actions">
              <button type="button" onClick={() => dialog.current?.showModal()}><span>微信聊聊</span><span aria-hidden="true">＋</span></button>
            </div>
          </div>
        </div>
      </div>
      <dialog ref={dialog} className="signal-dialog" onClick={event => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}>
        <button className="signal-dialog-close" type="button" aria-label="关闭微信二维码" onClick={() => dialog.current?.close()}>×</button>
        <h3>让我们保持联系。</h3>
        <Image src={profile.wechat} alt="褚天阔的微信二维码" width={870} height={870} sizes="240px" unoptimized />
        <p>微信扫一扫 · {profile.name}</p>
        <a href={`mailto:${profile.email}`}>邮箱：{profile.email}</a>
      </dialog>
    </section>
  );
}
