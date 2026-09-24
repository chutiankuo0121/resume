# Crystal camera sequence

The opening camera has three scroll-driven phases. `OPENING` in `openingTitles.ts` owns their boundaries; the text timing and total scroll distance are unchanged.

- Entry: 0.5–1.0, the existing short arc and pullback.
- Reading: 1.0–2.1, a rightward orbit of 25 degrees on desktop or 16 degrees below 700 CSS pixels. A smootherstep curve brings the orbit to rest at both ends.
- Exit: from 2.1, the existing Elimar exit transform applied to the orbit's final pose, followed by the portal reveal at 2.44.

`transition.ts` supplies a separate `cameraOrbit` progress. `camera.ts` rebuilds the entry pose each frame, then rotates both camera position and orientation around the model centre. This preserves the centre's projected position, viewing distance and depth while revealing different facets. Pointer rotation is layered on afterward, followed by the exit transform. Reverse scrolling retraces the same poses without accumulated rotation.

The atmosphere projection is calculated from the resulting camera against its original world plane. Lighting, depth and particles use that same camera. Reduced motion disables the reading orbit. No additional render pass or per-frame object allocation is introduced.
