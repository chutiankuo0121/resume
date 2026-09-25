# 全景经历素材与生成提示词

## 素材交付

使用内置 imagegen 工具生成。每幕先生成全景母图，再以母图分别编辑得到同坐标的线稿和透明物体；运行时仅加载后两张。PNG 转 WebP 使用 Sharp，quality 90、alphaQuality 100；没有通过代码绘制或编辑图像内容。每张 1672 × 941，透明图保留 RGBA。14 张运行时素材总计约 4.7 MB。

视觉方向来自用户指定的 [Gathered Scenes Zine](https://github.com/Zeejay0/gathered-scenes-zine-skill)，按最新要求调整为横向全景、线稿环境和自然轮廓的实体拼片。大学画面参考旧项目校园形象，工作场景均为概念插画，不代表真实办公地点。Visual Skill by @Zeejay0.

| 场景 | 全景线稿 | 透明拼片 |
| --- | --- | --- |
| university | public/career-panorama/university-sketch.webp | public/career-panorama/university-objects.webp |
| research | public/career-panorama/research-sketch.webp | public/career-panorama/research-objects.webp |
| markets | public/career-panorama/markets-sketch.webp | public/career-panorama/markets-objects.webp |
| automation | public/career-panorama/automation-sketch.webp | public/career-panorama/automation-objects.webp |
| creative | public/career-panorama/creative-sketch.webp | public/career-panorama/creative-objects.webp |
| product | public/career-panorama/product-sketch.webp | public/career-panorama/product-objects.webp |
| venture | public/career-panorama/venture-sketch.webp | public/career-panorama/venture-objects.webp |

## University

母图方向：16:9 横向全景校园，厦门理工学院阶梯教学楼、右侧斜顶高楼、山脊、湖水、桥与芦苇；奶油色纸张、石墨线条和蓝色手绘颜料；构图延伸到左右两边，不设空白半页，不含文字。建筑和桥边植物按自然轮廓拆出，保持母图的位置、比例和透视；其余部分完全透明。

### 线稿编辑提示词（实际使用）

Edit this supplied campus panorama into the underlying architectural PENCIL LINE DRAWING on warm ivory #f1eadc paper. Preserve EXACT pixel registration, camera, horizon, scale, and ALL object positions. Do not recompose or crop. Convert all colored painting to delicate broken graphite/pale blue-gray contour lines and sparse loose pencil hatching. White/ivory sky, NO blue fills, NO colored solid surfaces. Architecture, lake shoreline, mountains and trees remain recognizable in fine sketch lines. Group leaves into simple quiet canopy contours; eliminate dense stipple and grunge. Include thin outlines of both campus buildings, footbridge and plants exactly where they were. This will be used as the full-screen sketch underneath precisely aligned painted object cutouts. Full bleed 16:9, no text, no borders, no UI. The result should have a very light airy sketchbook character, plenty of paper showing through, not a grayscale photograph.

## research

### 全景母图提示词（实际使用）

Create a NEW full-bleed 16:9 LANDSCAPE panoramic gouache and graphite illustration for an interactive portfolio. The supplied campus image is STYLE reference only, replace its subject completely. An investment researcher’s coastal study overlooking a harbor. A broad desk stretching across the full lower frame, tall arched windows across both left and right, shelves and a distant city outside. Main separate objects: a brass articulated desk lamp at x65–76% y28–67%, a large open notebook and stacked research books at x49–76% y68–90%, and a globe on stand at x79–96% y37–83%. Cobalt blue, ivory, antique brass. No readable writing, charts may be simple ink strokes. The entire image is a continuous environment, drawn edge to edge, with objects integrated into correct perspective. Objects are distinct silhouettes, sufficiently separated for cutting out along their natural edges and independent parallax animation. Main objects should be large, substantial, tactile and hand-painted. Background is mostly airy graphite and restrained light wash on warm ivory #f1eadc paper. Fine-art travel sketchbook with dry pigment, subtle paper grain, realistic elegant objects, quiet atmospheric depth. Continue the environment behind the LEFT region as well: no empty half, no gradient to blank paper, no split composition. No horizontal torn strips, no rectangle collage panels, no artificial white sticker borders, no UI or typography, no digits or watermark. This is a single finished panoramic artwork, not a contact sheet.

### 透明物体编辑提示词（实际使用）

Precise subject extraction for a layered parallax website. Keep the EXACT 16:9 canvas size, perspective, proportions and pixel positions from the input. Output a genuinely TRANSPARENT RGBA background. Preserve ONLY the large articulated brass desk lamp, the globe with its stand, and the foreground open notebook plus three stacked blue books. No table, pens cup, room or landscapes. Everything else MUST be fully transparent. Preserve the painted subjects exactly, do not redraw, resize or move them. Clean natural silhouette edges, transparent gaps, no rectangular patches of scenery, no white outline, no cast shadows outside the subjects. No background texture and no new objects. This transparent image will overlay the original at exactly the same coordinates.

## markets

### 全景母图提示词（实际使用）

Create a NEW full-bleed 16:9 LANDSCAPE panoramic gouache and graphite illustration for an interactive portfolio. The supplied campus image is STYLE reference only, replace its subject completely. A wide coastal observation terrace overlooking a working harbor and mountains, wind and pale open sky, wooden deck sweeping from left foreground into the right distance. Main separate objects: a cream-and-rust lighthouse on the RIGHT at x78–91% y23–72%, a large antique brass telescope on tripod at x55–72% y43–87%, and lower foreground rocks and a mooring rope at x49–100% y82–100%. Limited warm terracotta, cream, gray-blue. Ships are tiny distant line sketches. The entire image is a continuous environment, drawn edge to edge, with objects integrated into correct perspective. Objects are distinct silhouettes, sufficiently separated for cutting out along their natural edges and independent parallax animation. Main objects should be large, substantial, tactile and hand-painted. Background is mostly airy graphite and restrained light wash on warm ivory #f1eadc paper. Fine-art travel sketchbook with dry pigment, subtle paper grain, realistic elegant objects, quiet atmospheric depth. Continue the environment behind the LEFT region as well: no empty half, no gradient to blank paper, no split composition. No horizontal torn strips, no rectangle collage panels, no artificial white sticker borders, no UI or typography, no digits or watermark. This is a single finished panoramic artwork, not a contact sheet.

### 透明物体编辑提示词（实际使用）

Precise subject extraction for a layered parallax website. Keep the EXACT 16:9 canvas size, perspective, proportions and pixel positions from the input. Output a genuinely TRANSPARENT RGBA background. Preserve ONLY the right-hand lighthouse with its small attached cottage, the complete brass telescope with tripod (negative spaces between tripod legs transparent), and the close lower-right rocks with coiled mooring rope and bollard. No deck, fences, scenery or left tree. Everything else MUST be fully transparent. Preserve the painted subjects exactly, do not redraw, resize or move them. Clean natural silhouette edges, transparent gaps, no rectangular patches of scenery, no white outline, no cast shadows outside the subjects. No background texture and no new objects. This transparent image will overlay the original at exactly the same coordinates.

## automation

### 全景母图提示词（实际使用）

Create a NEW full-bleed 16:9 LANDSCAPE panoramic gouache and graphite illustration for an interactive portfolio. The supplied campus image is STYLE reference only, replace its subject completely. A tranquil daylight automation workshop with a long workbench spanning the entire panorama, wide industrial windows, sketched tool shelves and leafy courtyard outside. Main separate objects: a substantial vintage sage-green typewriter at x52–77% y51–82%, a large metal spooled paper-tape machine at x80–95% y37–76%, and folded continuous paper ribbon crossing the lower foreground x42–100% y80–99%. Paper has abstract small dots, NO text. Limited blue-green, ivory and charcoal. Natural coherent perspective, no surreal floating objects. The entire image is a continuous environment, drawn edge to edge, with objects integrated into correct perspective. Objects are distinct silhouettes, sufficiently separated for cutting out along their natural edges and independent parallax animation. Main objects should be large, substantial, tactile and hand-painted. Background is mostly airy graphite and restrained light wash on warm ivory #f1eadc paper. Fine-art travel sketchbook with dry pigment, subtle paper grain, realistic elegant objects, quiet atmospheric depth. Continue the environment behind the LEFT region as well: no empty half, no gradient to blank paper, no split composition. No horizontal torn strips, no rectangle collage panels, no artificial white sticker borders, no UI or typography, no digits or watermark. This is a single finished panoramic artwork, not a contact sheet.

### 透明物体编辑提示词（实际使用）

Precise subject extraction for a layered parallax website. Keep the EXACT 16:9 canvas size, perspective, proportions and pixel positions from the input. Output a genuinely TRANSPARENT RGBA background. Preserve ONLY the large green typewriter with its paper sheet, the large spooled-paper machine at right, and the curling punched paper ribbon across the lower foreground. No workbench, wall, plants or scenery. Everything else MUST be fully transparent. Preserve the painted subjects exactly, do not redraw, resize or move them. Clean natural silhouette edges, transparent gaps, no rectangular patches of scenery, no white outline, no cast shadows outside the subjects. No background texture and no new objects. This transparent image will overlay the original at exactly the same coordinates.

## creative

### 全景母图提示词（实际使用）

Create a NEW full-bleed 16:9 LANDSCAPE panoramic gouache and graphite illustration for an interactive portfolio. The supplied campus image is STYLE reference only, replace its subject completely. An airy analog photography and editorial studio. Wide industrial windows and sketchy shelves span the whole panorama, a long worktable runs across foreground. Main separate objects: a large vintage cinema camera on tripod x55–75% y28–84%, an anglepoise studio light x80–94% y21–70%, and a loose fan of photographic prints with curled film reel across lower right x48–100% y78–99%. Limited rust red, dark slate, cream, subdued brass. The prints show small abstract architectural photographs, NO labels. The entire image is a continuous environment, drawn edge to edge, with objects integrated into correct perspective. Objects are distinct silhouettes, sufficiently separated for cutting out along their natural edges and independent parallax animation. Main objects should be large, substantial, tactile and hand-painted. Background is mostly airy graphite and restrained light wash on warm ivory #f1eadc paper. Fine-art travel sketchbook with dry pigment, subtle paper grain, realistic elegant objects, quiet atmospheric depth. Continue the environment behind the LEFT region as well: no empty half, no gradient to blank paper, no split composition. No horizontal torn strips, no rectangle collage panels, no artificial white sticker borders, no UI or typography, no digits or watermark. This is a single finished panoramic artwork, not a contact sheet.

### 透明物体编辑提示词（实际使用）

Precise subject extraction for a layered parallax website. Keep the EXACT 16:9 canvas size, perspective, proportions and pixel positions from the input. Output a genuinely TRANSPARENT RGBA background. Preserve ONLY the large cinema camera with tripod in the centre-right (transparent negative spaces between legs), the large articulated spotlight at far right, and the foreground photographic prints with the winding film strip and large film reel. No tables, room, shelves, chairs or scenery. Everything else MUST be fully transparent. Preserve the painted subjects exactly, do not redraw, resize or move them. Clean natural silhouette edges, transparent gaps, no rectangular patches of scenery, no white outline, no cast shadows outside the subjects. No background texture and no new objects. This transparent image will overlay the original at exactly the same coordinates.

## product

### 全景母图提示词（实际使用）

Create a NEW full-bleed 16:9 LANDSCAPE panoramic gouache and graphite illustration for an interactive portfolio. The supplied campus image is STYLE reference only, replace its subject completely. A light-filled sound and product design studio, panoramic desk, floor-to-ceiling sketched windows and acoustic panels running across the whole scene. Main separate objects: a substantial vintage condenser microphone on stand x58–71% y28–80%, a reel-to-reel tape recorder x77–97% y39–82%, and a modular mixing console across lower foreground x47–100% y79–100%. Limited ultramarine and ivory, graphite details, physical switches and knobs. No lettering, no screens with readable text. The entire image is a continuous environment, drawn edge to edge, with objects integrated into correct perspective. Objects are distinct silhouettes, sufficiently separated for cutting out along their natural edges and independent parallax animation. Main objects should be large, substantial, tactile and hand-painted. Background is mostly airy graphite and restrained light wash on warm ivory #f1eadc paper. Fine-art travel sketchbook with dry pigment, subtle paper grain, realistic elegant objects, quiet atmospheric depth. Continue the environment behind the LEFT region as well: no empty half, no gradient to blank paper, no split composition. No horizontal torn strips, no rectangle collage panels, no artificial white sticker borders, no UI or typography, no digits or watermark. This is a single finished panoramic artwork, not a contact sheet.

### 透明物体编辑提示词（实际使用）

Precise subject extraction for a layered parallax website. Keep the EXACT 16:9 canvas size, perspective, proportions and pixel positions from the input. Output a genuinely TRANSPARENT RGBA background. Preserve ONLY the central large microphone with its shock mount and stand, the large reel-to-reel recorder at right, and the mixing console across the very bottom of the image. No walls, tables, plants, chairs or scenery. Everything else MUST be fully transparent. Preserve the painted subjects exactly, do not redraw, resize or move them. Clean natural silhouette edges, transparent gaps, no rectangular patches of scenery, no white outline, no cast shadows outside the subjects. No background texture and no new objects. This transparent image will overlay the original at exactly the same coordinates.

## venture

### 全景母图提示词（实际使用）

Create a NEW full-bleed 16:9 LANDSCAPE panoramic gouache and graphite illustration for an interactive portfolio. The supplied campus image is STYLE reference only, replace its subject completely. A quiet mountaintop astronomical observatory and garden terrace overlooking a vast blue-green coastal valley, one continuous panoramic landscape. Main separate objects: a cream observatory pavilion with sage copper dome x76–96% y25–72%, an astronomical telescope on tripod x52–74% y42–86%, and foreground garden plants and terrace parapet extending across bottom right x40–100% y79–100%. Limited deep forest green, ivory, graphite. Long horizon and mountains must continue to the left edge. No spacecraft, no logos, no text. The entire image is a continuous environment, drawn edge to edge, with objects integrated into correct perspective. Objects are distinct silhouettes, sufficiently separated for cutting out along their natural edges and independent parallax animation. Main objects should be large, substantial, tactile and hand-painted. Background is mostly airy graphite and restrained light wash on warm ivory #f1eadc paper. Fine-art travel sketchbook with dry pigment, subtle paper grain, realistic elegant objects, quiet atmospheric depth. Continue the environment behind the LEFT region as well: no empty half, no gradient to blank paper, no split composition. No horizontal torn strips, no rectangle collage panels, no artificial white sticker borders, no UI or typography, no digits or watermark. This is a single finished panoramic artwork, not a contact sheet.

### 透明物体编辑提示词（实际使用）

Precise subject extraction for a layered parallax website. Keep the EXACT 16:9 canvas size, perspective, proportions and pixel positions from the input. Output a genuinely TRANSPARENT RGBA background. Preserve ONLY the large right-hand observatory building with dome, the central telescope with tripod (transparent negative spaces between legs), and the low foreground parapet with garden flowers across the bottom edge. No sky, mountain landscape, sea or background cypresses. Everything else MUST be fully transparent. Preserve the painted subjects exactly, do not redraw, resize or move them. Clean natural silhouette edges, transparent gaps, no rectangular patches of scenery, no white outline, no cast shadows outside the subjects. No background texture and no new objects. This transparent image will overlay the original at exactly the same coordinates.

## 其他六幕的线稿编辑原则

以对应母图为编辑参考，保留画布、相机、物体位置和透视，将颜色转为奶油纸面上的细石墨轮廓与少量排线；所有主体仍保留对应线稿，用于飞入前的定位。不得改变构图、添加文字或将整幅画转换成灰度照片。

## 动画与坐标

每张透明图中有三组独立主体。`src/lib/career/artwork.ts` 的多边形只用于选出透明图中的主体；真实边界来自透明通道。线稿补集、局部线稿和主体使用相同坐标。原始旧版提示词留在 `career-zine-prompts.md` 作为历史记录，不再用于运行时。
