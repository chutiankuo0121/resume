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
        <div className="signal-fallback" aria-hidden="true" />
        <canvas ref={canvas} className="signal-art" aria-hidden="true" />
        <div className="signal-content">
          <div className="signal-word" aria-hidden="true">BEYOND</div>
          <div className="signal-shade" aria-hidden="true" />
          <div className="signal-copy signal-copy--intro" data-signal-copy="0">
            <p className="signal-eyebrow">01 / A LITTLE ABOUT ME</p>
            <h2 id="contact-title"><span>在未知中，</span><span>找到方向。</span></h2>
            <p className="signal-description">我是{profile.name}。<br />在金融、代码与创意之间，<br />寻找值得投入的下一件事。</p>
            <span className="signal-signature">Tiankuo Chu <i>—</i> 探索者 / 构建者</span>
            <p className="signal-education">{profile.education}</p>
          </div>
          <div className="signal-copy signal-copy--making" data-signal-copy="1" aria-hidden="true" inert>
            <p className="signal-eyebrow">02 / THOUGHT INTO FORM</p>
            <h3><span>让想法，</span><span>拥有形状。</span></h3>
            <p className="signal-description">从研究到模型，从代码到产品。<br />把抽象的可能，<br />一点点做成真实可用的东西。</p>
          </div>
          <div className="signal-copy signal-copy--connect" data-signal-copy="2" aria-hidden="true" inert>
            <p className="signal-eyebrow">03 / THE NEXT CHAPTER IS OURS</p>
            <h3><span>下一段探索，</span><span>从对话开始。</span></h3>
            <p className="signal-description">一个想法，一次合作，或一句你好。<br />我在这里，期待你的信号。</p>
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
        <p className="signal-eyebrow">SIGNAL RECEIVED / 你好</p>
        <h3>让我们保持联系。</h3>
        <Image src={profile.wechat} alt="褚天阔的微信二维码" width={870} height={870} sizes="240px" unoptimized />
        <p>微信扫一扫 · {profile.name}</p>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </dialog>
    </section>
  );
}
