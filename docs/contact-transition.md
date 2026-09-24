# Contact collage transition

## Reference inspected

Shopify Winter 2026 public bundles, inspected 2026-09-24:

- [Background shader bundle](https://cdn.shopify.com/oxygen-v2/47215/49013/102837/4351350/assets/Background-CGKUhMwd.js): animated noise and mud-normal distortion, progress-driven whole-scene mask, edge glow, Bloom.
- [Particle bundle](https://cdn.shopify.com/oxygen-v2/47215/49013/102837/4351350/assets/Butterflies-DLjrCfBq.js): independent point sprites with velocity, turbulence, size variation and blink uniforms.

The paper overlay shader has no mouse uniform. Mouse influence occurs in the hero circular transition; local pointer response in this implementation is an additional interaction, not a claim about Shopify's paper overlay.

## Local implementation

`liquidContour.ts` solves a moving two-dimensional threshold field instead of translating a fixed wavy line. Broad and medium lobes change shape as scroll progress crosses the field, so different parts of the boundary advance at different speeds. Position-dependent drag and damped springs add local lag and release when scrolling stops or reverses. Continuous time drives gentle motion at rest; a smoothed pointer displaces the nearby edge. The field remains monotonic vertically to prevent contour jumps or disconnected hit regions, and inertia fades at the transition endpoints.

`createHandoffs.ts` shares the resulting samples between the SVG image mask, DOM hit-test clip and GPU glow. Per-sample velocity also drives the dust's short trailing motion, sideways drift and restrained brightness response. The existing light and Bloom settings remain unchanged. This motion model applies to the directory-to-contact handoff; other transitions keep their existing geometry.

`createChapterEdge.ts` now shares `portalLight.ts` with the circular reveal: cold-white emission `(0.9, 0.96, 1)`, exponential band/filament falloffs `40/230`, the same star field and blinking, and the same noise breakup. It uses the portal's two-pass seven-tap blur (step 2.4), Bloom contribution 0.65 and glow-alpha response 0.9 through the shared composite shader. Independent drifting point sprites remain, now in the same cold-white palette. DOM content cannot supply a scene-luminance contour sample to this overlay, so that optional contribution is zero; all light-kernel parameters are shared. The fixed HalfFloat emission targets retain HDR highlights, matching the opening scene's WebGL 2 / EXT_color_buffer_float requirement. This is an original implementation of the observed mechanisms; no Shopify code or textures are copied into the project.

The seam travels from bottom to top as the user scrolls down. The outgoing directory stays fully opaque above it; the contact composition is revealed below it, without an intermediate blank-paper fade. The image and typography remain one masked composition. There are no image strips or electrical arcs. The contact scene's rigid main crystal and separate floating fragments are unaffected.

The work/skills star flow now uses the same `createChapterEdge` renderer. During career-to-directory entry, two contours arrive from the upper-left and lower-right, revealing the incoming directory on their outer sides while the career page remains between them. Their separation decreases to zero, leaving the same persistent star seam without switching renderers or resetting time. Both contours and the SVG mask come from the same sampled geometry. The work/skills image blend is confined to the star seam and click regions are retained; expanding either destination fades the star seam and closing restores it.

Image softening is always attached to the two moving contours: each has a 20px influence band with a 7px sampling radius. The union uses nearest-edge distance, so merging does not double the blur. The entry mask feathers the combined reveal by 3.5px on both sides, while the glow canvas remains outside that mask. The same narrow softening continues on the final star seam without a delayed blur toggle. CPU mask/glow geometry and both picture shaders share the curve, pointer deformation and convergence separation. The reduced-motion skills view uses the same narrow feather. The shared light/Bloom parameters remain unchanged.

The circular portal also receives the seam's interaction response: exponential pointer smoothing at rate 9, local tangential/normal influence radii of 105/135 CSS pixels, up to 24px rim displacement, and 20px star-field repulsion. Its centre stays fixed. Both coverage and glow use the same deformed distance field. Scroll speed briefly increases fine contour movement, with the same 1400px/s reference and 14/3 attack/decay rates as the seam. Touch input does not retain hover; blur/leave fade the pointer response, and reduced motion disables it. The light kernel and opening timeline are unchanged by this interaction.

Rendering is limited to the active handoff and paused when the document is hidden. Reduced-motion preference bypasses the handoff. Point count is 900 on desktop and 420 below 600 CSS pixels; renderer DPR is capped at 1.5. All listeners and GPU resources are released on disposal.

## Input during handoffs

Holding a chapter for a transition no longer makes it inert. Work and skills buttons use the exact sampled upper/lower star contours, including convergence and pointer displacement, as their hit-test clip paths. The empty area between them passes input through to the visible career links. Contact uses its sampled reveal contour for hit-test clipping as well as its SVG paint mask, so its transparent area cannot block the outgoing directory. Loading and fullscreen-view inert states remain owned by their components.

Pointer capture keeps the destination selected at press time if the edge moves before release. Movement beyond 10 CSS pixels or pointer cancellation suppresses activation, while keyboard activation remains available. Closing a destination opened during a handoff restores the held viewport position before resuming the transition.

## Chapter rail

The rail's adjacent labels now share continuous expansion weights from the scene: crystal camera travel, circular portal reveal, career-to-hub gather progress and hub-to-contact collage progress. Width, text opacity and fill opacity use those weights directly, with no timed width/opacity transitions or hover expansion to override a paused frame. Reading fill progress is local to each chapter. The current-step accessibility marker follows the dominant chapter independently of the visual interpolation. Reduced motion retains discrete chapter selection. Expanded widths are measured from the labels and refreshed for viewport/font changes; all observers and listeners are disposed with the main timeline.
