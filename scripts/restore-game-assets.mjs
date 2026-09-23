import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { assetUrl } from "../src/lib/assetUrl.ts";

// 只有重新构建游戏时才需要源贴图与字体；主站开发、构建、运行均直接使用 R2。
const root = fileURLToPath(new URL("../", import.meta.url));
const assets = JSON.parse(await readFile(new URL("../games/build-assets.json", import.meta.url), "utf8"));
const hash = (data) => createHash("sha256").update(data).digest("hex");

for (const asset of assets) {
  const target = resolve(root, asset.path);
  if (!target.startsWith(resolve(root, "games") + sep)) throw new Error("素材路径超出 games 目录");
  let current;
  try { current = await readFile(target); } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (current && hash(current) === asset.sha256) continue;

  const response = await fetch(assetUrl(`/_source/${asset.path}`), {
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) throw new Error(`下载失败 ${response.status}: ${asset.path}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (hash(data) !== asset.sha256) throw new Error(`素材摘要不符: ${asset.path}`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, data);
}
console.log(`游戏构建素材已校验：${assets.length} 件。`);
