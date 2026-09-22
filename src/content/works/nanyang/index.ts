import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "nanyang",
  "kind": "video",
  "title": "热血南洋子弟",
  "cover": "/portfolio/nanyang/cover.webp",
  "alt": "热血南洋子弟影片画面",
  "description": "入选的 AI 叙事短片。",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/nanyang/film.webm",
  "width": 1280,
  "height": 720,
  "source": {
    "label": "OiiOii",
    "author": "胖嘟嘟历史",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
