import type { PortfolioMedia } from "@/content/works/gallery";

type State = "idle" | "loading" | "decoded" | "ready" | "failed";
type Job = { src: string; state: State; priority: number; attempts: number; retryAt: number };

/** 有界队列只处理当前视野和邻域；解码结果上传后才让出槽位，避免堆积整库图片。 */
export function createPortfolioMediaLoader(
  media: PortfolioMedia[],
  receive: (src: string, image: HTMLImageElement) => void,
) {
  const jobs = new Map<string, Job>();
  const byKey = new Map<string, Job>();
  const cancellations = new Set<() => void>();
  for (const item of media) {
    if (item.kind === "audio") continue;
    const job: Job = jobs.get(item.src) ?? { src: item.src, state: "idle", priority: Infinity, attempts: 0, retryAt: 0 };
    jobs.set(item.src, job);
    byKey.set(item.key, job);
  }
  let disposed = false, active = 0, retryTimer = 0;

  function pump() {
    clearTimeout(retryTimer);
    if (disposed) return;
    const now = performance.now();
    const pending = [...jobs.values()].filter(job => Number.isFinite(job.priority) &&
      (job.state === "idle" || job.state === "failed" && job.attempts < 3));
    pending.sort((a, b) => a.priority - b.priority);
    for (const job of pending) {
      if (active >= 6) break;
      if (job.retryAt > now) continue;
      load(job);
    }
    const retryAt = Math.min(...pending.filter(job => job.retryAt > now).map(job => job.retryAt));
    if (Number.isFinite(retryAt)) retryTimer = window.setTimeout(pump, Math.max(1, retryAt - now));
  }

  function load(job: Job) {
    active++;
    job.state = "loading";
    job.attempts++;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    let finished = false;
    const timer = window.setTimeout(() => finish(false), 12_000);
    const cancel = () => finish(false);
    function finish(ok: boolean) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      image.onload = image.onerror = null;
      cancellations.delete(cancel);
      if (ok && !disposed) {
        job.state = "decoded";
        receive(job.src, image);
      } else {
        image.removeAttribute("src");
        job.state = "failed";
        job.retryAt = performance.now() + 700 * 3 ** (job.attempts - 1);
        active--;
        pump();
      }
    }
    cancellations.add(cancel);
    image.onload = () => { void image.decode().then(() => finish(true), () => finish(false)); };
    image.onerror = () => finish(false);
    image.src = job.src;
  }

  function online() {
    for (const job of jobs.values()) if (job.state === "failed") job.attempts = job.retryAt = 0;
    pump();
  }
  window.addEventListener("online", online);
  return {
    prioritize(keys: string[]) {
      const previous = new Set([...jobs.values()].filter(job => Number.isFinite(job.priority)));
      for (const job of jobs.values()) job.priority = Infinity;
      keys.forEach((key, priority) => {
        const job = byKey.get(key);
        if (!job) return;
        job.priority = Math.min(job.priority, priority);
        if (!previous.has(job) && job.state === "failed") job.attempts = job.retryAt = 0;
      });
      pump();
    },
    uploaded(src: string) {
      const job = jobs.get(src)!;
      if (job.state !== "decoded") return;
      job.state = "ready";
      active--;
      pump();
    },
    release(src: string) {
      const job = jobs.get(src)!;
      if (job.state !== "ready" && job.state !== "decoded") return;
      if (job.state === "decoded") active--;
      job.state = "idle";
      job.attempts = job.retryAt = 0;
    },
    ready(key: string) { return byKey.get(key)?.state === "ready"; },
    dispose() {
      disposed = true;
      clearTimeout(retryTimer);
      window.removeEventListener("online", online);
      for (const cancel of cancellations) cancel();
      cancellations.clear();
    },
  };
}
