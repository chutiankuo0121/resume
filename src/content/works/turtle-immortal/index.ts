import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "turtle-immortal",
  "kind": "video",
  "title": "龟仙",
  "cover": "/portfolio/turtle-immortal/cover.webp",
  "alt": "龟仙影片画面",
  "description": "入选的 AI 叙事短片。",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/turtle-immortal/film.webm",
  "width": 1280,
  "height": 720,
  "source": {
    "label": "OiiOii",
    "author": "AI玄一",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
