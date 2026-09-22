import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "long-march",
  "kind": "video",
  "title": "两万五千里征途",
  "cover": "/portfolio/long-march/cover.webp",
  "alt": "两万五千里征途影片画面",
  "description": "我的长征之路",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/long-march/film.webm",
  "width": 854,
  "height": 480,
  "source": {
    "label": "OiiOii",
    "author": "18509204770",
    "url": "https://www.oiioii.tv/space/cc2abdb2-17de-4bb9-8a7b-680a85c2ed0d?shareToken=e5d15908-93f7-4b89-beb7-c8b63cd06b39"
  }
} satisfies Work;
