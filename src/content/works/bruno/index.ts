import type { GameWork } from "../types";

/** 小车漫游独立加载；源码与许可信息见游戏目录。 */
export default {
  id: "bruno",
  kind: "game",
  title: "小车漫游",
  year: "2025",
  cover: "/games/bruno/cover.webp",
  alt: "彩色微缩岛屿，小车穿行在树木、赛道与探索机关之间",
  description:
    "驾驶小车探索一座充满机关的世界，跳跃、漂移、挑战赛道，发现散落各处的秘密。本站提供中文单机体验，成就和赛道纪录保存在本机。",
  tools: ["Three.js", "WebGPU", "Rapier"],
  entry: "/games/bruno/index.html",
  controls:
    "WASD / 方向键驾驶 · Shift 加速 · 空格跳跃 · 回车互动 · M 地图 · Esc 暂停",
} satisfies GameWork;
