export type WorkKind =
  | "image"
  | "video"
  | "audio"
  | "website"
  | "project"
  | "game";
type WorkBase = {
  id: string;
  title: string;
  // 旧作品未记录创作年份时省略，不用迁移年份冒充创作时间。
  year?: string;
  /** 网格预览图；图集作品对应 images 的第一张，可单独提供轻量封面。 */
  cover: string;
  alt: string;
  description: string;
  tools: string[];
  /** 策展收录的作品保留原作者与出处，与本人创作的作品区分。 */
  source?: { label: string; author: string; url: string };
};
// 联合类型要求每种作品提供对应资源，避免出现有播放按钮却没有文件的卡片。
export type Work = WorkBase &
  (
    | { kind: "image"; images: { src: string; alt: string }[] }
    | {
        kind: "project";
        images: { src: string; alt: string }[];
        href?: string;
        caseStudy: {
          role: string;
          metrics: { label: string; value: string }[];
          /** 指标口径跟随数据展示，避免把历史回测描述成实盘业绩。 */
          metricNote: string;
          sections: { title: string; body: string }[];
        };
      }
    // 画幅在导入时读取，浏览作品墙时不请求整批视频来探测尺寸。
    | { kind: "video"; src: string; width: number; height: number }
    // 时长与等时长波形在导入时提取，网格浏览不下载整首音乐。
    | { kind: "audio"; src: string; duration: number; waveform: number[] }
    | { kind: "website"; href: string }
    | {
        kind: "game";
        entry: string;
        controls: string;
      }
  );

export const workKinds: { value: WorkKind; label: string }[] = [
  { value: "image", label: "Image" },
  { value: "video", label: "Motion" },
  { value: "audio", label: "Sound" },
  { value: "website", label: "Web" },
  { value: "project", label: "Projects" },
  { value: "game", label: "Play" },
];

export type GameWork = Extract<Work, { kind: "game" }>;
export type AudioWork = Extract<Work, { kind: "audio" }>;
export type ProjectWork = Extract<Work, { kind: "project" }>;
