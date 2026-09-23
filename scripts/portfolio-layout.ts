import { shuffleMedia, mediaSeed } from "../src/lib/portfolio/order";
import { arrangeMosaic, type MosaicCard } from "./portfolio-mosaic";
import { GRID, type Rect, type LayoutMedia, type PortfolioLayout } from "../src/lib/portfolio/layout";

function card(item: LayoutMedia): MosaicCard {
  const naturalAspect = item.width / item.height;
  // 常见横图、竖图保留原比例；极端长图仅在封面处适量裁边，详情仍显示完整内容。
  const aspect = item.kind === "audio" ? 4.2 : item.width > 0 && item.height > 0 && Number.isFinite(naturalAspect)
    ? Math.max(0.45, Math.min(2.4, naturalAspect)) : 1;
  const seed = mediaSeed(`${item.key}:size`);
  // 先用连续变化的目标短边确定面积权重，满铺算法再匹配画幅并约束最终最短边。
  const shortSide = 1.55 + seed * 0.64 + (item.main ? 0.1 : 0);
  return {
    key: item.key,
    nearCenter: item.kind === "game",
    width: shortSide * Math.max(1, aspect),
    height: shortSide / Math.min(1, aspect),
  };
}

export function createPortfolioLayout(media: LayoutMedia[]): PortfolioLayout {
  if (new Set(media.map((item) => item.key)).size !== media.length)
    throw new Error("Portfolio media keys must be unique");
  const title: Rect = { x: 0, y: 0, width: 4.8, height: 3 };
  const shuffled = shuffleMedia(media);
  const audio = shuffled.filter(item => item.kind === "audio");
  const cards = shuffled.filter(item => item.kind !== "audio").map(card);
  const hosts = cards.filter(item => !item.nearCenter).sort((a, b) =>
    // 优先借用较宽图像的边缘，ID 种子使音频散落在不同位置，而非单独排成一行。
    (b.width / b.height >= 1.2 ? 1 : 0) - (a.width / a.height >= 1.2 ? 1 : 0) ||
    mediaSeed(`${a.key}:audio`) - mediaSeed(`${b.key}:audio`));
  for (const [index, item] of audio.entries()) {
    if (!hosts.length) { cards.push(card(item)); continue; }
    const host = hosts[index % hosts.length];
    const aspect = 3.6 + mediaSeed(`${item.key}:band`) * 1.6;
    (host.bands ??= []).push({ key: item.key, aspect });
    host.height += host.width / aspect;
  }
  const { width, height, placements } = arrangeMosaic(cards, title);
  // 图像与音频先作为一个包络参与拼图，再无损切开。音频保持 3.6–5.2:1，
  // 图像仍有 1.55 的短边下限；共享切口不产生空洞，也不塞入碎小封面。
  for (const host of hosts) {
    const rect = placements.get(host.key)!;
    for (const band of host.bands ?? []) {
      const h = rect.width / band.aspect;
      const direction = mediaSeed(band.key) > 0.5 ? 1 : -1;
      placements.set(band.key, { ...rect, height: h, y: rect.y + direction * (rect.height - h) / 2 });
      rect.height -= h;
      rect.y -= direction * h / 2;
    }
  }

  return {
    width, height, title,
    cells: [title, ...placements.values()],
    items: media.map((item) => {
      const cell = placements.get(item.key)!;
      return {
        key: item.key,
        // 封面直达格边，仅保留统一细缝；圆角、封面与点击范围共用同一尺寸。
        media: { ...cell, width: cell.width - 2 * GRID.inset, height: cell.height - 2 * GRID.inset },
      };
    }),
  };
}
