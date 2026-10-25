# 域名修复记录

> **2026-10-22 已恢复上线：<https://cards.foxlaoy.com/>**
> Cloudflare Pages 项目 `cardwrite` + 自定义域名 + 证书均已生效；旧域名仍是被劫持状态，不要使用。

## 结论

`cards.laoyuanyingshi.com` 已经不可用，而且是**恶意替换**，不是简单的配置错误：

| 检查项 | 结果（2026-10-22 实测） |
| --- | --- |
| `https://cards.laoyuanyingshi.com/` | 200，返回 WordPress 页面，标题「抖音账号涨粉_流量数据提升_点赞评论运维全套方案」 |
| `style.css` / `script.js` | 404（卡片系统的资源已不存在） |
| `https://laoyuanyingshi.com/` | 同样被替换为上述垃圾站 |
| 域名注册状态 | `clientTransferProhibited`，到期 2027-07-12 |
| 注册商记录最后变更 | **2026-09-13 06:12:19Z** |
| NS | `ELIAS.NS.CLOUDFLARE.COM` / `TREASURE.NS.CLOUDFLARE.COM` |
| `cards.*` 解析 | 与根域相同 IP（Cloudflare 代理），说明子域不再指向原站点 |

判断：域名本身还在注册期内，但 **2026-09-13 前后 DNS / NS 或源站被改**，现在整站内容被替换。常见原因是注册商或 Cloudflare 账号被盗、API Token 泄漏、或旧服务器被入侵后 nginx 默认站点被换成了 WordPress。

## 先做这四件事（安全优先）

1. **改密 + 开 2FA**：注册商账号、Cloudflare 账号、邮箱。三个都要改，且不要用同一个密码。
2. **查 Cloudflare 审计日志**：Dashboard → Manage Account → Audit Log，筛 2026-09-01 ～ 09-20，看是谁改了 DNS / 添加了 Token / 改了成员。
3. **吊销所有 API Token**，重新签发；检查 Cloudflare 成员列表有没有陌生账号。
4. **取证**：保存当前页面截图、`dig` 输出、RDAP 记录、审计日志导出。若确认被盗，向注册商提交工单（域名仍在注册期，通常可以锁定域名并要求恢复 DNS 控制权）。

```bash
dig +short cards.laoyuanyingshi.com
curl -sI https://cards.laoyuanyingshi.com/ | head
curl -s https://rdap.verisign.com/com/v1/domain/laoyuanyingshi.com | jq '.events'
```

> 在域名控制权确认收回之前，**不要**在新页面里复用旧域名的登录、邮箱或任何表单。

## 现在用什么地址

正式地址（2026-10-22 起）：**<https://cards.foxlaoy.com/>**

- 源站：Cloudflare Pages 项目 `cardwrite`，<https://cardwrite.pages.dev/>
- 镜像：GitHub Pages，<https://foxmuldery.github.io/cardwrite/>
- 证书：Google Trust Services，`foxlaoy.com` 通配证书，Cloudflare 边缘终止 TLS

验证结果：

```text
GET https://cards.foxlaoy.com/           200
GET https://cards.foxlaoy.com/assets/app.css  200
证书 CN=foxlaoy.com，有效期至 2026-11-29
Service Worker scope = https://cards.foxlaoy.com/
```


## 切换过程（已完成）

`foxlaoy.com` 的 Cloudflare 账号工作正常（`starcard.foxlaoy.com`、`apps.foxlaoy.com` 等在线），用它做新入口。

1. 把原 `cardwrite` 项目（2025-06 创建，之前一直指向旧版）接到新构建，部署到 <https://cardwrite.pages.dev/>。
2. 在 Pages 项目里添加自定义域名 `cards.foxlaoy.com`（`zone_tag: 59a042b894c6a126a47d798937589d5c`）。
3. 在 `foxlaoy.com` 区域添加 `CNAME cards → cardwrite.pages.dev`，代理开启。
4. Pages 完成校验，Cloudflare 边缘签发证书，域名生效。
5. 把 `apppages` 入口、仓库 homepage、canonical / OG 全部切到 `https://cards.foxlaoy.com/`。

### 验证

```bash
dig +short cards.foxlaoy.com          # 104.21.9.160 / 172.67.160.71
curl -sI https://cards.foxlaoy.com/   # 200
```

### 工具集入口

`apps.foxlaoy.com` 的「老袁编剧卡片系统」卡片已指向新域名。该 Pages 项目的 Git 构建未触发，整站手动部署又受 32MB 安装包拖累，因此用一个只做 HTML 域名替换的 Worker `apppages-link-fix`（路由 `apps.foxlaoy.com/*`）兜底；后续重新部署 `apppages` 后可删除该 Worker。

### 后续

- 旧域名彻底收回后，可以把 `laoyuanyingshi.com` 全站 301 到新域名。
- 如果坚持继续用 `laoyuanyingshi.com`：先恢复注册商 / Cloudflare 控制权，再把它的 CNAME 指向 `cardwrite.pages.dev`。**在账号安全未确认前不建议这样做。**

## 备注

- 当前主站是 Cloudflare Pages 项目 `cardwrite`（直接上传），GitHub Pages 作为同版本镜像。
- 以后更新代码时，两边都要发：`git push` 更新 GitHub Pages，`npx wrangler pages deploy dist --project-name cardwrite --branch main` 更新主站。
- `foxlaoy.com` 的根域（apex）目前 TLS 握手失败（A 记录指向 `178.128.137.126`），`www` 走 Ghost；子域（`starcard.foxlaoy.com` 等）正常。`cards` 是独立 CNAME，不受根域问题影响。
