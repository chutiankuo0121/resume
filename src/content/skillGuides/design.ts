import type { SkillGuide } from "./types";

export const designGuide: SkillGuide = {
  scenarios: [
    {
      title: "需求梳理与产品原型",
      flow: "从目标用户、任务和约束出发，梳理信息架构与操作路径，先画低保真方案，再制作交互原型；通过试用补齐返回、空状态和错误反馈，整理为可以交接的产品方案。",
      skills: ["plans", "stitchPrompt", "stitchDesign"],
      tools: ["Figma Design / FigJam","Google Stitch"],
    },
    {
      title: "AI 界面探索与快速迭代",
      flow: "整理参考和设计简报，用 Stitch 展开多个界面方向，结合真实内容比较布局与层级，再在 Figma 或代码中细化状态和响应式表现，形成统一的页面方案。",
      skills: ["stitchPrompt", "stitchDesign", "designMd"],
      tools: ["Google Stitch","Figma Make"],
    },
    {
      title: "设计系统与响应式组件",
      flow: "先定义色彩、字号、间距和栅格，再建立组件及其状态，覆盖桌面与手机断点；将规则整理为设计变量并映射到代码，检查焦点、对比度和文字溢出，保持多页面一致。",
      skills: ["figmaRules", "designMd", "uiReview"],
      tools: ["Figma Design / FigJam","Figma MCP / Dev Mode"],
    },
    {
      title: "可运行原型与设计交付",
      flow: "用 Figma 设计和业务描述制作可运行原型，验证交互后通过 MCP 对齐组件与资源，在现有工程中实现页面，再以截图和实际操作核对表单、导航及异步反馈。",
      skills: ["figma", "stitchReact", "frontend", "uiReview"],
      tools: ["Figma Make","Figma MCP / Dev Mode"],
    },
    {
      title: "3D 交互与动态视觉",
      flow: "围绕展示目标组织 Spline 场景中的物体、材质、灯光和镜头，加入拖动、点击与状态动画后嵌入网页，再优化资源体积和帧率，为手机及低性能设备准备简化版本。",
      skills: ["frontend", "uiReview", "perf"],
      tools: ["Spline / Hana"],
    },
    {
      title: "品牌页面与上线验证",
      flow: "梳理品牌表达和内容层级，设计页面、素材及响应式动效，发布预览后核对文案、链接、加载速度和移动端阅读，再根据真实反馈调整页面与使用路径。",
      skills: ["frontend", "uiReview", "vercelDeploy"],
      tools: ["Framer","Figma Design / FigJam"],
    },
  ],
  tools: [
    {"name":"Google Stitch","href":"https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-updates/"},
    {"name":"Figma Design / FigJam","href":"https://www.figma.com/design/"},
    {"name":"Figma Make","href":"https://www.figma.com/make/"},
    {"name":"Figma MCP / Dev Mode","href":"https://developers.figma.com/docs/figma-mcp-server/"},
    {"name":"Spline / Hana","href":"https://spline.design/"},
    {"name":"Framer","href":"https://www.framer.com/"},
  ],
};
