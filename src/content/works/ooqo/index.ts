import type { GameWork } from "../types";

/** Ooqo 独立作品卡片；Godot 运行包仅在用户点击试玩后加载。 */
export default {
  id: "ooqo",
  kind: "game",
  title: "Ooqo",
  cover: "/games/ooqo/cover.webp",
  alt: "Ooqo 手绘白色标题与紫色小鱼，背景是深色海洋生物纹样",
  entry: "/games/ooqo/index.html",
} satisfies GameWork;
