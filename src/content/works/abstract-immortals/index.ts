import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "abstract-immortals",
  "kind": "video",
  "title": "神仙也抽象",
  "cover": "/portfolio/abstract-immortals/cover.webp",
  "alt": "神仙也抽象影片画面",
  "description": "入选的 AI 叙事短片。",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/abstract-immortals/film.webm",
  "width": 1280,
  "height": 720,
  "source": {
    "label": "OiiOii",
    "author": "水饺瞎剪",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
