# Japan Trip Planner — Development Kit

这是一个面向 Codex 开发的完整开发包，目标是构建一个“旅行资料库 + 自动行程规划器 + 交通路线 + 购物计划 + AI 攻略”的 Web App。

## 推荐产品定位

> 告诉它你想去哪里，剩下的交给行程。

核心流程：

1. 添加想去的地点
2. 设置优先级 / 停留时间 / 想去日期
3. 自动规划每天行程
4. 生成逐段交通路线
5. 地图显示路线
6. 自动生成地点攻略
7. 管理购物清单
8. 管理餐厅、必吃菜与预约
9. 旅行途中按当天行程执行

## 两种部署模式

### Demo Mode — GitHub Pages
适合现在快速迭代 UI。

- 无登录
- localStorage 保存
- 地图可先用静态 / mock 数据
- AI / Google Routes 使用 mock adapter
- 所有功能尽量在浏览器本地运行
- 可部署到 `username.github.io/repo-name`

### Production Mode — Vercel + Supabase
正式版本。

- Supabase Auth
- PostgreSQL
- Row Level Security
- Google Maps / Routes
- OpenAI API
- 服务端 API Route / Server Actions
- Vercel 部署

## 文档入口

- `docs/01-PRD.md` — 产品需求文档
- `docs/02-UX-UI-SPEC.md` — UI / UX 规范
- `docs/03-ARCHITECTURE.md` — 技术架构
- `docs/04-DATA-MODEL.md` — 数据模型
- `docs/05-ROUTING-ENGINE.md` — 自动路线规划逻辑
- `docs/06-AI-SPEC.md` — AI 功能与 Prompt 规范
- `docs/07-API-CONTRACTS.md` — 内部 API Contract
- `docs/08-IMPLEMENTATION-PLAN.md` — 开发阶段与任务拆分
- `docs/09-TEST-PLAN.md` — 测试清单
- `docs/10-DEPLOYMENT.md` — GitHub Pages / Vercel 部署
- `docs/11-CODEX-WORKFLOW.md` — 推荐 Codex 开发方式
- `docs/12-SECURITY-COST.md` — 安全与成本控制
- `docs/13-CURRENT-TECH-NOTES.md` — 当前技术说明
- `docs/14-MOBILE-IPADOS-SPEC.md` — iPhone / iPad 响应式与 PWA 规范
- `docs/15-DINING-SPEC.md` — 美食收藏、用餐计划与预约规范
- `AGENTS.md` — 给 Codex 的项目级开发指令

## 推荐技术栈

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand（仅本地交互状态）
- TanStack Query（远程数据缓存，可选）
- Supabase PostgreSQL + Auth
- Google Maps JavaScript API
- Google Places API
- Google Routes API
- OpenAI Responses API
- Zod
- date-fns
- lucide-react
- Vercel

## 第一阶段成功标准

第一版不追求“万能旅行平台”，只要实现：

- Places Wishlist
- Day Planner
- 拖拽排序
- 地图 Marker
- 逐段路线
- Shopping List
- Dining / Food List
- 本地保存
- GitHub Pages 可访问
- iPhone / iPad Safari 可完成核心流程

这已经可以作为你 2026 九州旅行的实际工具使用。
