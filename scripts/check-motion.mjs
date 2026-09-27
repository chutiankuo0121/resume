import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
require.extensions[".ts"] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};
const { createInkBoundary } = require("../src/lib/hub/createInkBoundary.ts");
const { createPortalContour } = require("../src/lib/chapters/portalContour.ts");
const { createColorLens } = require("../src/lib/hub/createColorLens.ts");
globalThis.devicePixelRatio = 1;
const polygon = clip => [...clip.matchAll(/(-?[\d.]+)px (-?[\d.]+)px/g)].map(m => [Number(m[1]), Number(m[2])]);
const area = p => Math.abs(p.reduce((sum, a, i) => {
  const b = p[(i + 1) % p.length];
  return sum + a[0] * b[1] - a[1] * b[0];
}, 0)) / 2;
for (const [width, height] of [[1280, 720], [390, 844], [844, 390]]) {
  const context = new Proxy({ globalAlpha: 1 }, { get: (o, key) => key in o ? o[key] : () => {} });
  const canvas = { getContext: () => context };
  const guide = { offsetLeft: 30, offsetTop: 40, offsetWidth: width - 60, offsetHeight: height - 80 };
  const state = { width, height, expansion: 0, destination: "work" };
  const ink = createInkBoundary(canvas, guide, state);
  ink.resize(width, height);
  const first = ink.render(0, 0, 0, "static");
  const original = first.workClip;
  const ordinate = x => (state.inkLine.left + (state.inkLine.right - state.inkLine.left) * x / width) * height;
  const frame = first.frame;
  if (width >= 800) {
    assert.ok(Math.abs(ordinate(frame.left + guide.offsetWidth * .2) - frame.bottom) < 1e-9);
    assert.ok(Math.abs(ordinate(frame.left + guide.offsetWidth * .8) - frame.top) < 1e-9);
  } else {
    assert.ok(Math.abs(ordinate(frame.left) - (frame.top + guide.offsetHeight * .6)) < 1e-9);
    assert.ok(Math.abs(ordinate(frame.right) - (frame.top + guide.offsetHeight * .4)) < 1e-9);
  }
  const revision = first.revision;
  for (let i = 0; i < 120; i++) assert.equal(ink.render(1 / 60, i, i, "animate").revision, revision);
  for (const destination of ["work", "skills"]) {
    state.destination = destination;
    for (let i = 0; i <= 100; i++) {
      state.expansion = i / 100;
      const { workClip, skillsClip, frame: f } = ink.render(0, 0, 0, "static");
      const work = polygon(workClip), skills = polygon(skillsClip);
      assert.ok(work.length <= 5 && skills.length <= 5);
      assert.ok(Math.abs(area(work) + area(skills) - (f.right - f.left) * (f.bottom - f.top)) < 15, "Hit regions must partition the picture window without overlap or gaps.");
      if (i === 100) assert.equal(area(destination === "work" ? skills : work), 0);
    }
  }
  state.expansion = 0;
  assert.equal(ink.render(0, 0, 0, "static").workClip, original);
  ink.dispose();

  const portal = createPortalContour(513);
  const frames = Array.from({ length: 49 }, (_, i) => JSON.stringify(portal.update(i / 48, width, height)));
  for (let i = 48; i >= 0; i--) assert.equal(JSON.stringify(portal.update(i / 48, width, height)), frames[i]);
  assert.deepEqual(portal.update(0, width, height)[0], { x: width / 2, y: height / 2 });
  assert.deepEqual(portal.update(1, width, height)[0], portal.update(1, width, height).at(-1));
}

// Pointer events must not trigger layout. All rendering reads one cached origin.
globalThis.window = new EventTarget();
globalThis.document = new EventTarget();
document.documentElement = new EventTarget();
globalThis.matchMedia = query => Object.assign(new EventTarget(), { matches: !query.includes("reduced-motion") });
let reads = 0;
const outline = { style: {} };
const stage = { querySelector: () => outline, dataset: {}, classList: { contains: () => false },
  getBoundingClientRect: () => { reads++; return { left: 20, top: 40 }; } };
const guide = { offsetLeft: 30, offsetTop: 30, offsetWidth: 940, offsetHeight: 540 };
const state = { width: 1000, height: 600, expansion: 0, gather: 1 };
const lens = createColorLens(stage, guide, state);
lens.resize();
const move = (x, y) => window.dispatchEvent(Object.assign(new Event("pointermove"), { pointerType: "mouse", isPrimary: true, clientX: x, clientY: y }));
for (let i = 0; i < 100; i++) move(220 + i, 240);
assert.equal(reads, 0);
lens.update(1 / 60);
assert.equal(reads, 1);
move(720, 440);
for (let i = 0; i < 90; i++) lens.update(1 / 60);
assert.equal(reads, 1);
assert.ok(Math.abs(state.colorLens.x - 700) < .01 && Math.abs(state.colorLens.y - 400) < .01);
assert.equal(state.colorLens.strength, 1);
window.dispatchEvent(new Event("scroll"));
lens.update(1 / 60);
assert.equal(reads, 2);
state.expansion = 1;
lens.update(1 / 60);
assert.equal(state.colorLens.strength, 0);
lens.dispose();
console.log("Motion checks passed: desktop/mobile seams, exact forward/reverse portal, hit coverage, fullscreen reset, cached geometry and pointer layout reads.");
