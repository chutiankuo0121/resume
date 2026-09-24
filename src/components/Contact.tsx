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
      <div ref={stage} className="contact-stage" data-act="0">
        <div className="signal-fallback" aria-hidden="true" />
        <div className="signal-word" aria-hidden="true">BEYOND</div>
        <canvas ref={canvas} className="signal-art" aria-hidden="true" />
        <div className="signal-shade" aria-hidden="true" />
        <header className="signal-header">
          <span>ASTRA <i>/</i> DEEP SPACE STATION</span>
          <span className="signal-status"><b /> 向未知，保持开放</span>
        </header>
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
          <p className="signal-disciplines">{profile.focus}</p>
        </div>
        <div className="signal-copy signal-copy--connect" data-signal-copy="2" aria-hidden="true" inert>
          <p className="signal-eyebrow">03 / THE NEXT CHAPTER IS OURS</p>
          <h3><span>下一段探索，</span><span>从对话开始。</span></h3>
          <p className="signal-description">一个想法，一次合作，或一句你好。<br />我在这里，期待你的信号。</p>
          <div className="signal-actions">
            <a href={`mailto:${profile.email}`}><span>发一封邮件</span><span aria-hidden="true">↗</span></a>
            <button type="button" onClick={() => dialog.current?.showModal()}><span>微信聊聊</span><span aria-hidden="true">＋</span></button>
          </div>
          <a className="signal-email" href={`mailto:${profile.email}`}>{profile.email}</a>
        </div>
        <button className="signal-touch" type="button" aria-label="触碰晶石，发出光点信号">
          <span className="signal-touch-cross" aria-hidden="true">＋</span><span>触碰晶石</span>
        </button>
        <div className="signal-specimen" aria-hidden="true"><span>FIG. 01</span><i /> THE SHAPE OF POSSIBILITY</div>
        <footer className="signal-footer">
          <div className="signal-chapters" aria-label="联系页阅读进度">
            <span data-signal-step="0">01 <i>探索</i></span><b />
            <span data-signal-step="1">02 <i>构建</i></span><b />
            <span data-signal-step="2">03 <i>连接</i></span>
          </div>
          <div className="signal-scroll"><span>继续向下，靠近一点</span><span aria-hidden="true">↓</span></div>
          <span className="signal-end">TIANKUO CHU <i>©</i> ASTRA</span>
        </footer>
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
