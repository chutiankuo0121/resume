import type { Work } from "@/content/works";
import type { CardOrigin } from "@/lib/cardMotion";
import MediaViewer from "./MediaViewer";
import ProjectDetail from "./ProjectDetail";
import GamePlayer from "./GamePlayer";
import { useSoundtrackHold } from "../sound/Soundscape";

/** 点击即进入对应内容，不在媒体或游戏前额外插入介绍卡片。 */
export default function WorkDetail({ work, origin, onClose }: {
  work: Work;
  origin?: CardOrigin;
  onClose: () => void;
}) {
  useSoundtrackHold(work.kind === "video" || work.kind === "audio" || work.kind === "game");
  if (work.kind === "game") return <GamePlayer work={work} onClose={onClose} />;
  if (work.kind === "project" || work.kind === "website")
    return <ProjectDetail work={work} origin={origin} onClose={onClose} />;
  return <MediaViewer work={work} onClose={onClose} />;
}
