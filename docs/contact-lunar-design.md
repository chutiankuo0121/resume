# Contact: two painted peaks and a black hole

## Composition

The selected reference is `exec-6d11587d-0482-4440-be22-99bb6bfcb0a1.png` from the current design session. The contact page uses a near-black sky, one procedural black hole, and exactly two oil-painted foreground mountains. There is no spacecraft, crystal, continuous lunar surface or full-scene background image.

- `src/lib/contact/contactBlackHole.ts`: a curved-light render pass, sparse orbital dust, HDR bloom and final composition. The current implementation follows the later Prada High / Dan Greenheck direction documented in `contact-black-hole-design.md`; it replaces the original analytic 2D rings. The lens is physically inspired, not an exact relativistic solver.
- `src/lib/contact/createContactScene.ts`: composites the black-hole output and two transparent texture planes. The left/right mountains have different scroll-driven scale/position changes and smoothed pointer offsets, with overscan to keep their outer edges outside the viewport. Their bottom edges stay anchored, avoiding gaps under the foreground during scroll. UV coordinates stay rigid. The distant black hole uses a small camera orbit around its fixed center.
- `src/components/Contact.tsx` and `src/app/contact.css`: live text, the WeChat dialog, mobile composition and static fallback. Portrait puts the black hole below the contact invitation. Reduced motion freezes all scene movement and removes the extra scroll distance.
- Existing `createContactGhost` uses the completed current scene, preserving the source-owned interactive transition details. No full-scene photograph is duplicated behind the cutouts.

The opening crystal and its timeline are independent and unchanged by this design.

## Assets

Built-in image generation created each alpha layer separately from the selected reference. The original PNG alpha was preserved during WebP conversion (quality 91, alpha quality 100).

- `public/contact-signal/lunar-left.webp`: one left pale silver/lavender mountain.
- `public/contact-signal/lunar-right.webp`: one right darker slate mountain.

Full-canvas layers are 1672 × 941, allowing their original corner placement to be preserved. The fallback uses the same two assets only once each. Prior mineral assets remain available for comparison but are no longer loaded by the contact scene or preview loader.

## Verification (2026-09-25)

- `npm run typecheck` and `npm run build` passed.
- Browser screenshots at 1672 × 941 and 390 × 844; mobile has no horizontal overflow and the CTA stays inside the viewport.
- Mouse and scroll parallax inspected; the title area stays clear of the disc and the mountains remain anchored beyond the lower edge.
- WeChat dialog opens and closes with Escape.
- Explore/contact handoff at `data-collage-reveal=0.61340` retains the live scene and interactive seam details.
- Reduced motion collapses contact to one viewport and freezes the scene. Simulated WebGL context loss reveals the static fallback.
- Final WebP sizes: left 70,174 bytes; right 83,772 bytes.

## Generation prompts

### left

Use case: background-extraction. Asset type: transparent parallax foreground PNG for an implemented website. Input image is the approved composition reference. Extract ONLY the LEFT pale silver/lavender oil-painted mountain in the bottom-left corner as one independent cutout. Retain its precise palette, thick impasto brush marks and jagged rocky ridgeline. IMPORTANT: deliver a genuine transparent alpha background, not a checkerboard painted into pixels, not black. Use a wide 16:9 canvas with the mountain in exactly the same bottom-left placement and scale as the reference (confined to bottom 36% and left 43% of the full canvas). All other pixels must be transparent. Keep opaque rock extending to the left and bottom canvas edges. Remove ALL text, buttons, black hole, stars, space background, opposite mountain, spacecraft and ground plane. Exactly ONE mountain. Preserve original silhouette and lighting. No haze, no glow, no shadow outside cutout. This image is a compositing layer, not a complete scene.

### right

Use case: background-extraction. Asset type: transparent parallax foreground PNG for an implemented website. Input image is the approved composition reference. Extract ONLY the RIGHT darker slate-gray oil-painted mountain in the bottom-right corner as one independent cutout. Retain its precise palette, thick impasto brush marks and jagged rocky ridgeline. IMPORTANT: deliver a genuine transparent alpha background, not a checkerboard painted into pixels, not black. Use a wide 16:9 canvas with the mountain in exactly the same bottom-right placement and scale as the reference (confined to bottom 36% and right 36% of the full canvas). All other pixels must be transparent. Keep opaque rock extending to the right and bottom canvas edges. Remove ALL text, buttons, black hole, stars, space background, opposite mountain, spacecraft and ground plane. Exactly ONE mountain. Preserve original silhouette and lighting. No haze, no glow, no shadow outside cutout. This image is a compositing layer, not a complete scene.
