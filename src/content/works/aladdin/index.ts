import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "aladdin",
  "kind": "video",
  "title": "阿拉丁",
  "cover": "/portfolio/aladdin/cover.webp",
  "alt": "阿拉丁影片画面",
  "description": "入选的 AI 叙事短片。",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/aladdin/film.webm",
  "width": 960,
  "height": 720,
  "source": {
    "label": "OiiOii",
    "author": "椰树特洛夫斯基（反转版）",
    "url": "https://www.oiioii.tv/oii-tv"
  }
} satisfies Work;
