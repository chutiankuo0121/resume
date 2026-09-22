import type { RefObject } from "react";
import Image from "next/image";
import { profile } from "@/content/profile";

export default function Contact({
  ref,
  inactive,
}: {
  ref: RefObject<HTMLElement | null>;
  inactive: boolean;
}) {
  return (
    <section
      ref={ref}
      id="contact"
      className="contact"
      inert={inactive}
      aria-labelledby="contact-title"
    >
      <p className="contact-kicker">A CONVERSATION STARTS HERE</p>
      <div className="contact-layout">
        <div>
          <h2 id="contact-title">
            Let’s make
            <br />
            <em>something matter.</em>
          </h2>
          <p className="contact-name">{profile.name}<span>{profile.englishName}</span></p>
          <p className="contact-focus">{profile.focus}</p>
          <p className="contact-introduction">{profile.introduction}</p>
          <p className="contact-education">{profile.education}</p>
          <a className="contact-email" href={`mailto:${profile.email}`}>{profile.email} ↗</a>
        </div>
        <figure className="contact-wechat">
          <Image src={profile.wechat} alt="褚天阔的微信二维码" width={870} height={870} sizes="220px" unoptimized />
          <figcaption>微信联系 / WeChat</figcaption>
        </figure>
      </div>
      <div className="contact-footer">
        <span>GET IN TOUCH ↗</span>
        <p>{profile.focus}</p>
        <span>TIANKUO CHU / ASTRA</span>
      </div>
    </section>
  );
}
