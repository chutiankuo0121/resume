# Crystal camera sequence

The opening camera has three scroll-driven phases. `OPENING` in `openingTitles.ts` owns their boundaries. Text timing is unchanged; the journey height tracks the total duration at 550svh per unit on desktop or 460svh on mobile, plus one viewport for the sticky stage.

- Entry: 0.5–1.0, the existing short arc and pullback.
- Reading: 1.0–2.1, a rightward orbit of 25 degrees on desktop or 16 degrees below 700 CSS pixels. A smootherstep curve brings the orbit to rest at both ends.
- Exit: from 2.1, the existing Elimar exit transform applied to the orbit's final pose. The portal starts at 2.44 and expands over 0.2 units; the opening ends at 2.68. The portal is delayed by 0.08 units (approximately three wheel notches) while preserving the orbit and reveal speeds.

`transition.ts` supplies a separate `cameraOrbit` progress. `camera.ts` rebuilds the entry pose each frame, then rotates both camera position and orientation around the model centre. This preserves the centre's projected position, viewing distance and depth while revealing different facets. Pointer rotation is layered on afterward, followed by the exit transform. The camera retains its pointer offset throughout the exit: fading it with the model's `focus` state previously counter-steered the first part of the exit for off-centre pointers. The Elimar displacement, rotation curve and duration are unchanged. Reverse scrolling retraces the same poses without accumulated rotation.

The atmosphere projection is calculated from the resulting camera against its original world plane. Lighting, depth and particles use that same camera. Reduced motion disables the reading orbit. No additional render pass or per-frame object allocation is introduced.
