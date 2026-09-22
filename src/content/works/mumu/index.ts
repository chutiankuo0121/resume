import type { Work } from "../types";

/** 入选短片：保留来源；画幅来自实际转码文件，网格无需请求视频元数据。 */
export default {
  "id": "mumu",
  "kind": "video",
  "title": "木木的小事",
  "cover": "/portfolio/mumu/cover.webp",
  "alt": "木木的小事影片画面",
  "description": "木木今天在等朋友的约会信息，手机每亮一次就跑过去，最后是假装不在意。",
  "tools": [
    "AI 短片"
  ],
  "src": "/portfolio/mumu/film.webm",
  "width": 854,
  "height": 480,
  "source": {
    "label": "OiiOii",
    "author": "王艾琳",
    "url": "https://www.oiioii.tv/space/c938773d-9968-4f5a-81dc-acf481677b31?shareToken=def4c759-bcfc-4397-b0ca-f5b3caa77073"
  }
} satisfies Work;
