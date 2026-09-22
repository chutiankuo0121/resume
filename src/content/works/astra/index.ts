import type { Work } from "../types";

/** 本作品的内容与媒体入口；共享素材直接引用，不重复拷贝。 */
export default {
  id: "astra",
  kind: "website",
  title: "ASTRA · 交互简历",
  year: "2026",
  cover: "/portfolio/horizon.webp",
  alt: "黑洞被白色粒子与雾气环绕",
  description:
    "以黑洞、粒子晶石与工作经历串起个人叙事。通过滚动运镜进入探索目录，再展开循环作品网格和技能画廊。结合 AI 辅助开发，完成粒子 Shader、图像交互、媒体详情及独立游戏的集成。本站即为可交互演示。",
  tools: ["Next.js", "Three.js", "GLSL", "GSAP", "Lenis", "AI 辅助开发"],
  href: "/",
} satisfies Work;
