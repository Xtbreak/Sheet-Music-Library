# Sheet Music Library（诗歌库）

一个基于 **Next.js 15 + Prisma + NextAuth** 的歌曲与乐谱管理系统。

支持：歌曲管理、分类管理、曲谱图片上传、曲调标注与筛选、角色权限控制（超级管理员 / 管理员 / 普通用户）。

---

## 功能概览

- 歌曲列表与详情浏览（支持关键词、分类、曲调筛选）
- 歌曲新增/编辑/删除（管理员权限）
- 分类新增/编辑/删除（管理员权限）
- 曲谱图片上传与管理（拖拽上传，最大 5MB）
- 曲谱曲调下拉选择（含降调）
- 管理员后台用户管理（超级管理员权限）
- 登录认证（账号密码）
- 普通用户账号（仅浏览，不可写）

---

## 技术栈

- **前端**：Next.js 15（App Router）、React 19、TypeScript、Tailwind CSS 4
- **后端**：Next.js Route Handlers（`src/app/api/**/route.ts`）
- **认证**：NextAuth v5（Credentials）
- **数据库**：SQLite + Prisma
- **文件存储**：本地文件系统（`uploads/sheets`）

---

## 角色与权限

### `super`（超级管理员）

- 拥有全部权限
- 可管理用户（创建/编辑/删除 `admin` 与 `viewer`）

### `admin`（管理员）

- 可管理业务数据（歌曲、分类、曲谱、上传）
- 不可管理用户账号

### `viewer`（普通用户）

- 仅可浏览歌曲与乐谱
- 不可新增/编辑/删除任何内容

---

## 项目结构（核心）

```text
src/
	app/
		(auth)/login/page.tsx              # 登录页
		(dashboard)/page.tsx               # 歌曲列表/筛选页
		(dashboard)/songs/**               # 歌曲详情与编辑页面
		(dashboard)/admins/page.tsx        # 用户管理页面（super）
		api/**/route.ts                    # 后端 API
	lib/
		auth.ts                            # NextAuth 配置
		prisma.ts                          # Prisma 客户端
		key-signatures.ts                  # 曲调选项与归一化
		roles.ts                           # 角色权限工具
prisma/
	schema.prisma                        # 数据模型
uploads/sheets/                        # 上传图片存储目录
```

---

## 快速开始

### 1) 克隆项目

```bash
git clone https://github.com/Xtbreak/Sheet-Music-Library.git
cd Sheet-Music-Library
```

### 2) 安装依赖

```bash
npm install
```

### 3) 配置环境变量

复制 `.env.example` 为 `.env`，并按需修改：

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
# 可选：HTTP 调试时设为 false；生产环境建议 true
SECURE_COOKIE="false"
```

> `NEXTAUTH_URL` 必须与实际访问地址一致。若你通过局域网 IP 访问（如 `http://192.168.x.x:3000`），这里也要写该 IP 地址。

### 4) 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

### 5) 启动开发服务

```bash
npm run dev
```

访问：`http://localhost:3000`

---

## 初始化账号

当数据库中没有任何用户时，可访问：

```text
http://localhost:3000/api/seed
```

默认超级管理员：

- 用户名：`admin`
- 密码：`admin123`

> 建议首次登录后立即修改密码。

---

## 曲调功能说明

- 曲谱支持设置曲调（如 `A调`、`降B调`）
- 不区分大小调（例如旧数据 `Am` 会归一化为 `A`）
- 歌曲列表可按曲调筛选，返回“包含该曲调任一乐谱”的歌曲

---

## 部署与命令

### 首次部署

```bash
npm install
# 安装项目依赖

npx prisma generate
# 根据 prisma/schema.prisma 生成 Prisma Client

npx prisma db push
# 同步数据库结构；首次运行会创建 SQLite 数据库文件

npm run build
# 构建生产版本

pm2 start npm --name music-demo -- start
# 用 PM2 启动生产服务，进程名为 music-demo

pm2 save
# 保存 PM2 进程列表，方便服务器重启后恢复
```

启动后访问 `/api/seed` 初始化默认超级管理员：

```text
http://你的域名或IP/api/seed
```

默认账号：

- 用户名：`admin`
- 密码：`admin123`

> 如果使用 `http://IP:3000` 访问，`.env` 中的 `NEXTAUTH_URL` 也要写成同一个地址。首次登录后请立即修改默认密码。

### 更新发布

```bash
git pull
# 拉取最新代码

npm install
# 安装或更新依赖

npx prisma generate
# 重新生成 Prisma Client，避免字段类型不同步

npx prisma db push
# 同步数据库结构

npm run build
# 重新构建生产版本

pm2 restart music-demo
# 重启已存在的 PM2 服务
```

如果 PM2 列表为空，或提示 `Process or Namespace music-demo not found`，先启动：

```bash
pm2 start npm --name music-demo -- start
# 首次用 PM2 启动生产服务

pm2 save
# 保存 PM2 进程列表
```

### 命令速查

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 本地开发 |
| `npm run build` | 生产构建 |
| `npm run start` | 直接启动生产服务 |
| `npm run lint` | 代码检查 |
| `npx prisma generate` | 生成 Prisma Client |
| `npx prisma db push` | 同步数据库结构 |
| `npx prisma studio` | 打开数据库可视化面板 |
| `pm2 start npm --name music-demo -- start` | 首次用 PM2 启动 |
| `pm2 restart music-demo` | 重启服务 |
| `pm2 stop music-demo` | 停止服务 |
| `pm2 logs music-demo` | 查看日志 |
| `pm2 save` | 保存 PM2 进程列表 |

---

## 常见问题

### 1) 登录成功但顶部仍显示未登录

通常是 `NEXTAUTH_URL` 与实际访问域名/IP 不一致，或 `SECURE_COOKIE` 设置不匹配当前 HTTP/HTTPS 环境。

### 2) 上传图片 404

请确认图片路径是否走：

- `/api/files/sheets/{filename}`

并检查文件是否实际存在于 `uploads/sheets/`。

### 3) 普通用户为什么看不到新增按钮

这是预期行为。`viewer` 仅浏览，不允许写操作。

---

## License

仅供学习与内部使用，请按你的团队规范补充正式许可证信息。
