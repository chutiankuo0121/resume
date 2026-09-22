import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "one-day-in-wuxia",
  "kind": "video",
  "title": "我穿越到武侠世界的一天",
  "cover": "/portfolio/one-day-in-wuxia/cover.webp",
  "alt": "我穿越到武侠世界的一天影片画面",
  "description": "入选的 AI 叙事短片。",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/one-day-in-wuxia/film.webm",
  "width": 1280,
  "height": 720,
  "source": {
    "label": "OiiOii",
    "author": "一只小希希",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
