# 算法来源与许可

## Doodle District 游戏

`public/games/doodleshooter` 来自 **iifor** 的 https://github.com/iifor/doodleshooter ，固定提交 `8d8fad9ebeff2564881f427f4365336db98941b7`。本站整理为单人版并添加加载、暂停、退出与资源释放的适配，删除多人对战与其依赖；不把原作列为本站原创开发。

该提交未附游戏本身的 LICENSE。随附 Three.js r170 为 MIT 许可，完整依赖许可位于 `vendor/three/LICENSE`，不延伸至游戏本体。单人游戏源码直接保存在上述目录，启动和构建方法见根目录 README。

## Ooqo 游戏

`games/ooqo/project` 的游戏源码与 `public/games/ooqo/runtime` 的 Web 引擎来自 **aznoqmous** 的 https://github.com/aznoqmous/fish-storm ，固定提交 `a8300c94aa891da93f950a568d10c0ed06d6ee5f`。音乐与音效由 **Jérémie Frémont** 制作。本站添加中文界面、独立启动、暂停、退出和作品卡片适配，删除排行榜、成绩上传、昵称及网络请求模块，并重新构建游戏资源包；原作入口为 https://aznoqmous.itch.io/ooqo 。

标题页底部署名节点和作品详情来源行已移除，原作与音乐来源保留于说明文件。该提交未附游戏本体 LICENSE。Godot 4.5.1 引擎为 MIT 许可，见 `public/games/ooqo/runtime/LICENSE-Godot.txt`；引擎许可不覆盖游戏本身的代码、美术或音乐。源码位于 `games/ooqo/project`，构建方法见根目录 README。

中文字体由 [霞鹜文楷](https://github.com/lxgw/LxgwWenKai) 提取字形并重命名为 `Ooqo Han`，英文与数字使用原作 Gaegu。两者均为 SIL OFL 1.1，完整声明分别在 `public/games/ooqo/runtime/LICENSE-WenKai.txt` 和 `LICENSE-Gaegu.txt`。

Ooqo 使用本站绘制的鱼形页签图标，并关闭默认引擎启动图。构建时清理音频中的描述性署名标签，保留采样、格式及循环信息；音乐作者的来源说明保留如上。

## 小车漫游（基于 Bruno 的驾驶世界）

`games/bruno/sources` 与 `public/games/bruno` 来源于 **Bruno Simon** 的 https://github.com/brunosimon/folio-2025 ，固定提交 `41046b57eeed8d156d9c3fd7fa259900baef7816`。原作代码及场景使用 MIT 许可，完整声明位于 `games/bruno/LICENSE` 和运行包的 `LICENSE.txt`。音乐由 **Kounine** 创作，原作说明采用 CC0。

本站添加中文界面、同源 iframe 生命周期适配与本机存档，移除 WebSocket、在线留言、全球排行榜、共享事件通信、统计代码和远程字体。界面移除作者介绍、课程推广、社交入口、旧网站跳转和制作名单；作品详情只展示玩法。出处与许可集中保留在文档和随包许可证中。

构建时实际删除立体姓名、雕像、社交标志、经历展板、项目及实验画册及其碰撞，复用原有长椅、树木、灯具和砖块调整场景；保留炉火、铁砧、齿轮、摆锤和光影平台。旧电视改为程序生成的星空与波纹，地图底图与封面重拍；旧截图与经历纹理不进入发布包。素材清单按 Git blob 摘要校验，7 份原始模型仅进入外部构建缓存，发布包只含清理后的模型；未收录 Blender 源工程或重复的无损音乐文件。

字体使用 Nunito、Amatic SC、Pally，以及由霞鹜文楷提取并重命名的 `Bruno Han`。字体和打包依赖的完整许可随运行包保存在 `public/games/bruno/licenses/`。封面来自本站运行画面的截图。源码与构建工具位于 `games/bruno`，构建方法见根目录 README。

赛道品牌标牌、地毯徽章和饼干旗帜已替换为本站绘制的几何纹样与饼干图案；模型内嵌地图和菜单预览使用修改后的实机截图，页签使用自制小车图标。构建时删除对应原贴图及截图资源。

## 晶石资产

`public/crystal` 中运行所需的模型、明暗图和点数据由本项目制作。

## Elimar 视觉与运镜来源

黑洞雾场、三档粒子运动、紧实圆核和加法／乘法合成参考以下公开客户端模块，并针对本项目的世界尺度、明暗与渲染流程适配：

- https://elimar.lmigroupintl.com/_next/static/chunks/626-ceb99aec2f508f01.js
- https://elimar.lmigroupintl.com/_next/static/chunks/7629-d915cdd02abbf62a.js
- https://elimar.lmigroupintl.com/_next/static/chunks/4003-5ddae2032c10af0b.js

退出运镜参考首页嵌入的 Theatre 数据 `Section - Vincent / 3D / Custom Camera` 和 `Section Config.opacity`；相机位移按晶石场景尺度转换，保留关键帧的相对时间与缓动。章节滚动、淡出和混合关系参考：

- https://elimar.lmigroupintl.com/ （首页内嵌 `theatreState`）
- https://elimar.lmigroupintl.com/_next/static/chunks/3504-d56fd8ee69eefe0e.js
- https://elimar.lmigroupintl.com/_next/static/css/561c953285a0fcdb.css

关键帧与适配代码位于 `src/lib/elimarExit.ts`。

履历时间轴的竖排年份、渐隐刻度线、粘性排版及图文分层时序参考原站 `TimelineSection`、`TimelinePeriod`、`TimelineEvent` 组件与 `Section - Timeline Early Life` 的 Theatre 数据。布局已适配本项目的固定字体尺寸与实际履历，动画用 GSAP 实现：

- https://elimar.lmigroupintl.com/_next/static/chunks/5960-5d0519862be51a11.js
- https://elimar.lmigroupintl.com/_next/static/css/561c953285a0fcdb.css

`public/timeline` 的图像由 `gpt-image-2` 为本项目生成。项目未使用原站的画作、人物照片、建筑背景或字体文件。

章节轴的 41px 布局、旋转、展开和进度遮罩样式参考以下原站 CSS，已改为本项目的类名、黑白色值与章节；字体使用本站统一搭配：

- https://elimar.lmigroupintl.com/_next/static/css/5b0b21ab1bb7bd97.css

竖排 Scroll 提示的裁切、双份文字循环与细线结构参考下面的 CSS；字号与几何改为固定 CSS 像素，字体使用本站正文搭配，未使用原站字体资产：

- https://elimar.lmigroupintl.com/_next/static/css/cdfa77faa4ace30e.css

所查模块未附开源授权；此处是来源说明，不构成授权授予。项目不包含原站模型、明暗图或点云资产，圆核由解析公式生成。

## Simplex 噪声

`src/lib/shaders/noise.ts` 的 GLSL 噪声核来自 https://github.com/ashima/webgl-noise ，遵循以下 MIT 许可：

Copyright (C) 2011 by Ashima Arts (Simplex noise)
Copyright (C) 2011-2016 by Stefan Gustavson (Classic noise and others)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

## 作品墙交互参考

拖动探索、拖动时拉远、点选后聚焦的交互思路参考 SBS / The Feed 的 Story Line：

- https://www.sbs.com.au/storyline/
- https://www.sbs.com.au/storyline/static/js/3.812bbf4f.chunk.js

对照原站透视相机的距离、弹簧参数、指针幅度和 Brown–Conrady 径向畸变参数进行独立的 Three.js 实现；没有使用原站的照片、音频或字体。音频入口参考原站的横向文字流和多层点状频谱，使用本站独立编写的 Shader 与 Canvas 播放器。布局与交互实现位于 `src/lib/portfolio/`。
ASTRA 封面来自本站实机截图，旧简历迁入的项目、作品图片及对应媒体已移除。

## 即梦图片与影片收录

用户选定将本地下载的 60 张即梦公开作品加入作品墙，覆盖影视视觉设定、海报设计、品牌设计、电商产品图与动画视觉设定。每张图片的作者和原始作品链接保存在独立记录的 `source` 中，并在详情展示；不将收录图片标为本站原创或技能证明。本站仅进行等比缩放与 WebP 转码，未清除图片内容中的署名或水印。

同批视频由用户审看并删除不需要的文件后，实际保留的 59 条影片已加入作品墙。发布时转为 VP9 + Opus WebM，长边最多 1280px、帧率最多 30fps，保留完整画面内容与声音；原作者和链接同样在详情展示。未对这批影片进行水印清除或片段裁剪。

运行素材位于 `public/portfolio/jimeng-<作品ID>/`，原始素材与采集记录另行归档在仓库外。平台公开展示不等于授予开放许可，未推断素材的生成模型或创作年份。

## 入选短片

用户从 OiiOii 公开推荐页（https://www.oiioii.tv/oii-tv）选定的 27 条短片作为收录内容。每部影片的原作者及分享页保存在独立作品记录的 `source` 中，并在详情中显示；不将原作标为本站原创。本站进行了片尾整理、局部修补、WebM 转码及封面提取。公开可访问不等于开放许可，本地原片、来源及审片记录另行归档在仓库外。

`public/portfolio/paper-grain.webp` 是原站背景纹理 `map.a963840f.png` 的无损格式转换：

- 来源：https://www.sbs.com.au/storyline/static/media/map.a963840f.png
- 用途：按用户指定的参考效果复现作品场背景。
- 原站资源未附独立开源许可声明；该纹理不属于本站原创素材。

## 技能画廊来源

立体图像屏幕与环形浏览的思路参考 Rogier de Boevé 的公开解析：

- https://rogierdeboeve.com/
- https://tympanus.net/codrops/2024/07/26/case-study-rogier-de-boeve-portfolio-2024/

`src/lib/skills` 根据参考站公开演示、解析和浏览器 bundle 研究实现：共享实例几何、局部图像投影、分层透明、平面反射、雾场与循环画廊。`environmentShaders.ts` 的天空噪声按公开 shader 的六层 FBM、嵌套扭曲与混合公式改写为本项目黑白效果；水面反射使用 Three.js 的 MIT 授权 `Reflector`，波纹法线由程序生成。未使用原站的纹理、字体、音效或人物模型。作者网站未声明完整源码开源。

技能区保留以 Cloudflare、Python、Figma 标识为题材的 gpt-image-2 图像；ComfyUI、n8n 与语音插画迁移自用户旧简历，转为黑白并柔化边缘。商标属于各自权利人，用于能力展示，不表示品牌合作或认证。运行图片保存在 `public/skills`。

## 简历中英文字体

标题使用京华老宋 v2.002（王廷瑞 / TerryWang）与 Cinzel；正文使用朱雀仿宋 v0.212 与 Cormorant Garamond，全部固定为 Regular。`scripts/build-fonts.py` 生成 WOFF2 网页子集并保留版权元数据；网页族名加 `Astra` 前缀，与源字体区分。

- 京华老宋源文件来自 [中文网字字体存储库](https://github.com/KonghaYao/chinese-free-web-font-storage/tree/branch/packages/jhlst/fonts)，原始版权与文件校验信息保存在 `public/fonts/NOTICE-KingHwa.txt`；不把分发工具的 MIT 许可套用于字体。
- [朱雀仿宋](https://github.com/TrionesType/zhuque/releases/tag/v0.212)、[Cinzel](https://github.com/google/fonts/tree/main/ofl/cinzel)、[Cormorant Garamond](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond) 使用 SIL OFL 1.1，完整声明分别保存在 `public/fonts/LICENSE-Zhuque.txt`、`LICENSE-Cinzel.txt`、`LICENSE-Cormorant.txt`。

开场的逐字清晰、分组聚合和文字离场参考 Elimar 的大字叙事方式，使用本站文案、字体和独立 GSAP 编排，不含参考站字体文件或人物素材。

## AI 音乐收录

按用户选定的 16 首公开音乐接入：10 首来自 [Suno 首页](https://suno.com/) 的精选试听，6 首来自 [MiniMax 英文](https://www.minimax.io/audio/) 与 [中文](https://www.minimaxi.com/audio/) 官方示例。中英文站相同音频按文件哈希去重，不重复收录。每首标题、作者与原作链接保存在 `src/content/works/suno-*/index.ts` 或 `minimax-*/index.ts`，并在详情展示。

音乐与封面版权归原权利人，作为策展内容展示，不标为本站原创。原音频完整转为 Opus / WebM，封面转为 WebP；未剪切歌曲或移除音频中的内容。公开可播放不代表开放授权。
