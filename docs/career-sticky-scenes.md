# 经历页：固定场景与完整正文

## 阅读与换章

- 一个全屏 sticky 背景舞台，七段正文保留自然高度，文字直接排在页面上。
- 七段经历共用一个深色粒子空间；滚动驱动纵深推进，停下后保留缓慢聚散，具体实现见 `career-flight-background.md`。
- 正文底部预留 42svh（手机 38svh），背景连续穿过章节，不再逐章加载和叠化图片。
- 标题、正文、日期采用亮白色；正文与图内标签入场保留位移，取消压低透明度，滚动停住时保持清晰。
- 时间轴恢复首版 `9934bb2` 的左侧竖排大日期、贯穿刻度和正文圆点；移除右上日期 / 经历类型与右下进度栏。
- 桌面共用一个日期文本节点，切章时替换，避免多段旋转日期重叠；日期动效作用于外层容器，保留内层的旋转排版。
- 手机按首版把日期放在各段经历开头，随正文滚动；目录下方留出间距，没有覆盖正文的固定日期条。
- 阅读中不使用 snap，不创建嵌套滚动区；现有校园 / SVG 配图保持完整。
- 移动端保留正文滚动，增加与当前主题一致的连续背景遮罩；减少动态效果时切换静态背景。
- 入口破洞显露深色背景与文字，退出到探索时同时保持背景、末章正文和日期。

## 经历到作品 / 技能的衔接修复（2026-09-26）

- 背景舞台与时间轴使用负下边距实现 sticky 叠层，不能再按滚动距离整体下移。过渡时将这两个原始图层固定在视口，保持屏幕坐标不变；结束或反向退出时恢复 sticky。
- 冻结末章时移动 `.career-layout`，保持配图原有的绝对定位容器。之前对 `.career-copy` 加 transform，会将它变成新的定位容器，使桌面配图宽度从 572.25px 变为 0。
- 过渡底幕与间隔底色从经历页读取，不再使用旧主题的白色。
- 探索页常态保留与经历页同级的 stacking context，以文档顺序覆盖前一幕。否则移除临时过渡图层时，经历的 sticky 溢出画面会重新盖住探索页。
- 浏览器实测视口 1625×884：正向按 40px 步长采集 26 帧；过渡中舞台 / 时间轴 top 恒为 0，末章配图宽 572.25px、top 30.296875px 恒定。反向检查 27 个位置，其中 25 个位于过渡内，位置与宽度均稳定。终点截图确认作品与技能完整显示。

## 参考

- GSAP pinned content: https://codepen.io/GreenSock/pen/YzyqVNe
- Codrops sticky sections: https://tympanus.net/Development/StickySections/
- 本项目没有复制参考图片或代码，采用相同的滚动阅读结构。

## 素材

当前使用序章晶石同款粒子，详见 `career-flight-background.md`。下面三张银色背景是之前版本的素材记录，当前经历页不再加载。

使用内置 image_gen 生成三张概念环境图，统一银灰材质和柔和光照。全部为概念配图，不代表真实校园或工作场所。同主题章节通过不同取景比例与画面位置区分。

仅将 PNG 转码为 WebP，没有修改画面内容。三个文件随仓库保存，首次预览不依赖外部图片服务。

### academy

路径：`public/career-scenes/academy.webp`

最终提示词：

```text
Use case: stylized-concept. Create one production 16:9 landscape background asset for a sophisticated digital-art personal portfolio career chapter about university education and financial engineering. NOT a web mockup, no text or interface. Photoreal cinematic conceptual architecture: an immense ivory concrete academic atrium with razor-thin repeating vertical fins and one graceful sweeping staircase, tiny silver mathematical wire structures in distance, pale morning light with long sharply defined architectural shadows. The architecture occupies the right 55% and recedes into the far horizon, beautifully composed with tangible scale and realism, like a contemporary architecture magazine photograph meeting refined digital art. Leftmost 45% is very quiet pale ivory atmospheric open space with only extremely faint depth, reserved for black Chinese text. Full bleed environment, no framed object, no card, no collage. Restrained chalk white, silver grey, whisper of cool blue. Crisp edges, rich material microtexture on right, soft ambient illumination. Wide 16:9 composition. No people, no lettering, no logos, no numbers, no paper, no crystals, no mineral branches, no black hole. Not intended to depict any real named university.
```

### markets

路径：`public/career-scenes/markets.webp`

最终提示词：

```text
Use case: stylized-concept. Create one production 16:9 full-bleed cinematic digital-art background for a sophisticated personal portfolio career chapter about financial research and quantitative markets. NOT a web mockup, no UI/text. A vast silver liquid landscape subtly becoming ordered ridges and translucent rippling data-wave surfaces on the right half, frozen like a high-end Houdini scientific sculpture but occupying an entire environment, finely layered glass wavefronts, elegant horizon and enormous depth. Camera low and panoramic. Leftmost 45% must be very quiet pale silver/ivory mist fading naturally into the environment with minimal contrast, usable behind black Chinese paragraphs. Right side highly crafted detail with titanium grey, cold pewter and delicate ice blue refractions; warm-neutral left. Photoreal physically based materials, cinematic directional lighting, beautiful restrained tones. No isolated torus, no generic sci-fi rings, no mineral branches, no recognizable chart with fake values, no cards, no words, no glyphs, no buildings, no people, no neon. Wide 16:9.
```

### computation

路径：`public/career-scenes/computation.webp`

最终提示词：

```text
Use case: stylized-concept. Create one production 16:9 wide digital-art background for a sophisticated portfolio about automation, creative AI and AI software engineering. NOT a UI mockup. A monumental spatial tapestry of hundreds of hair-thin silver optical filaments, flowing from an orderly horizontal lattice in the distance into a graceful folded ribbon on the right, softly translucent layered surfaces with microscopic precision. It should resemble cutting-edge computational design photographed in a vast white studio environment, tangible complex textile geometry, rich sculptural depth and scale. Composition concentrates the sculptural forms between x=60% and x=100%, extending beyond frame, lower right foreground closer, distant lattice high right. Leftmost 45% is quiet ivory/pearl white negative space fading into the environment for black Chinese text. Unified chalk white, titanium silver, subtle pale blue/celadon highlights. Full bleed panoramic environment not a floating little object. Exquisite realistic material, soft cinematic directional light and contact shadows. No text, no logos, no people, no cards, no page framing, no paper collage, no generic torus, no purple neon, no crystal. 16:9 landscape.
```
