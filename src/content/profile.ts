import { assetUrl } from "@/lib/assetUrl";

/** 个人资料集中维护；当前方向与创业状态按本人提供的信息更新。 */
export const profile = {
  name: "褚天阔",
  englishName: "Tiankuo Chu",
  focus: "AI 金融 · 应用开发 · 自动化",
  introduction: "从金融数据分析、AI 内容生产到产品与后端开发，目前专注 AI 金融创业。我关注把研究和模型能力接入真实业务流程，做成可持续运行的产品。",
  education: "厦门理工学院 · 金融工程 · 本科",
  email: "806307287@qq.com",
  wechat: assetUrl("/contact/wechat.jpg"),
} as const;
