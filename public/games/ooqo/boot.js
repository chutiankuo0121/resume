/**
 * Ooqo 中文单机版入口。Godot 引擎保持原版，游戏资源由 games/ooqo 源码构建。
 * 启动场景通过 Godot 官方 preloadFile 和场景参数加载，不依赖引擎私有字段。
 */
(() => {
  const canvas = document.getElementById("canvas");
  const overlay = document.getElementById("status");
  const label = document.getElementById("status-text");
  const resume = document.getElementById("resume");
  let disposed = false;
  let started = false;

  function send(type, payload = {}) {
    if (window.parent !== window) {
      window.parent.postMessage(
        { channel: "astra-game", type, ...payload },
        location.origin,
      );
    }
  }

  function fail(error) {
    if (disposed) return;
    console.error(error);
    label.textContent = "Ooqo 加载失败，请返回后重试。";
    resume.hidden = true;
    overlay.hidden = false;
    send("error");
  }

  // Godot 持有回调引用；宿主只能通过同源且来自父窗口的消息控制它。
  window.ooqoPortfolio = {
    pause: null,
    resume: null,
    dispose: null,
    ready() {
      if (disposed) return;
      started = true;
      overlay.hidden = true;
      canvas.focus({ preventScroll: true });
      send("ready");
      if (document.hidden) suspend();
    },
  };

  function suspend() {
    if (!started || disposed) return;
    window.ooqoPortfolio.pause();
    label.textContent = "已暂停";
    resume.hidden = false;
    overlay.hidden = false;
  }

  resume.addEventListener("click", () => {
    if (disposed) return;
    window.ooqoPortfolio.resume();
    overlay.hidden = true;
    canvas.focus({ preventScroll: true });
  });

  function receive(event) {
    if (event.origin !== location.origin || event.source !== window.parent)
      return;
    if (event.data?.channel === "astra-game" && event.data.type === "pause")
      suspend();
  }

  function visibility() {
    if (document.hidden) suspend();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    // 同步停止场景和声音，随后由 iframe 销毁释放 WASM、音频与 WebGL。
    window.ooqoPortfolio.dispose?.();
    engine?.requestQuit();
    window.removeEventListener("message", receive);
    window.removeEventListener("blur", suspend);
    window.removeEventListener("pagehide", dispose);
    window.removeEventListener("portfolio:dispose", dispose);
    document.removeEventListener("visibilitychange", visibility);
  }

  window.addEventListener("message", receive);
  window.addEventListener("blur", suspend);
  window.addEventListener("pagehide", dispose);
  window.addEventListener("portfolio:dispose", dispose);
  document.addEventListener("visibilitychange", visibility);
  canvas.addEventListener(
    "webglcontextlost",
    () => {
      if (!disposed) {
        fail(new Error("WebGL context lost"));
        dispose();
      }
    },
    { once: true },
  );

  let engine;
  async function start() {
    const missing = Engine.getMissingFeatures({ threads: false });
    if (missing.length) throw new Error(missing.join("\n"));
    engine = new Engine({
      executable: "runtime/index",
      mainPack: "runtime/index.pck",
      canvas,
      canvasResizePolicy: 2,
      focusCanvas: true,
      fileSizes: {
        "runtime/index.pck": 20196032,
        "runtime/index.wasm": 36145869,
      },
      onProgress(current, total) {
        if (disposed) return;
        const progress = total > 0 ? Math.min(current / total, 1) : 0;
        const percent = Math.floor(progress * 100);
        label.textContent = percent
          ? `正在加载 Ooqo… ${percent}%`
          : "正在加载 Ooqo…";
        // 向宿主报告真实字节进度，慢网下不足 1% 的增长也能延续等待。
        send("progress", { progress });
      },
      onExit() {
        if (!disposed) fail(new Error("The game has stopped"));
      },
    });
    // 两个本地启动脚本先读入内存；未知大小的预加载请求会使 Godot 的总进度恒为 0。
    await Promise.all(
      ["portfolio.gd", "portfolio.tscn"].map(async (path) => {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`启动脚本加载失败：${path}`);
        const buffer = await response.arrayBuffer();
        if (!disposed) await engine.preloadFile(buffer, path);
      }),
    );
    if (!disposed) await engine.startGame({ args: ["res://portfolio.tscn"] });
  }
  start().catch(fail);
})();
