import type { Work } from "../types";

/** 内容依据本人提供的正式版项目介绍；实盘规模与历史回测指标分别呈现。 */
export default {
  id: "multi-asset-portfolio",
  kind: "project",
  title: "多资产量化投资组合系统",
  year: "2026",
  href: "https://www.codex.surf/net-value",
  cover: "/portfolio/multi-asset-portfolio/cover.webp",
  alt: "多资产量化投资组合前端实机截图：净值走势、绩效指标与品种筛选",
  description:
    "AI 金融创业中的投资辅助产品。基于既有策略完成正式版模块化重构，将策略研究、因子计算、组合构建、动态风控与前端展示接成完整链路，已投入实盘使用。覆盖红利、标普、纳指、黄金、豆粕、政金债六类资产，并以现金承接风险调整后的资金。",
  tools: [
    "Python", "Pandas", "NumPy", "FastAPI", "Deno", "Next.js", "TypeScript",
    "Tailwind CSS", "ECharts", "Turso", "Supabase", "Vercel", "Cloudflare Workers",
  ],
  images: [
    {
      src: "/portfolio/multi-asset-portfolio/net-value.webp",
      alt: "多资产量化投资组合系统的每日净值实机界面",
    },
    {
      src: "/portfolio/multi-asset-portfolio/rebalance-calculator.webp",
      alt: "投资组合调仓计算实机界面：本金配置、资产权重与风险事件",
    },
    {
      src: "/portfolio/multi-asset-portfolio/history.webp",
      alt: "投资组合历史调仓与风险事件的实机界面",
    },
  ],
  caseStudy: {
    role: "策略工程化与全栈开发",
    metrics: [
      { label: "实盘资金规模", value: "120 万元" },
      { label: "配置资产 · 另设现金", value: "6 类" },
      { label: "核心因子模块", value: "12 组" },
      { label: "历史回测 · 年化收益", value: "14.66%" },
      { label: "历史回测 · 最大回撤", value: "−2.77%" },
      { label: "历史回测 · 夏普比率", value: "2.73" },
    ],
    metricNote:
      "本页回测指标按项目介绍文档口径记录，已计入执行成本；回测年化波动率为 5.25%，卡玛比率为 5.29。120 万元为文档披露的实盘资金规模。线上指标随数据和所选日期区间更新，可能与介绍中的回测数值不同。",
    sections: [
      {
        title: "01 / 分层策略与因子研究",
        body: "构建 L0–L4 五层策略架构：基础配置、宏观环境、通用趋势、品种特征、相对价值与交叉市场。12 组核心因子按执行模块统计，组合优化和止盈止损独立管理。通过分阶段检验、模块对照、边际贡献分析及成本与执行延迟压力测试，评估因子的经济逻辑、组合贡献和数据稳定性。",
      },
      {
        title: "02 / 组合风控与可追溯执行",
        body: "在不做空、不加杠杆的约束下，设置资产仓位边界与防守资产约束，结合单品种止盈和组合止损管理风险。区分信号产生与后续执行，保存目标权重、事件状态和历史记录；资金减仓进入现金管理，重复运行不重复生成交易事件。",
      },
      {
        title: "03 / 云端数据与计算链路",
        body: "以 Python 承接正式策略计算和历史回放，将数据采集与计算服务分别部署于 Vercel，通过 Supabase 定时调度，Turso 统一保存基础数据、每日净值与调仓事件。实现增量采集、退避重试、并发任务锁及全表指纹比对，仅写入新增或变化记录，并支持延迟数据补齐后的历史净值修正。",
      },
      {
        title: "04 / 面向日常使用的产品交付",
        body: "使用 Next.js、TypeScript、Tailwind CSS 与 ECharts 构建投资前端，部署至 Cloudflare Workers。提供净值与收益可视化、日期及品种筛选、绩效分析、调仓金额计算与风险事件展示，并完成移动端适配和浏览器缓存。用户可按自身本金和统一策略权重生成调仓建议。",
      },
    ],
  },
} satisfies Work;
