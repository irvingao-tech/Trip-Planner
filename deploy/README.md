# 自托管部署（NAS / Docker）

本项目是 Next.js 静态导出（`next build` → `out/`），任何支持 Docker 的 NAS 都能托管。
仓库根目录提供了 `Dockerfile`（多阶段构建：Node 构建 → Nginx 托管）与 `docker-compose.yml`。

适配环境：绿联 NAS（UGOS Pro 的「Docker」应用，可导入 Compose）。

---

## 方式 A：Cloudflare Tunnel（推荐，外网 HTTPS，无需公网 IP / 端口映射）

1. Cloudflare 控制台 → **Zero Trust → Networks → Tunnels → Create a tunnel**，类型选 **Cloudflared**，复制 **Token**。
2. 在同一向导里添加 **Public hostname**：
   - Subdomain：如 `trip`，Domain 选你的域名 → `trip.example.com`
   - Service：**HTTP**，URL 填 `web:80`
3. 在 NAS 上准备一个目录放本项目，并在 `docker-compose.yml` 同级创建 `.env`：

   ```env
   CLOUDFLARE_TUNNEL_TOKEN=粘贴你的Token
   ```

4. 启动：

   ```bash
   docker compose up -d --build
   ```

5. 访问 `https://trip.example.com`（HTTPS 由 Cloudflare 提供）。

---

## 方式 B：仅局域网访问

编辑 `docker-compose.yml`，放开 `web` 的端口映射：

```yaml
    ports:
      - "8080:80"
```

然后 `docker compose up -d --build`，浏览器打开 `http://NAS_IP:8080`。

---

## 方式 C：自有域名 + 反向代理

保持 `web` 容器内部的 80 端口，用 UGOS 的「反向代理」或 nginx-proxy-manager 指向 `japan-trip-web:80`，并申请 Let's Encrypt 证书。

---

## 更新应用

```bash
git pull
docker compose up -d --build
```

## 不使用 Docker（可选）

在有 Node 的机器上：

```bash
npm ci
npm run build       # 生成 out/
```

把 `out/` 放到 NAS 的网站目录（如 UGOS 的网站共享 / Web Station），用其内置 Web 服务托管即可。

---

## 说明

- 静态托管下，数据仍保存在**各访问设备的浏览器**（localStorage），不会自动集中。
- 若要「同一用户跨设备统一数据」，需要后端（自建 Supabase 或轻量 API + 数据库）。当前为第一阶段（静态），后端可在后续叠加。
