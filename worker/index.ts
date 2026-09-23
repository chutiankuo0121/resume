import { ASSET_ORIGIN } from "../src/lib/assetUrl";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // Cloudflare 先匹配构建产物；只有缺失的游戏素材和字体才会到达这里。
    // 维持同源路径，避免 iframe 的 CSP、引擎相对路径和暂停通信失效。
    if (url.pathname.startsWith("/games/") || url.pathname.startsWith("/fonts/")) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
      }
      // 只转发媒体缓存和分段读取请求，不把本站 Cookie 或身份凭据传给素材域名。
      const headers = new Headers();
      for (const name of ["Range", "If-Range", "If-None-Match", "If-Modified-Since", "Accept-Encoding"]) {
        const value = request.headers.get(name);
        if (value) headers.set(name, value);
      }
      return fetch(`${ASSET_ORIGIN}${url.pathname}`, { method: request.method, headers });
    }
    return env.ASSETS.fetch(request);
  },
};
