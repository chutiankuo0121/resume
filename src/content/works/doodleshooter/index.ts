import type { GameWork } from "../types";

/** 原作者游戏的独立作品入口；运行文件全部放在对应的 games 目录。 */
export default {
  id: "doodleshooter",
  kind: "game",
  title: "涂鸦街区",
  cover: "/games/doodleshooter/cover.webp",
  alt: "纸张与蓝色线条构成的第一人称涂鸦街区",
  entry: "/games/doodleshooter/index.html",
} satisfies GameWork;
