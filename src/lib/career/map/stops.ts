/** A symbolic atlas, not a geographic reconstruction of the employers. */
export const mapStops = [
  { label: "求学", place: "厦门理工", x: -22, z: 3, color: "#658d8c", bearing: -.15, summary: "从金融工程出发，在理论、统计与实践之间，建立理解世界的第一套方法。" },
  { label: "研究", place: "瑞晟投资", x: -13, z: -6, color: "#748b6b", bearing: .1, summary: "走进投资研究，把信息整理成线索，再将线索转化为判断。" },
  { label: "市场", place: "格林大华", x: -6, z: 8, color: "#b38a60", bearing: -.2, summary: "接触真实的交易与客户需求，在市场变化中理解风险和决策。" },
  { label: "自动化", place: "飞瑞来", x: 3, z: -1, color: "#789585", bearing: .2, summary: "让重复的工作成为流程，让数据在业务之间顺畅流动。" },
  { label: "创作", place: "蓝咖生物", x: 11, z: 7, color: "#b47d6d", bearing: -.15, summary: "把创意与工具连接起来，探索内容生产和技术运营的更多可能。" },
  { label: "产品", place: "数版卫士", x: 18, z: -6, color: "#8391a7", bearing: .1, summary: "将人工智能放进真实场景，从需求、体验走向可以使用的产品。" },
  { label: "创业", place: "AI 金融", x: 26, z: 2, color: "#709281", bearing: -.1, summary: "回到金融与技术的交汇处，把策略研究、数据工程和产品开发连接起来。" },
] as const;

export const MAP_OVERVIEW = 1.25;
export const MAP_STOP = 1.85;
export const MAP_RUNWAY = MAP_OVERVIEW + mapStops.length * MAP_STOP + .4;
export const mapStopTime = (index: number) => index < 0 ? .15 : MAP_OVERVIEW + index * MAP_STOP + .85;
export const saturate = (x: number) => Math.max(0, Math.min(1, x));
export const ease = (x: number) => { const t = saturate(x); return t * t * (3 - 2 * t); };

export function mapPose(time: number) {
  const phase = (time - MAP_OVERVIEW) / MAP_STOP;
  const index = Math.max(-1, Math.min(mapStops.length - 1, Math.floor(phase)));
  const local = index < 0 ? 0 : (phase - index) * MAP_STOP;
  return { index, previous: index - 1, flight: ease(local / .8), local,
    ink: index < 0 ? 0 : ease(local / 1.1),
    reading: index < 0 ? 0 : saturate((local - .8) / (MAP_STOP - .8)),
    text: index < 0 ? 1 - ease((time - MAP_OVERVIEW + .35) / .35)
      : ease((local - .5) / .35) * (index === mapStops.length - 1 ? 1 : 1 - ease((local - MAP_STOP + .3) / .3)),
  };
}
