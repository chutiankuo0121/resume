# Contact collage transition

## Reference inspected

Shopify Winter 2026 public bundles, inspected 2026-09-24:

- [Background shader bundle](https://cdn.shopify.com/oxygen-v2/47215/49013/102837/4351350/assets/Background-CGKUhMwd.js): animated noise and mud-normal distortion, progress-driven whole-scene mask, edge glow, Bloom.
- [Particle bundle](https://cdn.shopify.com/oxygen-v2/47215/49013/102837/4351350/assets/Butterflies-DLjrCfBq.js): independent point sprites with velocity, turbulence, size variation and blink uniforms.

The paper overlay shader has no mouse uniform. Mouse influence occurs in the hero circular transition; local pointer response in this implementation is an additional interaction, not a claim about Shopify's paper overlay.

## Local implementation

`createHandoffs.ts` generates a time-varying, multi-frequency contour shared by the SVG image mask and GPU glow. Scrolling sets its vertical position; time continues to move the contour at rest. A smoothed pointer gently displaces the nearby edge. Smoothed scroll speed modulates fine movement and particle spread.

`createChapterEdge.ts` draws a narrow grainy luminous rim plus independent seeded point sprites. Sprites have varied lifetimes, drift, turbulence and blinking. Light particles appear over the dark picture; muted dust remains visible over the paper. Local glow is analytic, with no full-screen Bloom pass. This is an original implementation of the observed mechanisms; no Shopify code or textures are copied into the project.

The seam travels from bottom to top as the user scrolls down. The outgoing directory stays fully opaque above it; the contact composition is revealed below it, without an intermediate blank-paper fade. Particle colors follow those two sides. The image and typography remain one masked composition. There are no image strips or electrical arcs. The contact scene's rigid main crystal and separate floating fragments are unaffected. Earlier chapter transitions are unaffected.

Rendering is limited to the active handoff and paused when the document is hidden. Reduced-motion preference bypasses the handoff. Point count is 900 on desktop and 420 below 600 CSS pixels; renderer DPR is capped at 1.5. All listeners and GPU resources are released on disposal.
