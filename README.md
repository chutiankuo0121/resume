# ASTRA · 星寂

版本 1.0.0。Next.js / React / Three.js / GSAP / Lenis 交互简历。主线为黑洞加载、粒子晶石、工作经历、探索目录、联系方式；探索目录可进入作品墙与技能画廊。

当前 Git 仓库只收录代码、内容数据、构建配置和许可证，不包含图片、视频、音频、字体、三维模型及游戏二进制资源。本机素材仍在原路径；新克隆项目后，需要从单独保管的素材副本补回对应文件，才能完整展示页面和运行游戏。资源路径保持不变，不能直接将纯代码仓库当作完整发布包。

## 运行

```sh
npm ci
npm run dev
```

访问 http://127.0.0.1:3000 。发布前执行 `npm run typecheck`、`npm run build`，再以 `npm start` 启动。三维场景需要 WebGL 2；小游戏点击后独立加载。

## 内容与结构

| 路径 | 用途 |
| --- | --- |
| `src/content/profile.ts` | 姓名、简介与联系方式 |
| `src/content/opening.ts` | 黑洞与晶石的大字文案 |
| `src/content/experience.ts` | 工作经历、配图与项目关联 |
| `src/content/works/<id>/index.ts` | 每件作品的内容、媒体与来源 |
| `src/content/works/index.ts` | 作品注册表 |
| `src/content/skills.ts` | 技能与关联作品 |
| `src/components` | 页面、章节导航和媒体播放器 |
| `src/lib` | 场景、相机、布局、交互与 Shader |
| `src/lib/loading/config.ts` | 小黑洞加载尺寸、计数器与揭幕节奏 |
| `src/app` | 页面入口、字体与分章节样式 |
| `public` | 运行所需的模型、字体、图片、音视频和游戏 |
| `games` | 小车漫游、Ooqo 的源码及构建工具 |
| `scripts/build-fonts.py` | 中文字体子集构建 |

新增作品按唯一 ID 建目录并注册；媒体放入 `public/portfolio/<id>/`，填写真实宽高及来源。图片用 WebP，视频和音频用 WebM。网格按比例自动分格并按 ID 稳定混排；三个游戏优先靠近中心。每件作品的媒体详情按需加载。

标题字体为京华老宋与 Cinzel，正文字体为朱雀仿宋与 Cormorant Garamond。新增中文文案后执行 `python scripts/build-fonts.py`（需要 `fonttools`、`brotli`），更新本地 WOFF2 子集。

## 独立游戏

三个游戏通过同源 iframe 加载，暂停与退出由 `src/components/works/GamePlayer.tsx` 管理。运行不需要联网对战服务，存档只保存在当前浏览器。

- 涂鸦街区：直接编辑 `public/games/doodleshooter/src/`，无需独立构建。
- 小车漫游：编辑 `games/bruno/sources/`，运行 `npm ci --prefix games/bruno`、`npm run build --prefix games/bruno`。`assets.json` 固定素材提交与摘要；`prepare-world.mjs` 生成当前场景。输出位于 `public/games/bruno/`。
- Ooqo：编辑 `games/ooqo/project/`，执行 `python games/ooqo/build.py --godot "C:/path/to/Godot_v4.5.1-stable_win64_console.exe"`，需要 Godot 4.5.1 与 Python `fonttools`。输出位于 `public/games/ooqo/`。

游戏构建下载的原素材只写入系统临时缓存。主站构建不会生成游戏资源；首次克隆需补回游戏运行包，以及独立构建所需的本地字体、贴图等素材。游戏入口 HTML、字体许可和依赖版权声明保留在仓库中。

第三方来源、修改范围与完整许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 及资源目录内的许可文件。依赖、构建产物、环境凭据和下载审片目录不进入 Git。
