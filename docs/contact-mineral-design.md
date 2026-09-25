# Contact — mineral theatre

The selected monochrome rock concept replaces the ocean/astronomical collage. The contact view has one persistent invitation and the existing WeChat dialog. Its 240svh desktop / 210svh mobile runway drives four independent rock planes around the live particle model. The fixed backdrop and ambient point space do not inherit this motion. Foreground pointer travel is 54px; far rock travel is 6px. Scroll opens the gap between the two walls, moves the foreground upward, and gently brings the crystal closer. Reduced motion keeps the initial composition with no pointer or scroll travel.

The existing seam coverage and interactive picture/text details still process the full live composition. The crystal surface buffer and interaction kernel are unchanged; contact still retains only one tenth of ambient points. A static CSS composition uses the same alpha assets when WebGL is unavailable.

## Assets

Generated with the built-in image generation tool from the user-selected contact concept. Final project files are `public/contact-signal/mineral-spire.webp`, `mineral-wall.webp`, and `mineral-foreground.webp`. PNGs were converted to WebP at quality 85 with alpha quality 100; no painted crystal or text is baked into the artwork. The far slab reuses the spire texture at a different scale and tone.

## Generation prompts

The spire received one follow-up edit to restore its complete natural tip for the narrow-screen composition. Its desktop crop and materials remain consistent.

### Spire tip refinement

Use case: precise-object-edit. This is a transparent PNG rock layer for a responsive website. Edit the supplied isolated rock asset: reconstruct its upper end into a complete natural sharp jagged peak, fully inside the image, with a little transparent air above the tip (about 4% of the height). Its top must NOT be cut off by the image boundary. Keep the existing silver-gray slate material, long narrow leaning shape, horizontal strata and the small red mark, and preserve the width and lower section. Rock base still extends beyond the bottom edge. Portrait 2:3, 1024x1536. Preserve genuine alpha transparency everywhere outside the rock. No background, no extra rocks, no crystals, no stars, no UI or text. Make the peak look like weathered slate with an uneven broken tip, not a geometric triangle.

### spire

Use case: background-extraction. Asset type: transparent PNG cutout for a layered parallax website. Input image: design reference and extraction target. Extract/recreate ONLY the tall narrow pale silver-gray rock slab in the middle of the reference, the upright left wall of the crystal gap, complete its shape behind the foreground. Portrait 2:3 canvas. One single vertical jagged slate monolith, cropped naturally at top and bottom of frame, tapered at the top, wider at bottom, slightly leaning right. The rock occupies the middle 55 percent of the canvas; all surrounding pixels genuinely transparent with alpha. Match the reference's monochrome printed stone, chiseled strata, torn fibrous edges, tactile gray paper rock. Keep the small muted red vertical pigment mark on the rock, very small. Light from upper left, low key soft editorial lighting. No background, no sky, no shadows on a ground plane, no other rocks, NO crystal, NO particles, NO text, NO UI, no checkerboard drawn into image. Sharp detailed grayscale texture with restrained contrast. The entire surrounding region must be transparent, not black.

### wall

Use case: background-extraction. Asset type: transparent PNG cutout for layered parallax website. Input image: design reference and extraction target. Extract/recreate ONLY the silver-gray rock wall along the right-hand edge of the reference, complete rock behind foreground. Portrait 2:3 canvas. Rock fills rightmost 70% of canvas, leaving leftmost 30% genuinely transparent with alpha. Upper and right and bottom edges of rock intentionally extend beyond image frame. Its left silhouette is jagged and slightly concave, sloping outward toward bottom, enclosing a chasm. Match the reference gray rock with dark horizontal strata around the middle and fibrous torn contours, monochrome lithographic / tactile printed stone quality. Soft upper left lighting, restrained contrast. No other rock at left, NO crystal, NO particles, NO sky, no black background, NO text, NO UI. Transparent background around the rock, no checkerboard baked in.

### foreground

Use case: background-extraction. Asset type: transparent PNG foreground cutout for layered parallax website. Input image: design reference and extraction target. Extract/recreate ONLY the very dark charcoal slate foreground ridge across the lower edge of the reference. Landscape 16:9 canvas. Its upper silhouette starts at y=80% on left, dips to y=92% at x=40%, then rises diagonally to y=48% on the right. Rock fills everything BELOW this jagged silhouette to canvas bottom; everything ABOVE is genuinely transparent with alpha. Very dark near-black textured slate, low raking illumination revealing fine sedimentary strata, subtle paper-cut torn edge. Match the reference foreground exactly in tone and rugged composition. Do not add tall rock towers, no stars, no particles, NO crystal, NO text, no UI, no sky, no black background above ridge. True transparency, not a drawn checkerboard. Wide 16:9.
