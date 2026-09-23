import type { Metadata } from "next";
import { profile } from "@/content/profile";
import { assetUrl, ASSET_ORIGIN } from "@/lib/assetUrl";
import fonts from "@/content/fonts.generated.json";
import "./globals.css";
import "./opening.css";
import "./loading.css";
import "./timeline.css";
import "./portfolio.css";
import "@/components/works/works.css";
import "./skills.css";
import "./explore.css";
import "./chapter-transitions.css";

export const metadata: Metadata = {
  title: `${profile.name} · ${profile.englishName} | AI 应用开发与作品集`,
  description: profile.introduction,
  icons: { icon: assetUrl("/site-icon.svg") },
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
      <body>{children}</body>
    </html>
  );
}
