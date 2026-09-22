import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "moon-worship",
  "kind": "video",
  "title": "拜月",
  "cover": "/portfolio/moon-worship/cover.webp",
  "alt": "拜月影片画面",
  "description": "【惊悚悬疑】拜月",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/moon-worship/film.webm",
  "width": 854,
  "height": 480,
  "source": {
    "label": "OiiOii",
    "author": "油炸臭豆腐",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
