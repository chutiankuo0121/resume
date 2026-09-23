import type { Metadata } from "next";
import { profile } from "@/content/profile";
import { assetUrl } from "@/lib/assetUrl";
import "./globals.css";
import "./opening.css";
import "./loading.css";
import "./timeline.css";
import "./portfolio.css";
import "@/components/works/works.css";
import "./skills.css";
import "./explore.css";

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
        {["cinzel", "kinghwa", "cormorant", "zhuque"].map((family) => (
          <link key={family} rel="preload" href={`/fonts/astra-${family}.woff2`}
            as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
