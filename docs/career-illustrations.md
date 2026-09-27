# 经历页配图：校园

## 已接入：厦门理工学院

- 素材：`public/career-scenes/xmut-sanjian-digital.webp`。
- 图片是以真实校园照片为参考的银蓝色数字建筑风格化作品，不是现场实拍。
- 原图：厦门理工学院官网「理工映像」的三鉴湖照片。
- 来源页：https://www.xmut.edu.cn/xxgk/lgyx.htm
- 原图链接：https://www.xmut.edu.cn/__local/3/8C/DA/2DEF9AE5326F4C9FE67C3F8FCDD_866F8E6F_1BFC8.jpg
- 检索日期：2026-09-26。官网没有标明拍摄日期，不能断言为 2025 或 2026 年新拍。核对过学校 2026 招生页，其中的横幅为插画，未当作实拍照片使用。
- 生成方式：gpt-image-2 技能的 Host-Native 模式，调用内置 image_gen 图像工具。
- 生成后只转码 WebP，没有使用脚本修改图像内容。
- 位于居中阅读栏的学校标题与正文之间，采用自然图片比例，不裁掉校园主体，不添加卡片外框。
- 背景为纯白；学校保留真实校园风格化配图，其余六段经历的 SVG 已移除，等待重新设计。

### 最终提示词

```text
Use case: style-transfer.
Edit the supplied real photograph of Xiamen University of Technology's Sanjian Lake into a noticeably stylized SILVER / ICE-BLUE DIGITAL ARCHITECTURAL PLATE for a high-end portfolio.

Preserve the exact real-world scene identity and composition: the curved white multi-storey academic tower just left of center, the horizontal right-hand building, the palms, the lake and reflections, one black swan in the near foreground, viewpoint and building proportions. Do not invent new campus architecture.

CHANGE THE ART DIRECTION STRONGLY: treat the scene as a refined three-dimensional digital reconstruction rendered in pearl ceramic, brushed silver and translucent pale-blue glass. Buildings remain detailed and recognizable but their materials feel like a beautiful physical architectural model. Trees become softly silver-grey sculptural foliage. The lake is a quiet silver-blue reflective surface; swan is dark graphite. Sky almost white with faint ice-blue mist. The whole palette is near-monochrome silver and ice blue: remove all saturated green, yellow, bright red and vivid cyan. Add a few very fine precise wireframe construction traces following the existing window grids and shoreline, integrated into surfaces rather than overlaid as UI. This must look like restrained digital architecture / computational art, not the original colorful photo, and not a watercolor or pencil sketch.
Lighting: soft directional studio daylight, precise realistic shadows, fine geometry, clean bright midtones.
Framing: wide landscape 16:10; maintain the full academic building, the water reflections and swan. Standalone full-bleed image, no blank half, no layout.
Avoid text, labels, logos, framing, cards, torn paper, collage, neon, floating particles, extra objects, extra swans, fantasy towers, exaggerated glow or blur.
```

## 工作经历配图待重画（2026-09-27）

六组旧 SVG 的绘图组件、GSAP 动画、章节配置和专用样式均已删除，正文恢复自然衔接，不保留空白配图容器。

## 参考

- 图片视差的 DOM 与 WebGL 两种实现：https://tympanus.net/codrops/2026/02/19/creating-a-smooth-horizontal-parallax-gallery-from-dom-to-webgl/
- 图片弯折、3D、GSAP 与 SVG 的混合实践：https://tympanus.net/codrops/2025/11/27/letting-the-creative-process-shape-a-webgl-portfolio/
- SVG 形态动画：https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/
