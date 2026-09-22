import type { Work } from "@/content/works";

export type PortfolioMedia = {
  key: string;
  work: Work;
  src: string;
  main: boolean;
  kind: Work["kind"];
  width: number;
  height: number;
  image: HTMLImageElement | null;
};

/** 网格只加载视觉封面；音频用文字流，音乐与专辑图都在详情中按需加载。 */
export async function loadPortfolioMedia(
  works: Work[],
  signal: AbortSignal,
): Promise<PortfolioMedia[]> {
  const images = new Map<string, Promise<HTMLImageElement | null>>();
  function image(src: string) {
    if (!images.has(src)) {
      images.set(src, new Promise((resolve) => {
        if (signal.aborted) {
          resolve(null);
          return;
        }
        const poster = new Image();
        const finish = (ok: boolean) => {
          clearTimeout(timer);
          poster.removeEventListener("load", success);
          poster.removeEventListener("error", failure);
          signal.removeEventListener("abort", failure);
          if (!ok) poster.removeAttribute("src");
          resolve(ok ? poster : null);
        };
        const success = () => finish(true), failure = () => finish(false);
        const timer = window.setTimeout(failure, 8000);
        poster.addEventListener("load", success, { once: true });
        poster.addEventListener("error", failure, { once: true });
        signal.addEventListener("abort", failure, { once: true });
        poster.crossOrigin = "anonymous";
        poster.src = src;
      }));
    }
    return images.get(src)!;
  }
  const groups = await Promise.all(works.map(async (work) => {
    // 项目只占一个封面格，实机截图在详情翻阅；图片图集的附图可独立进入作品墙。
    // 高清首图不重复成格，也不提前占用贴图内存。
    const sources = [...new Set([
      work.cover,
      ...(work.kind === "image" ? work.images.slice(1).map((item) => item.src) : []),
    ])];
    const posters = work.kind === "audio" ? [null] : await Promise.all(sources.map(image));
    return sources.map((src, index): PortfolioMedia => ({
      key: `${work.id}:${index}`,
      work,
      src,
      main: index === 0,
      kind: work.kind,
      image: posters[index],
      width: work.kind === "audio" ? 4.2 : work.kind === "video" ? work.width : posters[index]?.naturalWidth ?? 1,
      height: work.kind === "audio" ? 1 : work.kind === "video" ? work.height : posters[index]?.naturalHeight ?? 1,
    }));
  }));
  signal.throwIfAborted();
  return groups.flat();
}
