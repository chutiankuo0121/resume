import type { Rect } from "../src/lib/portfolio/layout";
import { mediaSeed } from "../src/lib/portfolio/order";

export type MosaicCard = {
  key: string; width: number; height: number; nearCenter?: boolean;
  /** 与图像一起参与满铺的音频横带，最终再沿共享边界切开。 */
  bands?: { key: string; aspect: number }[];
};
type Axis = "x" | "y";
type Cut = { score: number; split?: number; axis?: Axis; first?: Cut; second?: Cut };
const MIN_SIDE = 1.55;

function fits(card: MosaicCard, width: number, height: number) {
  const bands = card.bands ?? [];
  const bandHeight = bands.reduce((sum, band) => sum + width / band.aspect, 0);
  return Math.min(width, height - bandHeight) >= MIN_SIDE &&
    (!bands.length || width >= 2.8);
}

/**
 * 面积约束的满铺拼图：先给每张作品足够的面积，再比较横切、竖切。
 * 短边下限阻止窄栏碎图，连续同向切割增加代价；叶子共同覆盖整个矩形。
 */
function partition(cards: MosaicCard[], box: Rect) {
  const weights = [0];
  for (const card of cards) weights.push(weights.at(-1)! + card.width * card.height);
  const sum = (start: number, end: number) => weights[end] - weights[start];
  const cache = new Map<string, Cut>();

  function solve(start: number, end: number, width: number, height: number, axis: Axis): Cut {
    if (end - start === 1) {
      const aspect = cards[start].width / cards[start].height;
      const error = Math.log(width / height / aspect);
      return { score: fits(cards[start], width, height) ? error * error * sum(start, end) : Infinity };
    }
    const key = `${start}:${end}:${axis}:${Math.log(width / height).toFixed(5)}`;
    const cached = cache.get(key);
    if (cached) return cached;
    let splits = Array.from({ length: end - start - 1 }, (_, i) => start + i + 1);
    // 大集合先按面积二分，12 件以内再比较邻近切口，限制新增作品后的初始化开销。
    if (splits.length > 7) splits = splits.sort((a, b) =>
      Math.abs(sum(start, a) / sum(start, end) - 0.5) -
      Math.abs(sum(start, b) / sum(start, end) - 0.5)).slice(0, end - start > 12 ? 1 : 3);
    let best: Cut | undefined;
    for (const split of splits) {
      const fraction = sum(start, split) / sum(start, end);
      function child(from: number, to: number, share: number) {
        const w = axis === "x" ? width * share : width;
        const h = axis === "y" ? height * share : height;
        const options = [solve(from, to, w, h, "x"), solve(from, to, w, h, "y")];
        const cost = (node: Cut) => node.score + (node.axis === axis ? 0.08 * sum(from, to) : 0);
        const chosen = cost(options[0]) < cost(options[1]) ? options[0] : options[1];
        return { node: chosen, score: cost(chosen) };
      }
      const a = child(start, split, fraction), b = child(split, end, 1 - fraction);
      const first = a.node, second = b.node;
      const score = a.score + b.score;
      if (!best || score < best.score) best = { score, split, axis, first, second };
    }
    cache.set(key, best!);
    return best!;
  }

  const horizontal = solve(0, cards.length, box.width, box.height, "x");
  const vertical = solve(0, cards.length, box.width, box.height, "y");
  const tree = horizontal.score < vertical.score ? horizontal : vertical;
  const placements = new Map<string, Rect>();
  function place(node: Cut, start: number, end: number, rect: Rect) {
    if (node.split === undefined) {
      placements.set(cards[start].key, rect);
      return;
    }
    const fraction = sum(start, node.split) / sum(start, end);
    const axis = node.axis!;
    const size = axis === "x" ? "width" : "height";
    const length = rect[size] * fraction;
    place(node.first!, start, node.split, {
      ...rect, [size]: length, [axis]: rect[axis] - (rect[size] - length) / 2,
    });
    place(node.second!, node.split, end, {
      ...rect, [size]: rect[size] - length, [axis]: rect[axis] + length / 2,
    });
  }
  place(tree, 0, cards.length, box);
  return { placements, score: tree.score };
}

/** 分区完成后交换更合适的封面位置，优先匹配画幅，同时保留大小节奏。 */
function fitCards(cards: MosaicCard[], placements: Map<string, Rect>, title: Rect) {
  const cost = (card: MosaicCard, rect: Rect) => !fits(card, rect.width, rect.height) ? Infinity :
    Math.log(rect.width / rect.height / (card.width / card.height)) ** 2 +
    0.15 * Math.log(rect.width * rect.height / (card.width * card.height)) ** 2;
  const featured = cards.filter(card => card.nearCenter);
  const distance = (rect: Rect) => Math.hypot(rect.x - title.x, rect.y - title.y);
  // 游戏优先放进离标题最近的一圈格子，并在其中匹配横竖画幅。
  // 只交换现成矩形的内容，不挪格线、不补空白；其余素材继续参与全局画幅匹配。
  const nearby = [...placements.values()].sort((a, b) => distance(a) - distance(b))
    .slice(0, Math.max(6, featured.length * 2));
  const reserved = new Set<Rect>();
  for (const card of featured) {
    const score = (rect: Rect) => cost(card, rect) + 0.15 * distance(rect) ** 2;
    const current = placements.get(card.key)!;
    const candidates = nearby.filter(rect => {
      const owner = cards.find(item => placements.get(item.key) === rect)!;
      return !reserved.has(rect) && fits(owner, current.width, current.height);
    });
    const target = candidates.sort((a, b) => score(a) - score(b))[0] ?? current;
    const owner = [...placements].find(([, rect]) => rect === target)![0];
    placements.set(owner, placements.get(card.key)!);
    placements.set(card.key, target);
    reserved.add(target);
  }
  const movable = cards.filter(card => !card.nearCenter);
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (let i = 0; i < movable.length; i++) {
      for (let j = i + 1; j < movable.length; j++) {
        const a = movable[i], b = movable[j];
        const x = placements.get(a.key)!, y = placements.get(b.key)!;
        if (cost(a, y) + cost(b, x) + 0.0001 < cost(a, x) + cost(b, y)) {
          placements.set(a.key, y);
          placements.set(b.key, x);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return placements;
}

export function arrangeMosaic(cards: MosaicCard[], title: Rect) {
  const area = cards.reduce((sum, card) => sum + card.width * card.height, title.width * title.height);
  let width = Math.max(8, Math.sqrt(area * 1.12));
  let height = Math.max(7, area / width);
  for (;;) {
    if (cards.length < 4) {
      const titleKey = "\u0000title";
      const plan = partition([{ key: titleKey, width: title.width, height: title.height }, ...cards],
        { x: 0, y: 0, width, height });
      if (Number.isFinite(plan.score)) {
        Object.assign(title, plan.placements.get(titleKey));
        plan.placements.delete(titleKey);
        return { width, height, placements: fitCards(cards, plan.placements, title) };
      }
    } else {
      // 四块区域环绕标题接成风车，主接缝错开，避免整屏贯通的行列。
      const x = title.width / 2, y = title.height / 2;
      const left = -width / 2, bottom = -height / 2;
      const boxes: Rect[] = [
        { x: (left + x) / 2, y: (y + height / 2) / 2, width: x - left, height: height / 2 - y },
        { x: (x + width / 2) / 2, y: (-y + height / 2) / 2, width: width / 2 - x, height: height / 2 + y },
        { x: (-x + width / 2) / 2, y: (bottom - y) / 2, width: width / 2 + x, height: -y - bottom },
        { x: (left - x) / 2, y: (bottom + y) / 2, width: -x - left, height: y - bottom },
      ];
      const plans = boxes.map((box, index) => {
        const group = cards.filter((_, rank) => rank % 4 === index);
        let best = partition(group, box);
        // 大集合减少候选排列，避免新增大量影片后初始化卡顿；画幅仍由后续交换匹配。
        const trials = group.length > 24 ? 3 : 8;
        for (let trial = 0; trial < trials; trial++) {
          const shuffled = [...group].sort((a, b) =>
            mediaSeed(`${a.key}:fit:${trial}`) - mediaSeed(`${b.key}:fit:${trial}`));
          const next = partition(shuffled, box);
          if (next.score < best.score) best = next;
        }
        return best;
      });
      if (plans.every(plan => Number.isFinite(plan.score)))
        return { width, height, placements: fitCards(cards, new Map(plans.flatMap(plan => [...plan.placements])), title) };
    }
    // 无法同时满足最短边时，扩大满铺周期；绝不靠缩小卡片或增加空白补位。
    width *= 1.06;
    height *= 1.06;
  }
}
