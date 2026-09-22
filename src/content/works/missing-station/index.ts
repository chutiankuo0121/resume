import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "missing-station",
  "kind": "video",
  "title": "不存在的车站",
  "cover": "/portfolio/missing-station/cover.webp",
  "alt": "不存在的车站影片画面",
  "description": "程序员小林误入与世隔绝的“泽山镇”，曝光20年前的真相",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/missing-station/film.webm",
  "width": 854,
  "height": 480,
  "source": {
    "label": "OiiOii",
    "author": "金金",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
