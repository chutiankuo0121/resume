import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "zhenhai",
  "kind": "video",
  "title": "甄海传",
  "cover": "/portfolio/zhenhai/cover.webp",
  "alt": "甄海传影片画面",
  "description": "入选的 AI 叙事短片。",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/zhenhai/film.webm",
  "width": 966,
  "height": 720,
  "source": {
    "label": "OiiOii",
    "author": "AI视觉研究社",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
