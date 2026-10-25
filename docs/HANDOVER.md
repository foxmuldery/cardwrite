# 编剧卡片系统 · 交接报告

- 版本：v1.1.0（schema 3，Service Worker `cardwrite-v1.1.0`）
- 代码：<https://github.com/foxmuldery/cardwrite>（public，`main`）
- 线上：<https://cards.foxlaoy.com/>（Cloudflare Pages）
- 交接日期：2026-10-24
- 上一手：2026-10-22 完成 v1.0.0 重构与域名迁移；2026-10-25 发布 v1.1.0（大纲视图 / 标签 / 版本历史 / CI 自检）

---

## 0. 一页摘要

这是一个**纯静态、本地优先**的编剧节拍表 / 卡片工具：按救猫咪或兔狲节拍表把剧本拆成卡片，支持拖拽、冲突与情感标注、结构诊断、多项目、导出和离线使用。没有后端、没有账号、没有埋点，数据只存在浏览器 `localStorage`。

当前状态：

| 项 | 状态 |
| --- | --- |
| 代码 | v1.1.0，`main` 为唯一开发分支 |
| 主站 | `cards.foxlaoy.com` 已生效，HTTPS 正常 |
| 源站 | Cloudflare Pages 项目 `cardwrite` |
| 镜像 | GitHub Pages `foxmuldery.github.io/cardwrite` |
| 自动化 | 无构建；`scripts/check.mjs` 静态自检 + GitHub Actions；GitHub Pages 推送即发布，Cloudflare Pages 手动部署 |
| 最大风险 | 数据只在单浏览器；Cloudflare 部署权限已过期；工具集入口仍指向旧劫持域名 |

接手后最先做的三件事：

1. 恢复 Cloudflare Pages 部署权限，把主站同步到最新提交（当前主站的 `canonical` 还指向 GitHub 镜像）。
2. 修掉 `apps.foxlaoy.com` 工具集里指向旧劫持域名的入口。
3. 加最小 CI（构建 + 部署 + 冒烟测试），避免“代码在 GitHub、线上是旧版”。

---

## 1. 产品定位

**一句话**：把故事结构摊在桌面上，让编剧在写正文之前先把“每一拍发生了什么”想清楚。

核心用户：

- 电影 / 剧集编剧：用节拍表搭结构、做分场、检查节奏。
- 短剧 / 竖屏内容团队：快速拆 60–120 个卡点。
- 编剧教学：把节拍表作为教学脚手架，学生按拍填卡。

不做的事：

- 不做完整剧本排版软件（Final Draft 替代品）。
- 不做通用看板（Notion / Milanote 替代品）。
- 不做云端协作平台（当前阶段）。
- 不强制登录、不上传剧本内容。

设计原则：

1. **本地优先**：断网可用，数据不离开浏览器。
2. **结构先于正文**：卡片是最小单位，正文是下一步。
3. **低学习成本**：打开就能写第一张卡，不要求先配置。
4. **可带走**：任何时刻都能导出 JSON / Markdown / CSV。

---

## 2. 线上资产

| 资产 | 地址 | 说明 |
| --- | --- | --- |
| 正式域名 | <https://cards.foxlaoy.com/> | Cloudflare 代理 + Google Trust Services 证书 |
| Cloudflare Pages | <https://cardwrite.pages.dev/> | 项目 `cardwrite`，直接上传部署 |
| GitHub Pages | <https://foxmuldery.github.io/cardwrite/> | 同版本镜像，推送 `main` 自动构建 |
| GitHub 仓库 | <https://github.com/foxmuldery/cardwrite> | public，`main` |
| 旧域名 | `cards.laoyuanyingshi.com` | **已被劫持为垃圾站，禁止使用**，详见 `docs/DOMAIN.md` |

DNS / 证书事实（2026-10-22 验证）：

- `CNAME cards → cardwrite.pages.dev`，Cloudflare 代理开启（橙云）。
- 证书 `CN=foxlaoy.com`，Google Trust Services，有效期至 2026-11-29，到期前由 Cloudflare 自动续。
- HTTP 自动 301 到 HTTPS。
- `foxlaoy.com` 根域目前 TLS 握手失败（A 记录指向 `178.128.137.126`），`www` 走 Ghost；子域正常，`cards` 不受影响。

---

## 3. 代码与架构

### 3.1 目录

```text
index.html                 页面骨架、8 个 <dialog>、SVG 图标 sprite
assets/
  app.css                  全部样式：设计变量、深色、响应式、打印
  app.js                   应用逻辑（IIFE，约 2,300 行）
  vendor/sortable.min.js   SortableJS 1.15.0（MIT，内置，无 CDN）
  icons/                   PWA 图标、favicon
manifest.webmanifest       PWA 清单
sw.js                      离线缓存（cache-first + 导航 network-first）
404.html                   GitHub Pages / CF Pages 404 回退
_headers                   Cloudflare Pages 安全与缓存响应头（GitHub 忽略）
docs/                      域名记录、预览图、本文件、路线图
.nojekyll                  GitHub Pages 关闭 Jekyll
```

没有 `package.json`、没有构建步骤、没有依赖安装。改完直接部署。

### 3.2 运行时结构

`assets/app.js` 是一个 IIFE，按注释分区：

| 分区 | 职责 |
| --- | --- |
| 常量与结构 | 三种剧本类型、15 个节拍的 `min/max/key`、提示文案 |
| 工具函数 | 转义、日期、UUID、localStorage 读写、防抖 |
| 全局状态 | `state`：数据、筛选、撤销栈、编辑器、拖拽、回收站 |
| 数据层 | `blankData` / `normalizeData` / `normalizeCard` / `saveNow` / `mutate` / `undo` |
| 回收站 | 30 天保留、去重、恢复 |
| 渲染 | `renderBoard` / `cardEl` / `updateCounts` |
| 筛选 | 按幕、标记、全文搜索 |
| 拖拽 | SortableJS；坐标检测拖入垃圾桶 |
| 弹窗 | `showModal`、遮罩关闭、焦点管理 |
| 编辑器 | 卡片增删改、灵感转卡片、移动 |
| 快速添加 | 节拍 chips + 文本 |
| 项目 | 快照列表、打开、另存、重命名、删除、类型切换 |
| 灵感箱 / 垃圾桶 | 列表与操作 |
| 结构诊断 | 覆盖、冲突、幕分布、情感曲线、建议 |
| 导出 | JSON / Markdown / CSV / 打印 |
| 导入 | 校验、迁移、自动备份 |
| 顶部 chrome | tabs、主题、快捷键、保存状态 |

> 维护提示：`app.js` 已经偏大。路线图 Phase 0 建议拆成 ES modules（`data/`、`ui/`、`export/`、`ai/`），但**不要**在拆分的同时改行为。

### 3.3 数据模型（schema 3）

```json
{
  "project": {
    "id": "uuid",
    "title": "雨夜来信",
    "type": "tv-hour",
    "lastSaved": "2026-10-22T…",
    "schema": 3
  },
  "acts": {
    "1": { "opening": [Card], "theme": [Card], "…": [] },
    "2": { "…": [] },
    "3": { "…": [] },
    "4": { "…": [] },
    "bucket": { "ideas": [Card] }
  }
}
```

`Card`：

```ts
{
  id: string;
  status: "confirmed" | "pending" | "question";
  location: { type: "INT" | "EXT" | "I/E"; place: string };
  description: string;              // ≤1200
  conflict: { protagonist: string; goal: string; obstacle: string };
  emotionalChange: "positive" | "negative" | "neutral";
  emotionalChangeContent: string;   // ≤80
  createdAt: string;                // ISO
  updatedAt: string;
  tags: string[];                   // 标签，最多 6 个
  origin?: { act: string; beat: string }; // 迁移时记录来源
}
```

剧本类型与节拍：

- `movie`：三幕 15 拍（`movie` / 第一幕…第三幕）
- `tv-hour`：四幕 15 拍
- `tv-half`：三幕 15 拍

每个节拍含 `min/max/key`，`key` 用于“关键节拍覆盖”统计。完整定义在 `app.js` 的 `STRUCTURES`。

localStorage key：

| key | 用途 |
| --- | --- |
| `scriptCards` | 当前打开的项目的自动保存 |
| `scriptCards_<名称>` | 另存的项目快照 |
| `cardwrite.trash` | 垃圾桶（上限 120 条，30 天） |
| `cardwrite.theme` | `light` / `dark` |
| `cardwrite.seen` | 首次访问提示标记 |

兼容性：

- 旧版 v0.8.x 的 `scriptCards` 会在读取时迁移：补 `status`、`location`、`conflict`、`emotionalChange`、`createdAt`、`tags`；重复 `id` 重新生成；未知节拍的卡片进灵感箱并记录 `origin`。
- 导入时同样走 `normalizeData`，不会静默丢卡片。
- **改 schema 必须升 `SCHEMA` 并写迁移**，否则老数据会缺字段。

### 3.4 核心机制

**保存**：所有增删改通过 `mutate()` → 立即 `saveNow()`（同步 localStorage）。标题输入单独 450ms 防抖。`beforeunload` / `pagehide` / `visibilitychange` 兜底。

**撤销**：每次变更前 JSON 快照入栈，上限 40；`afterHistory` 恢复后清理垃圾箱重复项并重渲染。

**拖拽**：SortableJS，`group: 'cards'`，跨节拍/跨幕；落点用 DOM 顺序回写（`syncFromDom`），避免索引错位；拖到页面底部“松手删除”区域用坐标命中检测，不依赖 Sortable 容器。

**渲染**：整板重建（`renderBoard`），卡片节点用 `textContent`/转义构建，所有用户内容经 `escapeHtml`。当前规模（≤几百张）无需虚拟滚动。大纲视图（`renderOutline`）与卡片板共享同一份数据，切换视图不重排数据。

**版本历史**：IndexedDB `cardwrite-history` / `versions`，按 `project.id` 归档；结构性修改与保存最多 60 条，支持预览、恢复、删除、手动存版本。恢复前会先把当前内容存为「恢复前」版本。

**PWA**：`sw.js` 预缓存 app shell；导航 network-first，静态资源 cache-first + 后台更新。**改完 `assets/` 必须改 `sw.js` 的 `VERSION`**，否则回访用户可能短时间看到旧资源。

**导出**：JSON（可再导入）、Markdown 大纲、CSV（BOM，Excel/飞书）、打印（A4，按幕不拆页）。

### 3.5 明确的技术约束

- 无后端、无账号、无同步。
- localStorage 约 5MB；一个几百张卡的项目通常 <1MB，但版本历史/图片不能塞进去。
- 不支持多标签页并发编辑：`storage` 事件只提示“其他标签页已更新”，后写覆盖先写。
- 仅中文界面；`lang="zh-Hans"`，未做 i18n。
- 未设置 CSP（只有 `_headers` 里的基础安全头）。

---

## 4. 部署与运维

### 4.1 拓扑

```text
                    ┌──────────────────────────┐
用户 ── HTTPS ──────▶│ Cloudflare (foxlaoy.com) │
                    │  CNAME cards → pages.dev │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │ Cloudflare Pages         │
                    │ project: cardwrite       │
                    │ 直接上传（非 Git 集成）   │
                    └──────────────────────────┘

GitHub main ──push──▶ GitHub Pages（镜像）
```

### 4.2 GitHub Pages

- Settings → Pages → Deploy from a branch：`main` / root。
- 推送 `main` 自动构建，约 30–60 秒。
- `.nojekyll` 已存在；`_headers` 会被忽略。
- 以 `main` 最新提交为准构建，`canonical` 已指向正式域名。

### 4.3 Cloudflare Pages（主站）

项目 `cardwrite`，2025-06 创建，**直接上传**，不是 Git 集成，因此 push 不会自动部署。

部署步骤：

```bash
# 1. 准备干净的 dist（不要把 .git 传上去）
rm -rf /tmp/cardwrite-dist && mkdir -p /tmp/cardwrite-dist
cd /path/to/cardwrite
cp index.html manifest.webmanifest sw.js 404.html README.md _headers /tmp/cardwrite-dist/
cp -R assets docs /tmp/cardwrite-dist/

# 2. 登录（OAuth，需要人工点 Allow）
npx wrangler login

# 3. 部署
npx wrangler pages deploy /tmp/cardwrite-dist \
  --project-name cardwrite --branch main --commit-dirty=true
```

说明：

- `_headers` 提供 `X-Frame-Options`、`nosniff`、`Referrer-Policy`、`Permissions-Policy` 和缓存策略。
- 部署后检查 `https://cardwrite.pages.dev/` 与 `https://cards.foxlaoy.com/`。
- 自定义域名 `cards.foxlaoy.com` 已在 Pages 项目中绑定，证书由 Cloudflare 自动续。

### 4.4 工具集入口 Worker（临时）

- Worker：`apppages-link-fix`，入口 `workers/hub-link-fix/worker.js`（在 `apppages` 仓库）。
- 路由：`apps.foxlaoy.com/*`（`zone 59a042…`），另有既有的 `catbreak/download`、`catbreak/stats.json` 路由。
- 行为：拉取 `https://apppages.pages.dev` 同路径，HTML 中把 `https://cards.laoyuanyingshi.com` 替换为 `https://cards.foxlaoy.com`；非 HTML 原样流式返回。
- 删除方式：Cloudflare Dashboard → Workers Routes 删掉 `apps.foxlaoy.com/*`，再删 Worker；或在 API 里删除对应 route id。

### 4.5 域名

详见 `docs/DOMAIN.md`。要点：

- `foxlaoy.com` 在 Cloudflare，`cards` 是代理 CNAME。
- 旧域名 `cards.laoyuanyingshi.com` 已被替换成垃圾站，**不要访问、不要在上面输入任何内容**。
- 旧 origin 的 localStorage 可能仍留有剧本数据，且劫持页面同源可读；建议在浏览器站点设置里直接清除该站点数据，不要为了导出再打开它。
- 新域名与旧域名不同源，旧数据不会自动带过来；用 JSON 备份导入。

### 4.6 发版 checklist

- [ ] `sw.js` 的 `VERSION` 是否递增（改了 `assets/` 就必须改）
- [ ] `index.html` 的 `APP_VERSION` / 页脚版本号
- [ ] `canonical` / `og:url` / `og:image` 是否指向 `https://cards.foxlaoy.com/`
- [ ] 本地跑一遍冒烟测试（见第 7 节）
- [ ] `git push` 更新 GitHub Pages 镜像
- [ ] `wrangler pages deploy` 更新主站
- [ ] 线上验证 `cards.foxlaoy.com` 与 `cardwrite.pages.dev`
- [ ] 如果改了数据结构，确认旧版 JSON 仍能导入

### 4.7 回滚

- GitHub Pages：`git revert` 后推送，自动回滚。
- Cloudflare Pages：Dashboard → Deployments → 选择上一个成功部署 → “Rollback”。
- 数据：撤销栈仅当前会话；跨会话恢复靠 `scriptCards_<名称>` 快照或用户自己导出的 JSON。**没有自动历史版本**（这是路线图 Phase 1 的重点）。

### 4.8 账号与权限现状

| 项 | 状态 |
| --- | --- |
| GitHub CLI | 已登录 `foxmuldery`，有 `repo`、`workflow` 权限 |
| Cloudflare OAuth | **已过期**（2026-10-22 02:37 UTC），需要 `wrangler login` 重新授权 |
| Cloudflare 权限范围 | 仅 `pages:write`、`account:read`、`user:read`；**没有 DNS 写权限** |
| DNS | 上次由用户在 Dashboard 手动添加，无 API Token |
| 域名注册商 | 未知/未交接；旧域名找回需要注册商权限 |

> 不要把任何 Token 写进仓库或本文档。需要 DNS 自动化时，单独创建 `Zone.DNS.Edit` 的最小权限 Token，存到本机 `.cloudflare.env` 并 gitignore。

---

## 5. 已知问题与技术债

按优先级排序。

### P0（影响线上一致性）

1. **Cloudflare 主站落后一个提交**
   - 现象：`cards.foxlaoy.com` 的 `canonical` 仍指向 `foxmuldery.github.io/cardwrite/`；应用 JS/CSS 已是最新（hash 一致），只差 HTML meta。
   - 原因：Cloudflare OAuth 过期，最后一次部署在 `72be2ec` 之前。
   - 修复：`wrangler login` → 按 4.3 重新部署。

2. **`apps.foxlaoy.com` 工具集入口（已用 Worker 兜底，根因未除）**
   - 现象：该页“老袁编剧卡片系统”卡片原本仍链到 `cards.laoyuanyingshi.com`。
   - 原因：Cloudflare Pages 项目 `apppages` 虽显示 GitHub 连接，但 push `main` / `gh-pages` 都没有触发构建；整站手动部署又被 6 个 32MB 的 macOS 安装包卡住（Pages 单文件 25MB 限制）。
   - 现状：已部署最小 Worker `apppages-link-fix`，路由 `apps.foxlaoy.com/*`，从 `https://apppages.pages.dev` 取页面并把旧域名替换为新域名；其他路径按原样代理，`catbreak/stats.json` 等更具体的路由优先。
   - 根因修复：在 Cloudflare Dashboard 重新连接 `apppages` 的 Git 构建，或把静态站拆成不含大安装包的部署；完成后可删除 Worker 路由（`workers/routes`）与 Worker。

### P1（稳定性/可维护性）

3. **没有 CI**：Cloudflare 主站靠手动部署，容易漂移。
4. **没有自动化测试**：2,300 行单文件 JS，回归靠手测。
5. **`app.js` 单文件**：数据层、UI、导出、诊断耦合；建议拆 modules（Phase 0）。
6. **Service Worker 缓存**：改资源不升 `VERSION` 会导致回访用户短时看到旧文件。
7. **localStorage 单点**：清缓存/换设备即丢；无自动历史版本；上限约 5MB。
8. **无 CSP**：已有 `nosniff` / `X-Frame-Options`，但没有 `Content-Security-Policy`。

### P2（体验/边界）

9. **打印分页**：按幕 `break-inside: avoid`，幕很高时会留下较大空白；可改为按节拍分页。
10. **多标签页并发**：只提示，不合并，后写覆盖。
11. **移动端拖拽**：长按 120ms 才进入拖拽；和页面滚动存在轻微竞争，实测可用但不如桌面稳。
12. **根域 TLS**：`foxlaoy.com` apex 目前握手失败，`www` 指向 Ghost；与 `cards` 无关，但用户可能误以为整站坏了。

---

## 6. 数据安全与隐私

- 所有剧本内容存在用户浏览器，不上传。域名迁移、换浏览器、清缓存都会丢。
- 旧域名被劫持期间，任何仍在旧 origin 的 `localStorage` 数据都可能被劫持页面的脚本读取。**如果用户在旧域名存过敏感项目，应按泄露处理**：清除该站点数据，不要再次访问；用历史 JSON 备份迁移。
- 导入 JSON 会执行 `normalizeData` 并渲染转义后的文本；已修过 XSS，但仍建议不要把来源不明的 JSON 当作可信输入。
- 若要加 AI / 云同步，必须先把“数据离开浏览器”的开关、告知和删除机制设计好。

---

## 7. 验收与冒烟测试

### 7.1 命令行

```bash
# 首页与资源
curl -sI https://cards.foxlaoy.com/ | head
curl -sI https://cards.foxlaoy.com/assets/app.js | head
curl -sI https://cards.foxlaoy.com/sw.js | head

# 证书
echo | openssl s_client -connect cards.foxlaoy.com:443 \
  -servername cards.foxlaoy.com 2>/dev/null | openssl x509 -noout -subject -dates

# 本地 DNS 缓存异常时用 DoH
curl --doh-url https://cloudflare-dns.com/dns-query -I https://cards.foxlaoy.com/
```

### 7.2 手动清单（每次发版）

- [ ] 打开首页，4 幕 15 拍正常渲染
- [ ] 新增卡片 → 刷新页面 → 卡片还在
- [ ] 编辑卡片：状态、场景、冲突、情感都能保存
- [ ] 拖拽跨节拍、跨幕排序
- [ ] 拖到垃圾桶删除 → 撤销 → 恢复
- [ ] 灵感箱：新增 → 转为卡片
- [ ] 诊断：数字、情感曲线、建议不报错
- [ ] 搜索 / 按标记筛选 / 按幕筛选
- [ ] 另存项目 → 新建 → 打开快照
- [ ] 导出 JSON / Markdown / CSV / 打印
- [ ] 移动端 390×844：编辑弹窗底部按钮可见
- [ ] 深色模式切换并刷新后保持
- [ ] 断网后刷新仍可打开（Service Worker）

### 7.3 建议补的自动化

- Vitest：`normalizeData`、迁移、撤销、筛选、导出字符串。
- Playwright：上面 12 条手动清单抽 6 条做 E2E。
- CI：push 时跑测试；`main` 合并后自动部署 CF Pages（需要 API Token Secret）。

---

## 8. 交接 TODO

- [ ] 重新 `wrangler login`，恢复 Pages 部署权限
- [ ] 部署最新 `main` 到 Cloudflare Pages，修正 `canonical`
- [ ] 更新 `apps.foxlaoy.com` 的卡片入口
- [ ] 给仓库加 `CLOUDFLARE_API_TOKEN`（Pages:Edit）Secret，接 GitHub Actions
- [x] 静态自检（`scripts/check.mjs` + GitHub Actions）
- [ ] 补 Vitest + Playwright 最小测试集
- [ ] 拆分 `app.js`（不改行为）
- [ ] 给 `sw.js` 加版本校验脚本
- [ ] 评估 IndexedDB 版本历史（Phase 1）
- [ ] 确认旧域名注册商状态，决定是否继续找回
- [ ] 确认 `foxlaoy.com` 根域 TLS 问题是否要修

---

## 9. 关键决策记录

| 决策 | 原因 |
| --- | --- |
| 纯静态、无框架 | 零运维、可离线、单文件部署；当前规模无需框架 |
| localStorage 而非 IndexedDB | 实现简单、同步读写；缺点见技术债，Phase 1 再迁移 |
| SortableJS 内置 | 触摸/桌面拖拽成熟；避免 CDN 依赖 |
| 整板重渲染 | 卡片数量小，代码简单；虚拟滚动暂无必要 |
| 快照式撤销 | 数据小，JSON 快照比命令模式可靠 |
| Cloudflare Pages 主站 + GitHub Pages 镜像 | 自定义域名证书由 Cloudflare 管理；GitHub 作为免费备份 |
| AI 暂不接入 | 先补结构能力与数据安全，避免过早引入成本/隐私问题 |

---

## 10. 附录

### 10.1 提交里程碑

```text
d2bda6f  v1.0.0 重构（视觉、数据安全、拖拽、PWA）
f160e05  README 预览与部署状态
823c249  域名记录与 foxlaoy 现状
553e594  a11y：卡片容器 role=group
8800b5d  color-mix 回退
93491b5  移动端编辑弹窗底部裁切
4fd4f9c  移动端隐藏快捷键 + SW v1.0.1
5596359  Cloudflare 安全响应头
89f49e7  主站切 Cloudflare Pages
72be2ec  正式启用 cards.foxlaoy.com
89f2f1e  交接报告与功能路线图
```

### 10.2 关键常量

| 常量 | 值 |
| --- | --- |
| `APP_VERSION` | `1.0.0` |
| `SCHEMA` | `3` |
| SW `VERSION` | `cardwrite-v1.1.0` |
| 撤销栈 | 40 |
| 垃圾桶 | 120 条 / 30 天 |
| 描述上限 | 1200 字 |
| 自动保存 | 变更即存；标题 450ms 防抖 |

### 10.3 相关文档

- `docs/DOMAIN.md`：旧域名取证、迁移过程、DNS/证书
- `docs/ROADMAP.md`：功能扩展策划方案
- `README.md`：用户向说明
