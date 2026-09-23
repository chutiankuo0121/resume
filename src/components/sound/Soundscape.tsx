import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { soundtrack } from "@/content/soundtrack";
import { createSoundtrackPlayer, type PlaybackState } from "@/lib/soundtrack";

const STORAGE_KEY = "astra:sound";
type SoundState = PlaybackState & {
  enabled: boolean;
  prompt: boolean; ready: boolean;
  choose: (enabled: boolean) => void;
  hold: () => () => void;
};
export const SoundContext = createContext<SoundState | null>(null);

export function useSoundtrackHold(active: boolean) {
  const hold = useContext(SoundContext)?.hold;
  useEffect(() => active ? hold?.() : undefined, [active, hold]);
}

/** 用户选择与播放器生命周期集中管理，章节切换不会重建或从头播放配乐。 */
export default function Soundscape({ ready, children }: { ready: boolean; children: ReactNode }) {
  const audio = useRef<HTMLAudioElement>(null);
  const player = useRef<ReturnType<typeof createSoundtrackPlayer> | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>({ playing: false, loading: false, error: null });
  const enabledRef = useRef(false);
  const readyRef = useRef(ready);
  readyRef.current = ready;

  useEffect(() => {
    if (!soundtrack || !audio.current) return;
    const control = createSoundtrackPlayer(audio.current, soundtrack.src, state => {
      setPlayback(state);
      if (state.error) {
        enabledRef.current = false;
        setEnabled(false);
        setPrompt(true);
      }
    });
    player.current = control;
    let saved: string | null = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* 隐私模式仍可在本次访问中开关。 */ }
    enabledRef.current = saved === "on";
    setEnabled(enabledRef.current);
    setPrompt(saved === null);
    control.configure(enabledRef.current, readyRef.current);
    return () => { control.dispose(); player.current = null; };
  }, []);

  useEffect(() => { player.current?.configure(enabledRef.current, ready); }, [ready]);
  const choose = useCallback((value: boolean) => {
    enabledRef.current = value;
    setEnabled(value);
    setPrompt(false);
    try { localStorage.setItem(STORAGE_KEY, value ? "on" : "off"); } catch { /* 存储不可用不影响播放。 */ }
    // 在用户点击的同一调用栈启动，遵循浏览器有声播放要求。
    player.current?.configure(value, readyRef.current);
  }, []);
  const hold = useCallback(() => player.current?.hold() ?? (() => {}), []);
  const value = useMemo(() => ({ enabled, ...playback, prompt, ready, choose, hold }),
    [enabled, playback, prompt, ready, choose, hold]);

  return <SoundContext value={soundtrack ? value : null}>
    {children}
    {soundtrack && <audio ref={audio} loop preload="none" aria-hidden="true" />}
  </SoundContext>;
}
