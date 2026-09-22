import type { GameWork } from "../types";

/** Ooqo 独立作品卡片；Godot 运行包仅在用户点击试玩后加载。 */
export default {
  id: "ooqo",
  kind: "game",
  title: "Ooqo",
  year: "2025",
  cover: "/games/ooqo/cover.webp",
  alt: "Ooqo 手绘白色标题与紫色小鱼，背景是深色海洋生物纹样",
  description:
    "在手绘鱼群世界里规划路线、积累连击，抵达下一道传送门。中文单机版，角色解锁与设置保存在本机。收录于本站的可玩游戏合集。",
  tools: ["Godot", "WebGL", "Web Audio"],
  entry: "/games/ooqo/index.html",
  controls:
    "点击格子或小鱼移动 · 空格 / 右键释放能力 · WASD 移至邻格 · Esc 打开菜单",
} satisfies GameWork;
