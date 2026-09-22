import { useEffect, useRef, useState } from "react";
import type { GameWork } from "@/content/works";
import GamePlayer from "./GamePlayer";

/** 封面与说明可在任意设备浏览；点击 Play 才创建游戏，作品墙只加载封面。 */
export default function GamePreview({ work }: { work: GameWork }) {
  const play = useRef<HTMLButtonElement>(null);
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const desktop = matchMedia("(min-width: 800px) and (any-pointer: fine)");
    const update = () => setSupported(desktop.matches);
    update();
    desktop.addEventListener("change", update);
    return () => desktop.removeEventListener("change", update);
  }, []);

  return (
    <div className="game-preview">
      <button
        ref={play}
        className="game-play"
        disabled={!supported}
        onClick={() => setPlaying(true)}
      >
        {supported ? "开始游戏 ↗" : "请在电脑上游玩"}
      </button>
      <p className="game-controls">
        {supported
          ? work.controls
          : "请使用配有鼠标和键盘的电脑打开游戏。"}
      </p>
      {playing && (
        <GamePlayer
          work={work}
          onClose={() => {
            setPlaying(false);
            play.current?.focus({ preventScroll: true });
          }}
        />
      )}
    </div>
  );
}
