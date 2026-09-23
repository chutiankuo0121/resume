import type { NextConfig } from "next";
import { ASSET_ORIGIN } from "./src/lib/assetUrl";

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: { root: process.cwd() },
  images: {
    remotePatterns: [new URL(`${ASSET_ORIGIN}/**`)],
  },
  async rewrites() {
    // 游戏代码和入口留在本站，缺失的素材从 R2 读取，保持 iframe 与 CSP 同源。
    // 字体也保持原 CSS 路径；作品音视频则使用 R2 直链，不经过应用服务器。
    return [
      { source: "/games/:path*", destination: `${ASSET_ORIGIN}/games/:path*` },
      { source: "/fonts/:path*", destination: `${ASSET_ORIGIN}/fonts/:path*` },
    ];
  },
};
export default nextConfig;
