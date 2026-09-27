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
const htmlPath = fileURLToPath(new URL("../out/index.html", import.meta.url));
assert.ok(existsSync(htmlPath), "Run npm run build before this check.");
const html = readFileSync(htmlPath, "utf8");
const decode = text => text.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#x27;", "'");
const paragraphs = [...html.matchAll(/<p class="career-paragraph(?: career-paragraph--numbered)?">([\s\S]*?)<\/p>/g)].map(match => decode(match[1]));
const original = careerDetails.flatMap(chapter => chapter.pages.flatMap(page => page.paragraphs));
assert.deepEqual(paragraphs, original, "Every original paragraph must remain in the same order in the exported page.");
assert.equal([...html.matchAll(/class="career-stage"/g)].length, 1);
assert.ok(html.includes('<div class="career-stage" aria-hidden="true"><canvas class="career-particles"></canvas></div>'), "The decorative particles must stay inside the existing background/handoff layer.");
for (const name of ["intro", "headline", "rule", "opening"]) {
  assert.equal([...html.matchAll(new RegExp(`class="career-${name}"`, "g"))].length, careerDetails.length, `Every chapter needs its own ${name}.`);
}
assert.ok(!/class="career-(?:years|ruler-ticks|milestone|ruler-track)/.test(html), "The retired shared timeline must not be rendered.");
const entryDates = [...html.matchAll(/class="career-entry-date">([^<]+)</g)].map(match => decode(match[1]));
assert.deepEqual(entryDates, careerDetails.map(chapter => chapter.years), "Each article must carry its own accessible date.");
assert.ok(!/class="career-(?:era|reading|current|total)"/.test(html), "The shared ruler must not retain the corner date / progress UI.");
assert.equal([...html.matchAll(/class="career-period"/g)].length, careerDetails.length);
assert.ok(html.includes("/career-scenes/xmut-sanjian-digital.webp"), "The university illustration must remain in the page.");
assert.ok(existsSync(fileURLToPath(new URL("../out/career-scenes/xmut-sanjian-digital.webp", import.meta.url))), "The university illustration must be included in the deployable output.");
assert.ok(!html.includes("data-career-diagram"), "The retired career SVG illustrations must not be rendered.");
console.log(`Career checks passed: ${careerDetails.length} chapters and headers, ${original.length} original paragraphs in order, correct dates, decorative particle stage, no retired ruler or SVG illustrations.`);
