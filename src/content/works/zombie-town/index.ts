import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "zombie-town",
  "kind": "video",
  "title": "僵尸镇",
  "cover": "/portfolio/zombie-town/cover.webp",
  "alt": "僵尸镇影片画面",
  "description": "一个被遗忘的僵尸道人，一个关于失去未能复得的故事。",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/zombie-town/film.webm",
  "width": 854,
  "height": 480,
  "source": {
    "label": "OiiOii",
    "author": "18645976832",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
