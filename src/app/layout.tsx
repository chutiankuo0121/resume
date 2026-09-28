import type { Metadata } from "next";
import { profile } from "@/content/profile";
import { ASSET_ORIGIN } from "@/lib/assetUrl";
import fonts from "@/content/fonts.generated.json";
import MouseDot from "@/components/MouseDot";
import AnimatedTabTitle from "@/components/AnimatedTabTitle";
import "./globals.css";
import "./buttons.css";
import "./cursor.css";
import "./opening.css";
import "./loading.css";
import "@/components/cards/cards.css";
import "./timeline.css";
import "./portfolio.css";
import "@/components/works/works.css";
import "@/components/works/media-viewer.css";
import "./skills.css";
import "./explore.css";
import "./chapter-transitions.css";
import "./contact.css";
import "@/components/sound/sound.css";

export const metadata: Metadata = {
  title: `${profile.name} · ${profile.englishName}`,
  description: profile.introduction,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href={ASSET_ORIGIN} crossOrigin="anonymous" />
        {[fonts.cinzel, fonts.kinghwa, fonts.cormorant, fonts.zhuque].map((href) => (
          <link key={href} rel="preload" href={href}
            as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
      </head>
      <body>
        {children}
        <MouseDot />
        <AnimatedTabTitle />
      </body>
    </html>
  );
}
