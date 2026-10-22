# 域名修复记录

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

已经部署到 GitHub Pages，立刻可用：

**https://foxmuldery.github.io/cardwrite/**

同时已把 `apppages` 工具集里「老袁编剧卡片系统」的入口从旧域名改成上面的地址（main 与 gh-pages 两个分支都已更新，2026-10-22 生效），避免访客继续落到垃圾站。

## 切到 `cards.foxlaoy.com`（推荐）

`foxlaoy.com` 仍在你的 Cloudflare 账号下且工作正常（`starcard.foxlaoy.com` 等在线），用它做新入口最稳。

### 1. Cloudflare DNS

在 `foxlaoy.com` 区域添加：

| 类型 | 名称 | 内容 | 代理状态 |
| --- | --- | --- | --- |
| CNAME | `cards` | `foxmuldery.github.io` | **仅 DNS（灰色云朵）** |

> 必须灰云。橙云代理会让 GitHub 无法签发证书，出现 525 / 重定向循环。
>
> 顺带一提：`foxlaoy.com` 的根域（apex）目前 TLS 握手失败（A 记录指向 `178.128.137.126`，疑似源站证书/服务异常），`www` 走 Ghost。子域（`starcard.foxlaoy.com` 等）经 Cloudflare 正常。`cards` 用独立 CNAME 即可，不受根域问题影响。

### 2. 仓库里声明域名

在仓库根目录新建 `CNAME` 文件，内容一行：

```
cards.foxlaoy.com
```

提交后 GitHub Pages 会自动签发 Let's Encrypt 证书（通常 1–10 分钟）。

### 3. 打开 HTTPS

仓库 Settings → Pages → 勾选 **Enforce HTTPS**。

### 4. 验证

```bash
dig +short cards.foxlaoy.com          # 应返回 185.199.108-111.153
curl -sI https://cards.foxlaoy.com/   # 200，且证书有效
```

### 5. 收尾

- 更新所有指向旧域名的入口（`apppages` 里的「老袁编剧卡片系统」卡片目前仍链到 `cards.laoyuanyingshi.com`，需改成 `https://cards.foxlaoy.com/`）。
- 在旧域名彻底收回后，把 `laoyuanyingshi.com` 全站 301 到新域名，再观察一段时间。
- 如果坚持继续用 `laoyuanyingshi.com`：先恢复注册商 / Cloudflare 控制权，重新添加指向 `foxmuldery.github.io` 的 CNAME，并在 Pages 里把自定义域名改成它。**在账号安全未确认前不建议这样做。**

## 备注

- GitHub Pages 对自定义域名要求 DNS 记录存在后再在仓库放 `CNAME`，否则 `github.io` 地址会 301 到一个还不存在的域名。
- 本仓库的 `CNAME` 文件故意**暂未添加**，等 DNS 记录就绪后再加，避免把当前可用的 Pages 地址弄坏。
