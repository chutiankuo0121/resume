import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "lenin-and-people",
  "kind": "video",
  "title": "列宁和人民",
  "cover": "/portfolio/lenin-and-people/cover.webp",
  "alt": "列宁和人民影片画面",
  "description": "1918年苏联在列宁的领导下的苏维埃历史。",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/lenin-and-people/film.webm",
  "width": 854,
  "height": 480,
  "source": {
    "label": "OiiOii",
    "author": "李仔奇",
    "url": "https://www.oiioii.tv/space/cc2a2447-47f0-4fda-94a6-edc236643fab?shareToken=00e18ba7-1690-4326-b305-0c5dd04d984c"
  }
} satisfies Work;
