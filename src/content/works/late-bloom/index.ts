import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "late-bloom",
  "kind": "video",
  "title": "晚开的花",
  "cover": "/portfolio/late-bloom/cover.webp",
  "alt": "晚开的花影片画面",
  "description": "有些花不是不开，只是晚一点",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/late-bloom/film.webm",
  "width": 854,
  "height": 480,
  "source": {
    "label": "OiiOii",
    "author": "油炸臭豆腐",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
