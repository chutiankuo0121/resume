import ts from "typescript";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const texts = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { await collect(path); continue; }
    if (!/\.tsx?$/.test(path)) continue;
    const source = ts.createSourceFile(path, await readFile(path, "utf8"), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ||
          ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node) || ts.isJsxText(node))
        texts.push(node.text);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}
// 抽取文字节点和字符串，不再把中文开发注释烘焙进两个中文字体。
await collect(fileURLToPath(new URL("../src", import.meta.url)));
process.stdout.write([...new Set(texts.join(""))].join(""));
