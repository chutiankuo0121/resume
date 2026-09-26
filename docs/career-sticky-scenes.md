# 经历页：固定场景与完整正文

## 阅读与换章

- 一个全屏 sticky 背景舞台，七段正文保留自然高度，文字直接排在页面上。
- 一段经历的正文阅读完毕后，背景原地交叉淡化：旧场景渐隐，下一场景渐显，不移动或缩放画面。
- 正文底部预留 42svh（手机 38svh）；下章顶部进入视口 72% 至 12% 的区间驱动背景交接。
- 淡化采用 sine.inOut 缓动；下一层透明度从 0 到 1，底层保持不透明，避免中间露出白底；反向滚动原路淡回。
- 共用一个日期文本节点，切章时替换；阅读中不使用 snap，不创建嵌套滚动区。
- 移动端保留正文滚动，增加连续浅色背景遮罩；减少动态效果时切换静态背景。
- 入口破洞采样新背景，退出到探索时同时保持背景、末章正文和日期。

## 参考

- GSAP pinned content: https://codepen.io/GreenSock/pen/YzyqVNe
- Codrops sticky sections: https://tympanus.net/Development/StickySections/
- 本项目没有复制参考图片或代码，采用相同的滚动阅读结构。

## 素材

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
