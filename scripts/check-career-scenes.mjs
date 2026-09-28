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
const { experience } = require("../src/content/experience.ts");
const htmlPath = fileURLToPath(new URL("../out/index.html", import.meta.url));
assert.ok(existsSync(htmlPath), "Run npm run build before this check.");
const html = readFileSync(htmlPath, "utf8");
const decode = text => text.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#x27;", "'");
const paragraphs = [...html.matchAll(/<p class="career-paragraph(?: career-paragraph--numbered)?">([\s\S]*?)<\/p>/g)].map(match => decode(match[1]));
const original = experience.flatMap(chapter => chapter.sections.flatMap(section => section.paragraphs));
assert.deepEqual(paragraphs, original, "Every original paragraph must remain in the same order in the exported page.");
assert.equal([...html.matchAll(/class="career-stage"/g)].length, 1);
assert.ok(html.includes('<div class="career-stage" aria-hidden="true"><canvas class="career-particles"></canvas></div>'), "The decorative particles must stay inside the existing background/handoff layer.");
for (const name of ["intro", "headline", "rule", "opening"]) {
  assert.equal([...html.matchAll(new RegExp(`class="career-${name}"`, "g"))].length, experience.length, `Every chapter needs its own ${name}.`);
}
assert.ok(!/class="career-(?:years|ruler-ticks|milestone|ruler-track)/.test(html), "The retired shared timeline must not be rendered.");
const entryDates = [...html.matchAll(/class="career-entry-date">([^<]*)</g)].map(match => decode(match[1]));
assert.deepEqual(entryDates, experience.map(chapter => chapter.years), "Each article must carry its own accessible date; the AI essay has no employment date.");
assert.ok(!/class="career-(?:era|reading|current|total)"/.test(html), "The shared ruler must not retain the corner date / progress UI.");
assert.equal([...html.matchAll(/class="career-period"/g)].length, experience.length);
assert.equal(experience.at(-1).id, "ai-perspective", "The AI essay must remain a separate chapter after the projects.");
assert.equal([...html.matchAll(/class="career-copy-section career-project-section"/g)].length, 2);
assert.ok(!html.includes("/career-scenes/xmut-sanjian-digital.webp"), "The university illustration must not be rendered or preloaded.");
assert.ok(existsSync(fileURLToPath(new URL("../public/career-scenes/xmut-sanjian-digital.webp", import.meta.url))), "Keep the university image file for possible future use.");
assert.ok(!html.includes("data-career-diagram"), "The retired career SVG illustrations must not be rendered.");
console.log(`Career checks passed: ${experience.length} chapters and headers, ${original.length} original paragraphs in order, two inline projects, separate AI essay, correct dates, decorative particle stage, no retired ruler or SVG illustrations.`);
