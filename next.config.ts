import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { ASSET_ORIGIN } from "./src/lib/assetUrl";

export default function nextConfig(phase: string): NextConfig {
  const development = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    // 交互均在浏览器运行；生产环境只发布静态页面和一个素材转发 Worker。
    ...(development ? {} : { output: "export" }),
    devIndicators: false,
    turbopack: { root: process.cwd() },
    images: {
      unoptimized: true,
      remotePatterns: [new URL(`${ASSET_ORIGIN}/**`)],
    },
    ...(development ? {
      async rewrites() {
        // 本地开发与线上 Worker 使用相同的素材路径，保留游戏 iframe 的同源运行。
        return [
          { source: "/games/:path*", destination: `${ASSET_ORIGIN}/games/:path*` },
          { source: "/fonts/:path*", destination: `${ASSET_ORIGIN}/fonts/:path*` },
        ];
      },
    } : {}),
  };
}
