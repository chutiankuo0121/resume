import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "ford-assembly-line",
  "kind": "video",
  "title": "福特的造车流水线如何颠覆世界",
  "cover": "/portfolio/ford-assembly-line/cover.webp",
  "alt": "福特的造车流水线如何颠覆世界影片画面",
  "description": "入选的 AI 叙事短片。",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/ford-assembly-line/film.webm",
  "width": 1280,
  "height": 720,
  "source": {
    "label": "OiiOii",
    "author": "Pinnacle 车库",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
