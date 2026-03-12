# game-service-platform

一个可部署到 Cloudflare 的全栈 MVP 管理平台，用于管理“游戏陪玩 / 代练 / 打手”业务流程。

支持 3 类角色：

- `admin`：老板 / 管理员
- `worker`：打手 / 陪玩人员
- `customer`：用户 / 客户

技术栈：

- 前端：React + Vite + TypeScript
- UI：Tailwind CSS
- 后端 API：Cloudflare Workers + Hono
- 数据库：Cloudflare D1
- 认证：账号密码 + JWT Bearer Token

登录与注册入口：

- 管理员登录：`/admin/login`
- 打手登录：`/worker/login`
- 客户登录：`/customer/login`
- 客户注册：`/customer/register`

说明：

- `admin` 与 `worker` 账号由管理员在后台创建
- `customer` 支持前台自助注册
- 登录接口会校验角色入口，必须从对应角色页面登录

## 项目结构

```text
game-service-platform/
├─ frontend/         React 前端
├─ worker-api/       Cloudflare Workers API
├─ database/
│  ├─ schema.sql
│  └─ seed.sql
├─ package.json
└─ README.md
```

## 核心能力

### 管理员端

- 仪表盘总览
- 充值申请审核
- 充值记录查看
- 用户管理
- 打手管理
- 订单创建、编辑、详情查看
- 工资结算管理
- 服务项目管理

### 打手端

- 个人收入首页
- 仅查看自己的订单
- 查看自己的结算记录
- 查看订单详情

### 用户端

- 用户余额和订单总览
- 提交充值申请
- 查看充值申请状态
- 浏览服务项目
- 余额下单
- 查看自己的订单与详情

## 数据模型说明

主要表：

- `users`
- `service_products`
- `recharge_requests`
- `wallet_transactions`
- `orders`
- `settlements`

关键逻辑：

- 用户余额 = `wallet_transactions` 流入 - 流出
- 充值申请审核通过后，自动写入 `wallet_transactions`
- 订单创建时，自动扣减用户余额
- 订单调价时，会自动补扣或退款
- 订单取消时，会自动退款
- 结算时，会把该打手所有 `completed` 订单打包结算并置为 `settled`

## 默认种子账号

导入 `database/seed.sql` 后可直接使用：

- 管理员：`admin / admin123456`
- 打手 1：`worker_ares / worker123456`
- 打手 2：`worker_luna / worker234567`
- 用户 1：`customer_kevin / customer123456`
- 用户 2：`customer_mia / customer234567`

## 本地运行

### 1. 初始化 API 依赖

```bash
cd worker-api
npm install
```

### 2. 初始化前端依赖

```bash
cd ../frontend
npm install
```

### 3. 创建 D1 数据库

```bash
cd ../worker-api
npx wrangler d1 create game-service-platform-db
```

创建完成后，把返回的 `database_id` 填进 [wrangler.jsonc](/22zhuxiangyi/game-service-platform/worker-api/wrangler.jsonc)。

### 4. 导入数据库结构

```bash
cd /22zhuxiangyi/game-service-platform/worker-api
npx wrangler d1 execute game-service-platform-db --local --file=../database/schema.sql
```

### 5. 导入种子数据

```bash
cd /22zhuxiangyi/game-service-platform/worker-api
npx wrangler d1 execute game-service-platform-db --local --file=../database/seed.sql
```

如果你是在已有数据库上升级本项目，而不是新建数据库，还需要执行这条迁移：

```bash
cd /22zhuxiangyi/game-service-platform/worker-api
npx wrangler d1 execute game-service-platform-db --local --file=../database/add_orders_is_deleted.sql
```

如果你想直接在 D1 控制台执行 SQL，也可以手动运行：

```sql
ALTER TABLE orders ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1));
CREATE INDEX IF NOT EXISTS idx_orders_is_deleted ON orders(is_deleted);
```

### 6. 配置本地环境变量

复制 API 环境变量模板：

```bash
cd /22zhuxiangyi/game-service-platform/worker-api
cp .dev.vars.example .dev.vars
```

复制前端环境变量模板：

```bash
cd /22zhuxiangyi/game-service-platform/frontend
cp .env.example .env
```

默认本地 API 地址：

```env
VITE_API_BASE=http://127.0.0.1:8787
```

### 7. 启动 API

```bash
cd /22zhuxiangyi/game-service-platform/worker-api
npm run dev
```

### 8. 启动前端

```bash
cd /22zhuxiangyi/game-service-platform/frontend
npm run dev
```

默认访问：

- 前端：`http://localhost:5173`
- API：`http://127.0.0.1:8787`

## Cloudflare 部署

### 部署 D1

如果还没有线上 D1：

```bash
cd /22zhuxiangyi/game-service-platform/worker-api
npx wrangler d1 create game-service-platform-db
```

将返回的 `database_id` 写入 [wrangler.jsonc](/22zhuxiangyi/game-service-platform/worker-api/wrangler.jsonc)。

导入线上结构：

```bash
npx wrangler d1 execute game-service-platform-db --remote --file=../database/schema.sql
```

导入线上种子：

```bash
npx wrangler d1 execute game-service-platform-db --remote --file=../database/seed.sql
```

如果是升级已有线上 D1，请额外执行：

```bash
npx wrangler d1 execute game-service-platform-db --remote --file=../database/add_orders_is_deleted.sql
```

如果你是在 Cloudflare Dashboard 的 D1 控制台里手动迁移，也可以直接执行：

```sql
ALTER TABLE orders ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1));
CREATE INDEX IF NOT EXISTS idx_orders_is_deleted ON orders(is_deleted);
```

### 部署 Workers API

修改 [wrangler.jsonc](/22zhuxiangyi/game-service-platform/worker-api/wrangler.jsonc)：

- `name`
- `vars.JWT_SECRET`
- `vars.FRONTEND_ORIGIN`
- `d1_databases[0].database_id`

然后部署：

```bash
cd /22zhuxiangyi/game-service-platform/worker-api
npm run deploy
```

### 使用 Cloudflare Dashboard 手动部署单文件 Worker

如果你不想通过 Wrangler 部署，也可以直接使用单文件版本：

- Worker 文件：[dashboard-worker.js](/22zhuxiangyi/game-service-platform/worker-api/dashboard-worker.js)
- 该文件不依赖本地模块，适合直接粘贴到 Cloudflare Worker Dashboard 编辑器

手动部署步骤：

1. 在 Cloudflare Dashboard 创建一个新的 Worker
2. 打开在线编辑器
3. 将 [dashboard-worker.js](/22zhuxiangyi/game-service-platform/worker-api/dashboard-worker.js) 的内容全部粘贴进去
4. 在 Worker Settings 中绑定 D1 数据库，绑定名必须是 `DB`
5. 在 Worker Variables 中添加：
   - `JWT_SECRET`
   - `FRONTEND_ORIGIN`
6. 保存并部署

如果前端也部署在 Cloudflare Pages，请把 `FRONTEND_ORIGIN` 设置为你的 Pages 域名，例如：

```env
https://game-service-platform.pages.dev
```

### 部署前端到 Cloudflare Pages

在 Cloudflare Pages 中连接该仓库或目录，前端设置如下：

- Root directory：`frontend`
- Build command：`npm run build`
- Build output directory：`dist`

前端环境变量：

```env
VITE_API_BASE=https://your-worker-name.your-subdomain.workers.dev
```

如果你使用自定义域名，也可以填写自定义 API 域名。

## API 一览

### 认证

- `POST /api/login`
- `POST /api/register`
- `POST /api/logout`
- `GET /api/me`

### 管理员

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/workers`
- `POST /api/admin/workers`
- `DELETE /api/admin/workers/:id`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/recharge-requests`
- `PUT /api/admin/recharge-requests/:id/review`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `POST /api/admin/orders`
- `PUT /api/admin/orders/:id`
- `DELETE /api/admin/orders/:id`
- `GET /api/admin/settlements`
- `POST /api/admin/settlements`
- `DELETE /api/admin/settlements/:id`

### 打手

- `GET /api/worker/dashboard`
- `GET /api/worker/orders`
- `GET /api/worker/orders/:id`
- `DELETE /api/worker/orders/:id`
- `GET /api/worker/settlements`

### 用户

- `GET /api/customer/dashboard`
- `GET /api/customer/products`
- `POST /api/customer/recharge-requests`
- `GET /api/customer/recharge-requests`
- `DELETE /api/customer/recharge-requests/:id`
- `POST /api/customer/orders`
- `GET /api/customer/orders`
- `GET /api/customer/orders/:id`
- `DELETE /api/customer/orders/:id`

## 说明与取舍

- 当前版本是 MVP，不接入真实支付和上传。
- 登录使用 JWT Bearer Token，前端存储在 `localStorage`。
- 结算采用“按打手一次性结算所有已完成订单”的简化模型。
- 未实现更复杂的审批流、消息通知、细粒度审计日志。
- 页面采用前端分页，适合 MVP 和中小数据量。
