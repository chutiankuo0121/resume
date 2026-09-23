export type PlaybackState = { playing: boolean; loading: boolean; error: "blocked" | "load" | null };

/** 只有一条音轨；帧循环仅用于短暂的音量渐变，不参与场景渲染。 */
export function createSoundtrackPlayer(
  audio: HTMLAudioElement,
  src: string,
  report: (state: PlaybackState) => void,
) {
  let enabled = false, ready = false, disposed = false;
  let holds = 0, revision = 0, frame = 0;
  const volume = .24;
  const canPlay = () => enabled && ready && !holds && !document.hidden && !disposed;

  function fade(target: number, finished?: () => void) {
    cancelAnimationFrame(frame);
    const start = audio.volume, time = performance.now();
    function update(now: number) {
      const progress = Math.min(1, (now - time) / 450);
      audio.volume = start + (target - start) * (1 - (1 - progress) ** 3);
      if (progress < 1) frame = requestAnimationFrame(update);
      else finished?.();
    }
    frame = requestAnimationFrame(update);
  }

  function sync() {
    const current = ++revision;
    cancelAnimationFrame(frame);
    if (!canPlay()) {
      report({ playing: false, loading: false, error: null });
      // 作品接管声音、页面隐藏时立即让出音轨；手动关闭则轻柔淡出。
      if (audio.paused || holds || document.hidden || !ready) audio.pause();
      else fade(0, () => audio.pause());
      return;
    }
    if (!audio.getAttribute("src")) audio.src = src;
    if (audio.paused) audio.volume = 0;
    report({ playing: !audio.paused, loading: audio.paused, error: null });
    void audio.play().then(() => {
      // play() 可能晚于关闭或作品打开，过期结果不能把声音重新打开。
      if (!canPlay()) { audio.pause(); return; }
      if (current !== revision) return;
      report({ playing: true, loading: false, error: null });
      fade(volume);
    }).catch(error => {
      if (current === revision && canPlay()) {
        enabled = false;
        report({ playing: false, loading: false, error: error?.name === "NotAllowedError" ? "blocked" : "load" });
      }
    });
  }

  const failed = () => {
    if (!disposed && enabled) {
      enabled = false;
      cancelAnimationFrame(frame);
      audio.pause();
      report({ playing: false, loading: false, error: "load" });
    }
  };
  audio.loop = true;
  audio.preload = "none";
  audio.volume = 0;
  audio.addEventListener("error", failed);
  document.addEventListener("visibilitychange", sync);

  return {
    configure(nextEnabled: boolean, nextReady: boolean) {
      enabled = nextEnabled;
      ready = nextReady;
      sync();
    },
    hold() {
      holds++;
      sync();
      let released = false;
      return () => {
        if (released || disposed) return;
        released = true;
        holds--;
        sync();
      };
    },
    dispose() {
      disposed = true;
      revision++;
      cancelAnimationFrame(frame);
      audio.removeEventListener("error", failed);
      document.removeEventListener("visibilitychange", sync);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    },
  };
}
