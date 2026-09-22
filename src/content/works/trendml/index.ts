import type { Work } from "../types";

/** 依据本人提供的 v0.7 项目介绍；实盘、模拟盘和本地性能基准分别标注。 */
export default {
  id: "trendml",
  kind: "project",
  title: "TrendML 期货趋势量化交易平台",
  href: "https://hong.best/",
  cover: "/portfolio/trendml/cover.webp",
  alt: "TrendML 公开展示站实机截图：回测绩效、收益曲线与品种相关性",
  description:
    "独立设计与开发的国内期货量化交易平台，覆盖行情接入、趋势策略计算、信号编排、风险与持仓管理、柜台执行、成交账本、实盘监控和 Web 管理后台。模型策略用于 100 万元规模实盘，中长期模型与日内波段因子组合用于 1500 万元规模模拟盘，共用一套可追溯、可恢复的交易基础设施。",
  tools: [
    "Python", "asyncio", "SQLite", "Linux / systemd", "TqSdk", "RQData",
    "REST", "WebSocket", "Next.js", "React", "TypeScript", "Tailwind CSS",
    "ECharts", "Cloudflare Workers", "Supabase",
  ],
  images: [
    {
      src: "/portfolio/trendml/backtest.webp",
      alt: "TrendML 回测绩效归因：区间指标、日度收益、净值曲线与品种相关性",
    },
    {
      src: "/portfolio/trendml/strategy.webp",
      alt: "TrendML 策略介绍：趋势策略定位、资产范围与风控体系",
    },
  ],
  caseStudy: {
    role: "独立设计与开发 · 策略工程化、交易执行与全栈交付",
    metrics: [
      { label: "模型策略 · 实盘规模", value: "100 万元" },
      { label: "模型与因子 · 模拟盘规模", value: "1500 万元" },
      { label: "生产架构 · 长期服务", value: "7 个" },
      { label: "模拟盘 · 策略执行体", value: "45 个" },
      { label: "100 万版本 · 回归通过", value: "2277 项" },
      { label: "完整最新预测 · 本地提速", value: "2.2–2.4×" },
    ],
    metricNote:
      "资金规模及工程指标依据 v0.7 项目介绍。0.7.199 发布验收中，模拟盘运行 25 个模型与 20 个因子执行体；100 万版本回归为 2277 项通过、17 项跳过。提速为本地真实模型资产的计算基准，不是柜台或交易所成交延迟。截图展示公开站点的回测与策略介绍，回测曲线不代表实盘收益。",
    sections: [
      {
        title: "01 / 七服务架构与职责边界",
        body: "将 DataHub、Model Runtime、Factor Runtime、Strategy Runtime、Trading / Execution、Monitor 和 Admin 拆分为七个长期服务。行情、数学状态、信号生命周期、执行账本和柜台结果各有明确的事实归属；服务通过稳定合同协作，避免策略重放覆盖真实成交，或执行异常反向改写算法信号。",
      },
      {
        title: "02 / 可替换策略与增量计算",
        body: "ModelCore 与 FactorCore 只处理类型化数学输入输出，与数据库、网络和交易柜台解耦。模型负责中长期趋势，因子补充日内波段机会，统一接入策略执行体与信号生命周期。行情缺口、迟到和修订通过维护任务追踪，结合检查点、锚点和受影响区间重放，实现增量计算与服务重启恢复。",
      },
      {
        title: "03 / 事务账本与柜台执行",
        body: "以 SQLite 保存逻辑请求、物理订单尝试、订单身份、成交与持仓；业务状态在同一事务中提交后才唤醒交易服务。唯一柜台会话统一处理报撤单、部分成交、平今平昨、止盈和换月。成交去重与持仓变更沿同一事务链执行，信号、委托和真实成交分别记录，支持执行追溯与账实核对。",
      },
      {
        title: "04 / 异常恢复与交易监控",
        body: "区分明确拒绝、暂不可交易和订单不确定等状态；断线或重启后，先按持久化订单身份与柜台快照核对，再恢复请求处理，减少重复报单风险。Monitor 同时观察服务健康、执行体、队列连续性、账本完整性和账户持仓，通过健康接口与企业微信告警定位交易链路异常。",
      },
      {
        title: "05 / 绩效归因与管理前端",
        body: "使用 Next.js、React、TypeScript 和 ECharts 实现回测绩效、实盘归因、滑点分析、未匹配信号与实时持仓展示。Cloudflare Worker 作为同源网关，负责参数校验、分页、数据转换与访问控制；Supabase 仅承载展示投影，浏览器通过 HttpOnly 会话和 WebSocket 网关访问数据，不持有数据库服务密钥或柜台凭据。",
      },
      {
        title: "06 / 等价优化与生产交付",
        body: "以 CLI 与 systemd 管理运行环境，发布前后核对配置、模型、策略及三组 SQLite 数据，保留旧环境用于回滚。结合全量回归、故障注入、恢复测试与线上健康验收，验证运行状态。逐行比较预测与信号、校验检查点和恢复结果后再优化热点，本地随机森林预测段约提速 4.2–4.5 倍，完整最新预测约提速 2.2–2.4 倍。",
      },
    ],
  },
} satisfies Work;
