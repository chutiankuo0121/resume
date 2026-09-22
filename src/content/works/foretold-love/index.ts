import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "foretold-love",
  "kind": "video",
  "title": "预言中的恋人",
  "cover": "/portfolio/foretold-love/cover.webp",
  "alt": "预言中的恋人影片画面",
  "description": "入选的 AI 叙事短片。",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/foretold-love/film.webm",
  "width": 1280,
  "height": 720,
  "source": {
    "label": "OiiOii",
    "author": "空空",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
