# 旅日手帖

面向 iPhone、iPad 和桌面的日本旅行规划网页。当前 Demo 使用浏览器本地存储，并可静态部署到 GitHub Pages。

## 本地运行

```bash
npm install
copy .env.example .env.local
npm run dev
```

## Google Maps

未配置 API Key 时，应用会使用 Google Maps 的公开搜索嵌入模式，地图可以直接显示。

如需使用官方 Maps Embed API 的地点模式，可按以下步骤配置：

1. 在 Google Cloud 中启用 **Maps Embed API**。
2. 创建浏览器 API Key，并限制到 Maps Embed API。
3. 为 Key 配置网站来源限制：本地开发使用 `http://localhost:3000/*`，部署后使用你的 GitHub Pages 域名和仓库路径。
4. 在 `.env.local` 中配置：

```env
NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY=your_key
```

Google Maps Embed API 的 Key 会随 iframe URL 在浏览器中可见，因此必须使用 API 和 HTTP Referrer 限制，不能使用服务端密钥。

## 联网地点资料

添加普通地点时只需填写名称和停留时间。应用通过 OpenStreetMap Nominatim 搜索日本境内的真实地点，并自动保存区域、完整地址、类别、经纬度、日文名、网站、营业时间（数据存在时）以及对应的 Google Maps 定位链接。搜索由用户主动点击触发，不做逐字自动请求，并在界面中显示 OpenStreetMap 数据署名。

## GitHub Pages

仓库 Actions Secret 中添加：

- 名称：`GOOGLE_MAPS_EMBED_KEY`
- 值：受网站来源限制的 Maps Embed API Key

推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会检查并发布 `out` 静态目录。

## 检查

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## 自托管（NAS / Docker）

支持用 Docker 部署到自有 NAS（如绿联 UGOS），并通过 Cloudflare Tunnel 提供外网 HTTPS。
详见 [`deploy/README.md`](deploy/README.md)。
