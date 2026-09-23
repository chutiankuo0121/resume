import type { Work } from "../types";

/** 画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "aladdin",
  "kind": "video",
  "title": "阿拉丁",
  "cover": "/portfolio/aladdin/cover.webp",
  "alt": "阿拉丁影片画面",
  "src": "/portfolio/aladdin/film.webm",
  "width": 960,
  "height": 720,
} satisfies Work;
