import { experience } from "@/content/experience";
import { careerArtwork } from "../career/artwork";
import { skills } from "@/content/skills";
import { assetUrl } from "../assetUrl";

type Preview = { src: string; cors: boolean };
type PreviewFailure = { src: string; reason: string };

function retryDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      reject(signal.reason);
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}

/** 与实际图片使用相同的 URL / CORS 模式，让后续场景复用浏览器缓存。 */
function decodePreview({ src, cors }: Preview, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const image = new Image();
    if (cors) image.crossOrigin = "anonymous";
    image.decoding = "async";
    let finished = false;
    const finish = (error?: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      image.onload = image.onerror = null;
      if (error) {
        image.removeAttribute("src");
        reject(error);
      } else resolve();
    };
    const abort = () => finish(new DOMException("Preview loading cancelled", "AbortError"));
    const timer = window.setTimeout(() => finish(new Error(`Preview timed out: ${src}`)), 30_000);
    signal.addEventListener("abort", abort, { once: true });
    image.onload = () => {
      void image.decode().then(() => finish(), () => finish(new Error(`Preview decode failed: ${src}`)));
    };
    image.onerror = () => finish(new Error(`Preview load failed: ${src}`));
    image.src = src;
  });
}

/** 只预载页面预览，不下载作品原图、视频、音频或游戏包。最多同时解码六张。 */
export async function preloadPreviews(onProgress: (progress: number) => void, signal: AbortSignal) {
  const { portfolioMedia } = await import("@/content/works/gallery");
  signal.throwIfAborted();
  const previews: Preview[] = [
    ...experience.flatMap((_, index) => {
      const art = careerArtwork(index);
      return [art.sketch, art.objects].map(src => ({ src, cors: false }));
    }),
    ...skills.map(skill => ({ src: skill.image, cors: true })),
    ...["lunar-left", "lunar-right"].flatMap(name =>
      [true, false].map(cors => ({ src: `/contact-signal/${name}.webp`, cors }))),
    { src: assetUrl("/portfolio/paper-grain.webp"), cors: true },
    ...portfolioMedia.filter(item => item.kind !== "audio").map(item => ({ src: item.src, cors: true })),
  ];
  const unique = [...new Map(previews.map(preview => [`${preview.cors}:${preview.src}`, preview])).values()];
  let pending = unique, completed = 0;
  const failures = new Map<string, PreviewFailure>();
  for (let attempt = 0; attempt < 3 && pending.length; attempt++) {
    // 先让其他图片完成，再重试失败项，避免单张坏图阻断整个队列。
    if (attempt) await retryDelay(700 * 3 ** (attempt - 1), signal);
    let next = 0;
    const retry: Preview[] = [];
    async function worker() {
      while (next < pending.length) {
        signal.throwIfAborted();
        const preview = pending[next++];
        const key = `${preview.cors}:${preview.src}`;
        try {
          await decodePreview(preview, signal);
          signal.throwIfAborted();
          failures.delete(key);
          onProgress(++completed / unique.length);
        } catch (error) {
          signal.throwIfAborted();
          failures.set(key, { src: preview.src, reason: error instanceof Error ? error.message : String(error) });
          retry.push(preview);
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(6, pending.length) }, worker));
    pending = retry;
  }
  signal.throwIfAborted();
  // 仅在全部预载尝试结束后结束此任务。失败项明确返回，不冒充下载成功；
  // 后续页面自己的图片加载器仍可请求它们，不能因此关闭已经就绪的首屏。
  onProgress(1);
  return [...failures.values()];
}
