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
const { advanceFlight, flightTarget, FLIGHT_PER_SCREEN } = require("../src/lib/career/flight.ts");
const { createCareerParticleGeometry } = require("../src/lib/career/particles.ts");
const { createParticleGeometry } = require("../src/lib/assets.ts");
const start = 5000, end = 22000, height = 900;
assert.equal(flightTarget(0, start, end, height), 0, "The opening cannot consume the career flight.");
assert.equal(flightTarget(start + height, start, end, height), FLIGHT_PER_SCREEN);
assert.equal(flightTarget(end + 5000, start, end, height), flightTarget(end, start, end, height), "Freeze throughout the work/skills handoff.");
assert.equal(flightTarget(6000, start, 4000, 0), 0, "Handle a collapsed or transient layout.");

function settle(fps, from, to, seconds) {
  let state = { position: from, velocity: 0 };
  for (let i = 0; i < fps * seconds; i++) state = advanceFlight(state.position, to, 1 / fps);
  return state;
}
const sixty = settle(60, 0, FLIGHT_PER_SCREEN, 1), oneTwenty = settle(120, 0, FLIGHT_PER_SCREEN, 1);
assert.ok(Math.abs(sixty.position - oneTwenty.position) < 1e-9, "Motion must not depend on refresh rate.");
assert.ok(Math.abs(sixty.position - FLIGHT_PER_SCREEN) < .0002);
const returned = settle(60, sixty.position, 0, 2);
assert.ok(Math.abs(returned.position) < 1e-6, "Reverse scroll restores the same particle space.");
assert.ok(Math.abs(returned.velocity) < .0001, "Stop input must remove flight speed.");
assert.deepEqual(advanceFlight(0, 500, 1 / 60), { position: 500, velocity: 0 }, "Anchor jumps must not generate streaks.");
assert.deepEqual(advanceFlight(10, 20, 1 / 60, true), { position: 20, velocity: 0 }, "Resuming an overlay/tab aligns immediately.");
assert.ok(advanceFlight(FLIGHT_PER_SCREEN, 0, 1 / 60).velocity < 0);

// Interleaved model/ambient flags catch accidental sampling of crystal points.
const flags = [0, 1, 0, 1, 1, 0, 1, 1, 1, 0];
const fixture = new ArrayBuffer(8 + flags.length * 9);
new Uint32Array(fixture, 0, 2).set([0x41535452, flags.length]);
new Uint8Array(fixture, 8 + flags.length * 8).set(flags);
const inputs = [fixture];
// Optional original asset gives an exact count check without making all tests network-dependent.
if (process.argv[2]) {
  const bytes = readFileSync(process.argv[2]);
  inputs.push(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}
for (const data of inputs) {
  const before = new Uint8Array(data).slice();
  const original = createParticleGeometry(data);
  const career = createCareerParticleGeometry(data);
  const remounted = createCareerParticleGeometry(data);
  const flags = original.getAttribute("aAmbient");
  let ambientCount = 0;
  for (let i = 0; i < flags.count; i++) if (flags.getX(i) > .5) ambientCount++;
  assert.equal(career.index.count, Math.ceil(ambientCount / 2), "Keep exactly half of the ambient points.");
  assert.deepEqual(career.index.array, remounted.index.array, "Remount must restore the same subset.");
  for (const i of career.index.array) {
    assert.ok(flags.getX(i) > .5, "Never draw the crystal shape in the career background.");
    assert.equal(career.getAttribute("aSize").getX(i), original.getAttribute("aSize").getX(i));
    assert.ok(career.getAttribute("aLight").getX(i) >= .39, "Dark-background particles must be silver.");
  }
  assert.deepEqual(career.getAttribute("position").array, original.getAttribute("position").array,
    "Reuse the opening distribution without making a new tunnel.");
  assert.deepEqual(new Uint8Array(data), before, "Do not modify the buffer shared by opening and contact.");
  console.log(`Crystal ambient particles: ${ambientCount} -> ${career.index.count}`);
  original.dispose(); career.dispose(); remounted.dispose();
}
const html = readFileSync(new URL("../out/index.html", import.meta.url), "utf8");
assert.equal([...html.matchAll(/class="career-dust"/g)].length, 1);
assert.ok(!html.includes('class="career-backdrop"'), "Do not paint obsolete photos behind the flight.");
assert.ok(!html.includes("/career-scenes/lunar-dust.webp"), "Do not preload the rejected lunar background.");
console.log("Career flight checks passed: forward/reverse, settling, refresh-rate independence, jumps, handoff bounds, 50% of crystal ambient points, shared-buffer integrity and one canvas.");
