import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "guixu-operation",
  "kind": "video",
  "title": "归墟行动：巨鳌负山",
  "cover": "/portfolio/guixu-operation/cover.webp",
  "alt": "归墟行动：巨鳌负山影片画面",
  "description": "入选的 AI 叙事短片。",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/guixu-operation/film.webm",
  "width": 1280,
  "height": 720,
  "source": {
    "label": "OiiOii",
    "author": "小声",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
