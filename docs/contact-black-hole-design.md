# 联系页定版：黑洞与双山视差

定版日期：2026-09-25。本文件描述当前实现；转场及点击区域规则见 [contact-transition.md](contact-transition.md)。

## 画面与图层

- 近黑色背景，奶白色内缘、暖灰色流动气体和斜向吸积盘，保留清楚的暗中心。
- 左侧固定联系邀请与微信按钮；弹窗显示二维码及带“邮箱：”标签的邮件链接。
- 两座独立的油画山体使用透明抠图。无整张风景底图，无飞船、联系页晶石或盘内粒子。
- 背景空间复用 `/crystal/particles.bin` 中的环境点，固定每五个取一个：原 12,000 点保留 **2,400 点（20%）**。亮度为银白色，保留原尺寸和自然漂移。
- 图层顺序：**背景白色粒子 → 黑洞及吸积盘 → 左山 → 右山 → 转场细节与 DOM 文案**。背景相机只随视口尺寸重新取景，不跟随黑洞或山体移动。
- 黑洞的暗中心、次级环内空隙和亮盘都遮挡背景点。背景点在辉光之后单独合成，避免混入黑洞盘面。

## 代码入口

| 文件 | 职责 |
| --- | --- |
| `src/components/Contact.tsx` | 文案、微信弹窗、静态备用画面、客户端场景生命周期 |
| `src/app/contact.css` | 响应式构图、无 WebGL 时的黑洞和双山、转场 DOM 遮罩 |
| `src/lib/contact/createContactScene.ts` | 渲染器、双山、滚动与鼠标视差、资源与事件释放 |
| `src/lib/contact/contactBlackHole.ts` | 黑洞离屏目标、双尺度辉光、背景粒子遮挡与最终合成 |
| `src/lib/contact/blackHoleShader.ts` | 光线弯曲、气体盘积分、中心捕获及遮挡率 |
| `src/lib/contact/backgroundParticles.ts` | 固定 20% 白色环境点与独立相机 |
| `src/lib/contact/createContactGhost.ts` | 当前联系画面和文字的交互细节 |
| `src/lib/contact/transitionField.ts` | 联系转场的共享边界与指针状态 |
| `src/lib/contact/departureDetails.ts` | 转场另一侧的作品／技能细节，仍由对应页面使用 |
| `src/lib/loading/previews.ts` | 预加载当前两张山体素材 |

开场继续使用自己的晶石模型、粒子内核和时间轴；联系页只共享粒子数据及加载缓存。

## 动画与合成参数

- 桌面联系章节为 `240svh`，移动端为 `210svh`；减少动态效果时为 `100svh`。
- 鼠标指数平滑率为 5；黑洞偏航约 ±3°，俯仰约 ±1.4°。滚动将相机距离从 22 缓慢推进至 20.6。
- 黑洞中心在桌面 `(76%, 37%)`、移动端 `(57%, 63%)`，按屏幕左上角计。
- 左／右山鼠标移动上限为 25／44 CSS 像素，同时受视口宽度 3.2% 限制。滚动缩放增量为 12%／22%，底边保持在视口外，贴图 UV 不变形。
- 联系转场未完成时使用章节初始构图；边界继续读取实时合成画面，细节严格留在所属一侧。
- 气体纹理用两个相位交叉过渡，避免循环接缝；无上一帧反馈缓冲。
- 光线最多积分 200 步，靠近气体盘时缩小步长；用积分厚度稳定细盘成像。这是艺术化光线弯曲近似。
- 黑洞目标 alpha 保存遮挡率，亮盘额外遮挡底层点；双尺度 HDR 辉光权重为 `.24`／`.45`。
- 桌面黑洞按 CSS 像素渲染，上限 165 万像素；移动端 DPR 最高 1.4，上限 65 万像素。最终画布 DPR 最高 1.5。

## 资源与降级

场景完成加载后显示 WebGL 画布。加载失败、WebGL 不可用或上下文丢失时，显示相同两张抠图与 CSS 黑洞。恢复上下文后重新绘制。

场景远离视口或文档隐藏时暂停时钟；减少动态效果时冻结气体、粒子和视差。卸载时释放纹理、几何体、材质、离屏目标、观察器、滚动动画及事件监听。异步加载结束时检查是否已卸载。

黑洞优先使用 HalfFloat 目标；不支持 `EXT_color_buffer_float` 时改用 UnsignedByte。章节间发光转场仍有自己的能力要求，详见转场文档。

## 素材与来源

当前 `public/contact-signal/` 只保留以下两个独立 alpha 图层：

| 素材 | 尺寸 | 大小 | 内容 |
| --- | --- | --- | --- |
| `lunar-left.webp` | 1672 × 941 | 70,174 字节 | 左下银灰／淡紫色油画山体 |
| `lunar-right.webp` | 1672 × 941 | 83,772 字节 | 右下深灰色油画山体 |

内置图像生成工具依据用户选中的构图分别生成图层，转为 WebP 时保留 alpha（quality 91、alpha quality 100）。静态备用画面也只使用这两张图。

- 外观参考：[MisterPrada High](https://blackhole.misterprada.com/)。盘面、纹理与合成为本项目实现，未复制其代码或纹理。
- 光线积分参考：[Dan Greenheck WebGPU Black Hole](https://github.com/dgreenheck/webgpu-black-hole)，核对版本 `cf2fca75a9e774449057cbebe2197129249d96b8`。保留 [MIT 许可](../public/licenses/black-hole.txt)。

## 验证

- 类型检查与生产构建：`npm run typecheck`、`npm run build`。
- 桌面和移动端检查画面、双山视差、文字可读性、微信弹窗、邮箱链接与水平溢出。
- 检查作品／技能到联系的半程转场，保持两侧画面和指针细节的所属范围。
- 检查减少动态效果、WebGL 上下文丢失及恢复。
- 2026-09-25 粒子专项验证：实际 POINTS 绘制索引为 2,400；同一时刻开关背景粒子，黑洞内部像素不变，背景可见粒子变化，山体保持前景遮挡。

## Generation prompts

### left

Use case: background-extraction. Asset type: transparent parallax foreground PNG for an implemented website. Input image is the approved composition reference. Extract ONLY the LEFT pale silver/lavender oil-painted mountain in the bottom-left corner as one independent cutout. Retain its precise palette, thick impasto brush marks and jagged rocky ridgeline. IMPORTANT: deliver a genuine transparent alpha background, not a checkerboard painted into pixels, not black. Use a wide 16:9 canvas with the mountain in exactly the same bottom-left placement and scale as the reference (confined to bottom 36% and left 43% of the full canvas). All other pixels must be transparent. Keep opaque rock extending to the left and bottom canvas edges. Remove ALL text, buttons, black hole, stars, space background, opposite mountain, spacecraft and ground plane. Exactly ONE mountain. Preserve original silhouette and lighting. No haze, no glow, no shadow outside cutout. This image is a compositing layer, not a complete scene.

### right

Use case: background-extraction. Asset type: transparent parallax foreground PNG for an implemented website. Input image is the approved composition reference. Extract ONLY the RIGHT darker slate-gray oil-painted mountain in the bottom-right corner as one independent cutout. Retain its precise palette, thick impasto brush marks and jagged rocky ridgeline. IMPORTANT: deliver a genuine transparent alpha background, not a checkerboard painted into pixels, not black. Use a wide 16:9 canvas with the mountain in exactly the same bottom-right placement and scale as the reference (confined to bottom 36% and right 36% of the full canvas). All other pixels must be transparent. Keep opaque rock extending to the right and bottom canvas edges. Remove ALL text, buttons, black hole, stars, space background, opposite mountain, spacecraft and ground plane. Exactly ONE mountain. Preserve original silhouette and lighting. No haze, no glow, no shadow outside cutout. This image is a compositing layer, not a complete scene.
