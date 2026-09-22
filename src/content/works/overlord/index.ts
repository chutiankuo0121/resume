import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "overlord",
  "kind": "video",
  "title": "霸王",
  "cover": "/portfolio/overlord/cover.webp",
  "alt": "霸王影片画面",
  "description": "一个人的霸王别姬",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/overlord/film.webm",
  "width": 854,
  "height": 480,
  "source": {
    "label": "OiiOii",
    "author": "兔子导演",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
