import "./source-loader.mjs";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
const { works } = await import("../src/content/works/index.ts");
const { createPortfolioLayout } = await import("./portfolio-layout.ts");

const dimensions = JSON.parse(await readFile(new URL("../src/content/works/media.json", import.meta.url), "utf8"));
const ids = new Set();
const summaries = works.map(({ id, kind, title, cover, alt, source }) => {
  if (ids.has(id)) throw new Error(`作品 ID 重复：${id}`);
  ids.add(id);
  return { id, kind, title, cover, alt, ...(kind === "audio" ? { author: source?.author ?? "Sound" } : {}) };
});
const media = works.flatMap(work => [...new Set([
  work.cover,
  ...(work.kind === "image" ? work.images.slice(1).map(image => image.src) : []),
])].map((src, index) => {
  const metadata = dimensions[new URL(src).pathname.slice(1)];
  if (work.kind !== "audio" && (!metadata || !(metadata.width > 0 && metadata.height > 0)))
    throw new Error(`封面缺少真实尺寸：${src}；请先运行 npm run assets:inspect`);
  return {
    key: `${work.id}:${index}`, id: work.id, src, kind: work.kind, main: index === 0,
    width: work.kind === "audio" ? 4.2 : work.kind === "video" ? work.width : metadata.width,
    height: work.kind === "audio" ? 1 : work.kind === "video" ? work.height : metadata.height,
    textureWidth: metadata?.width ?? 1, textureHeight: metadata?.height ?? 1,
  };
}));
const start = performance.now();
const layout = createPortfolioLayout(media);
for (const { media: rect, key } of layout.items)
  if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0)
    throw new Error(`作品矩形无效：${key}`);
// 拼图必须完整覆盖周期，且分区不重叠；这里检查结果约束，不复制求解算法。
const area = layout.cells.reduce((sum, cell) => sum + cell.width * cell.height, 0);
if (Math.abs(area - layout.width * layout.height) > 1e-6) throw new Error("作品布局出现空洞");
for (let i = 0; i < layout.cells.length; i++) for (let j = i + 1; j < layout.cells.length; j++) {
  const a = layout.cells[i], b = layout.cells[j];
  if ((a.width + b.width) / 2 - Math.abs(a.x - b.x) > 1e-6 &&
      (a.height + b.height) / 2 - Math.abs(a.y - b.y) > 1e-6) throw new Error("作品分区发生重叠");
}
const payload = { works: summaries, media, layout };
const revision = createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 16);
const text = JSON.stringify({ revision, ...payload }) + "\n";
const output = new URL("../src/content/works/gallery.generated.json", import.meta.url);
if (await readFile(output, "utf8").catch(() => "") !== text) await writeFile(output, text);
console.log(`作品清单：${works.length} 件，布局 ${Math.round(performance.now() - start)}ms（仅构建期），版本 ${revision}`);
