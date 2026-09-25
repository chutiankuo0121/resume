// Run with the project's Node runtime: node scripts/check-contact-orbits.mjs
import assert from "node:assert/strict";
import { infallOrbit } from "../src/lib/contact/infallDust.ts";

let invisibleRebirths = 0;
for (let index = 0; index < 88; index++) {
  let previous = infallOrbit(0, index);
  for (let frame = 1; frame <= 12_000; frame++) {
    const current = infallOrbit(frame / 120, index);
    assert(Number.isFinite(current.x) && Number.isFinite(current.z));
    assert(current.alpha >= 0 && current.alpha <= 1);
    if (current.cycle === previous.cycle) {
      assert(current.radius <= previous.radius + 1e-9, "infall must not reverse");
      assert(Math.hypot(current.x - previous.x, current.z - previous.z) < .1,
        "a visible orbit must not jump");
    } else {
      invisibleRebirths++;
      assert(previous.alpha < .001 && current.alpha < .001, "respawn must be invisible");
    }
    previous = current;
  }
  // All refresh rates reach the same pose; update-call count must not drive motion.
  const reference = infallOrbit(17, index);
  for (const hz of [30, 60, 120, 144]) {
    let time = 0;
    for (let frame = 0; frame < 17 * hz; frame++) time += 1 / hz;
    const sampled = infallOrbit(time, index);
    assert(Math.hypot(sampled.x - reference.x, sampled.z - reference.z) < 1e-8);
  }
}
assert(invisibleRebirths > 200);
console.log({ particles: 88, seconds: 100, invisibleRebirths, refreshRates: [30, 60, 120, 144], status: "passed" });
