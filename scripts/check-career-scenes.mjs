import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
// Read the real TypeScript content modules without a browser or a second build.
require.extensions[".ts"] = (module, filename) => {
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  module._compile(outputText, filename);
};
const { careerDetails } = require("../src/content/careerDetails.ts");
const { careerReadingState: state } = require("../src/lib/careerReadingState.ts");

const starts = [5000, 8000, 9700, 14000, 16000, 19800, 22300];
const end = 24400, height = 900;
assert.deepEqual(state(0, starts, end, height), { index: 0, progress: 0 });
// A long chapter remains selected and readable beyond its first viewport.
assert.equal(state(6700, starts, end, height).index, 0);
assert.ok(state(6700, starts, end, height).progress < 1);
// The next background starts moving only after the reading range; the date stays
// with the outgoing scene until the incoming scene occupies most of the screen.
assert.deepEqual(state(7352, starts, end, height), { index: 0, progress: 1 });
assert.equal(state(7670, starts, end, height).index, 0);
assert.deepEqual(state(7700, starts, end, height), { index: 1, progress: 0 });
// Fast jumps / browser restoration do not depend on intermediate onEnter callbacks.
assert.equal(state(23000, starts, end, height).index, 6);
assert.equal(state(8400, starts, end, height).index, 1);
assert.equal(state(6000, starts, end, height).index, 0);
assert.deepEqual(state(end + 3000, starts, end, height), { index: 6, progress: 1 });
// Resize changes the transition threshold, without changing the content order.
assert.equal(state(7770, starts, end, 500).index, 0);
assert.equal(state(7860, starts, end, 500).index, 1);
assert.deepEqual(state(200, [], 0, 0), { index: 0, progress: 0 });

const htmlPath = fileURLToPath(new URL("../out/index.html", import.meta.url));
assert.ok(existsSync(htmlPath), "Run npm run build before this check.");
const html = readFileSync(htmlPath, "utf8");
const decode = text => text.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#x27;", "'");
const paragraphs = [...html.matchAll(/<p class="career-paragraph(?: career-paragraph--numbered)?">([\s\S]*?)<\/p>/g)].map(match => decode(match[1]));
const original = careerDetails.flatMap(chapter => chapter.pages.flatMap(page => page.paragraphs));
assert.deepEqual(paragraphs, original, "Every original paragraph must remain in the same order in the exported page.");
assert.equal([...html.matchAll(/class="career-stage"/g)].length, 1);
assert.equal([...html.matchAll(/class="career-years"/g)].length, 1, "The UI must have exactly one date slot.");
assert.equal([...html.matchAll(/class="career-period"/g)].length, careerDetails.length);
for (const name of ["academy", "markets", "computation"]) {
  assert.ok(existsSync(fileURLToPath(new URL(`../out/career-scenes/${name}.webp`, import.meta.url))), `${name} must be included in the deployable output.`);
}
// Gradients and accessible names must resolve inside their own illustration.
// Duplicate SVG IDs can silently repaint another chapter's image in a browser.
const diagrams = [...html.matchAll(/<svg\b[^>]*data-career-diagram="([^"]+)"[^>]*>[\s\S]*?<\/svg>/g)];
assert.equal(diagrams.length, careerDetails.length - 1, "Every work chapter needs its illustration; the university keeps its photo.");
const seenIds = new Set();
for (const [svg, kind] of diagrams) {
  const ids = new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const id of ids) {
    assert.ok(!seenIds.has(id), `SVG ID collision: ${id}`);
    seenIds.add(id);
  }
  for (const [, id] of svg.matchAll(/url\(#([^\)]+)\)/g)) assert.ok(ids.has(id), `${kind}: missing gradient ${id}`);
  const accessibleName = svg.match(/aria-labelledby="([^"]+)"/);
  assert.ok(accessibleName, `${kind}: missing accessible description`);
  for (const id of accessibleName[1].split(" ")) assert.ok(ids.has(id), `${kind}: missing label ${id}`);
}
console.log(`Career checks passed: ${careerDetails.length} chapters, ${original.length} original paragraphs, one date, three bundled backgrounds, ${diagrams.length} isolated accessible SVGs; long-copy, jump, reverse and resize boundaries.`);
