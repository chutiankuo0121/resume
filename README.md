# ASTRA · 星寂

版本 1.0.0。Next.js / React / Three.js / GSAP / Lenis 交互简历。主线为黑洞加载、粒子晶石、工作经历、探索目录、联系方式；探索目录可进入作品墙与技能画廊。

Git 只收录代码、内容数据、构建配置和许可证。图片、视频、音频、字体、模型及游戏二进制资源由 Cloudflare R2 的 `resume-assets` 桶提供，新克隆项目无需补回整套素材。

## 运行

使用 Node.js 22.18 或更新版本。

```sh
npm ci
npm run dev
```

访问 http://127.0.0.1:3000 。发布前执行 `npm run typecheck`、`npm run build`，再以 `npm start` 在本地预览 Workers 生产版本。三维场景需要 WebGL 2；小游戏点击后独立加载。

## Cloudflare Workers 部署

线上地址：[resume.806307287.workers.dev](https://resume.806307287.workers.dev/)。

主站通过 Next.js 静态导出生成 `out/`，Cloudflare 优先直接提供页面与代码；`worker/index.ts` 将缺失的游戏素材和字体转发至 R2，保留同源 iframe。图片已经使用 WebP，直接显示 R2 原图，不再依赖 Next.js 图片优化服务器。`out/`、`.wrangler/` 与媒体文件均不提交 Git。

手动发布：`npm run typecheck && npm run build && npm run deploy`。Worker 名称是 `resume`，配置集中在 `wrangler.jsonc`；Node 版本由 `.node-version` 固定。

要让推送自动发布，在 Cloudflare 的 `resume` → **Settings → Builds → Connect** 中连接以下配置：

| 设置 | 值 |
| --- | --- |
| GitHub 仓库 | `chutiankuo0121/resume` |
| 生产分支 | `main` |
| 根目录 | `/` |
| 构建命令 | `npm run typecheck && npm run build` |
| 部署命令 | `npm run deploy` |

Cloudflare 安装锁文件中的依赖，构建成功后才部署。其他分支不配置生产部署。首次绑定需要 Cloudflare 的 GitHub 应用有权访问本仓库；Wrangler 的普通 OAuth 登录只能发布 Worker，不能代替 Workers Builds 的仓库授权。连接后用一次正常代码推送验证：构建记录里的提交 SHA、成功部署的版本应与 GitHub `main` 一致。R2 素材独立于代码部署，不必随每次推送重复上传。

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
| `src/lib/assetUrl.ts` | R2 公开地址与统一素材 URL |
| `public` | 游戏入口、运行代码和资源许可 |
| `games` | 小车漫游、Ooqo 的源码及构建工具 |
| `scripts/build-fonts.py` | 中文字体子集构建 |

新增作品按唯一 ID 建目录并注册；媒体上传到 R2 的 `portfolio/<id>/`，内容记录仍填写 `/portfolio/<id>/文件名`、真实宽高及来源，注册表统一转换为 R2 地址。图片用 WebP，视频和音频用 WebM。网格按比例自动分格并按 ID 稳定混排；三个游戏优先靠近中心。每件作品的媒体详情按需加载。

标题字体为京华老宋与 Cinzel，正文字体为朱雀仿宋与 Cormorant Garamond。新增中文文案后执行 `python scripts/build-fonts.py`（需要 `fonttools`、`brotli`），将生成的 WOFF2 子集上传覆盖 R2 的 `fonts/` 对应对象。

## R2 素材

公开地址集中在 `src/lib/assetUrl.ts`，不需要在前端配置 Cloudflare 密钥。作品媒体直接从 R2 下载；字体与游戏素材在本地由 Next.js、线上由 Worker 保持原路径转发，游戏入口和脚本继续同源运行。`r2.dev` 是限流的开发地址，正式发布应绑定自定义域名并修改这一处配置。

桶的 CORS 允许公开 `GET`、`HEAD`，允许 `Range` 请求头，并公开 `ETag`、`Content-Length`、`Content-Range`、`Accept-Ranges`。保留该配置，避免 WebGL 贴图跨域失败。上传时填写正确的媒体类型；视频是 `video/webm`，音频是 `audio/webm`。

```sh
wrangler login
wrangler r2 object put resume-assets/portfolio/example/cover.webp --remote --file ./cover.webp --content-type image/webp --cache-control "public, max-age=3600"
```

对象键区分大小写。尽量为更新素材使用新文件名；覆盖同名素材时已有缓存最长保留一小时。仓库的 `.gitignore` 排除所有媒体与二进制素材。

## 独立游戏

三个游戏通过同源 iframe 加载，暂停与退出由 `src/components/works/GamePlayer.tsx` 管理。运行不需要联网对战服务，存档只保存在当前浏览器。

- 涂鸦街区：直接编辑 `public/games/doodleshooter/src/`，无需独立构建。
- 小车漫游：编辑 `games/bruno/sources/`，运行 `npm ci --prefix games/bruno`、`npm run build --prefix games/bruno`。`assets.json` 固定素材提交与摘要；`prepare-world.mjs` 生成当前场景。输出位于 `public/games/bruno/`。
- Ooqo：编辑 `games/ooqo/project/`，执行 `python games/ooqo/build.py --godot "C:/path/to/Godot_v4.5.1-stable_win64_console.exe"`，需要 Godot 4.5.1 与 Python `fonttools`。输出位于 `public/games/ooqo/`。

游戏构建下载的原素材只写入系统临时缓存。重新构建游戏之前运行 `npm run assets:restore-game`，按 `games/build-assets.json` 从 R2 的 `_source/` 取回本站修改过的贴图与字体，并校验 SHA-256。主站无需执行这一步。游戏构建产生的新二进制素材需上传到 R2 的 `games/<id>/`，代码变更仍由 Git 管理。游戏入口 HTML、字体许可和依赖版权声明保留在仓库中。

第三方来源、修改范围与完整许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 及资源目录内的许可文件。依赖、构建产物、环境凭据和下载审片目录不进入 Git。
