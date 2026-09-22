import type { GameWork } from "../types";

/** 原作者游戏的独立作品入口；运行文件全部放在对应的 games 目录。 */
export default {
  id: "doodleshooter",
  kind: "game",
  title: "涂鸦街区",
  year: "2026",
  cover: "/games/doodleshooter/cover.webp",
  alt: "纸张与蓝色线条构成的第一人称涂鸦街区",
  description:
    "走进手绘街区，穿梭屋顶与街道，迎击不断出现的敌人。支持暂停与返回作品集的单人射击游戏。",
  tools: ["Three.js", "WebGL", "Web Audio"],
  entry: "/games/doodleshooter/index.html",
  controls:
    "WASD 移动 · 鼠标瞄准射击 · 空格跳跃 · R 换弹 · Esc 暂停",
} satisfies GameWork;
