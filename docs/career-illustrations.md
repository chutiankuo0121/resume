# 经历页配图：校园与六组 SVG

## 已接入：厦门理工学院

- 素材：`public/career-scenes/xmut-sanjian-digital.webp`。
- 图片是以真实校园照片为参考的银蓝色数字建筑风格化作品，不是现场实拍。
- 原图：厦门理工学院官网「理工映像」的三鉴湖照片。
- 来源页：https://www.xmut.edu.cn/xxgk/lgyx.htm
- 原图链接：https://www.xmut.edu.cn/__local/3/8C/DA/2DEF9AE5326F4C9FE67C3F8FCDD_866F8E6F_1BFC8.jpg
- 检索日期：2026-09-26。官网没有标明拍摄日期，不能断言为 2025 或 2026 年新拍。核对过学校 2026 招生页，其中的横幅为插画，未当作实拍照片使用。
- 生成方式：gpt-image-2 技能的 Host-Native 模式，调用内置 image_gen 图像工具。
- 生成后只转码 WebP，没有使用脚本修改图像内容。
- 桌面放在正文右侧并吸顶；窄屏回到正常文档流，位于学校标题与正文之间。采用自然图片比例，不裁掉校园主体，不添加卡片外框。
- 背景继续交叉淡化；学校保留真实校园风格化配图，其余六段经历采用原生 SVG。

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

## 已接入：六组 SVG（2026-09-26）

| 经历 | 画面 | 重点 |
| --- | --- | --- |
| 瑞晟投资 | 净值研究曲线、立体持仓柱、风险轮廓 | 投研分析 |
| 格林大华期货 | K 线与成交量、信号标记、下方验证曲线 | 行情 → 信号 → 验证 |
| 飞瑞来健康 | 多来源表格、三层处理核心、统一报表 | 采集 → 清洗 / 校验 → 报表 |
| 蓝咖生物 | 任务编排、生成核心、图文和视频输出、时钟 | 批量生成与定时分发 |
| 数版卫士 | 可编辑原型、工作流节点、任务队列、语音波形 | 产品设计与自动化落地 |
| AI 金融创业 | 组合环、策略曲线、执行核心、风险盾牌 | 组合研究、执行与监控 |

- 主体为银蓝金属渐变与石墨线条，少量暖金标记；图形透明融入现有场景，没有外框或文字卡片。
- 只保留图内的功能标签；没有重新加入校园图的说明或来源小字。
- 金融图形是流程示意，没有行情数值、收益百分比或实际业绩的暗示；各 SVG 的无障碍说明明确这一点。
- 所有原有正文、项目链接与单一日期栏保持完整。

### 布局与动效

- ≥ 1200px：图形沿正文右侧吸顶，跟随实际章节长度离场。
- < 1200px：图形在标题与正文之间正常排布，不叠在文字或日期上。
- GSAP 在图形进入视口时依次展开组件和曲线；手机上的入场在短距离内完成，不要求读者滚过整章才能看见完整配图。
- 自动化线路的短光点沿 SVG 路径移动，语音波形轻缓变化；只有可见章节运行动效，隐藏浏览器标签页时暂停。
- 系统开启减少动态效果时显示完整静态 SVG；不运行入场、流动或呼吸动画。
- 复用经历页的 GSAP matchMedia 生命周期，销毁时撤销全部补间 / ScrollTrigger，并移除 visibilitychange 监听。
- 不新增 Canvas、WebGL、动画依赖或网络素材。

### 实现位置

- `src/components/CareerDiagram.tsx`：六组矢量画面及独立 SVG 定义命名空间。
- `src/content/experience.ts`：章节与配图的对应关系。
- `src/lib/createCareerDiagramMotion.ts`：入场及可见性控制。
- `src/app/timeline.css`：右侧吸顶与窄屏排版。

## 参考

- 图片视差的 DOM 与 WebGL 两种实现：https://tympanus.net/codrops/2026/02/19/creating-a-smooth-horizontal-parallax-gallery-from-dom-to-webgl/
- 图片弯折、3D、GSAP 与 SVG 的混合实践：https://tympanus.net/codrops/2025/11/27/letting-the-creative-process-shape-a-webgl-portfolio/
- SVG 形态动画：https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/
