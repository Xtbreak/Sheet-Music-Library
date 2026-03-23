# Music Demo

一个基于 Next.js 的音乐管理应用，包含歌曲管理、分类管理、乐谱上传等功能。

## 技术栈

- **框架**: Next.js 15
- **数据库**: SQLite (Prisma ORM)
- **认证**: NextAuth
- **样式**: Tailwind CSS
- **语言**: TypeScript

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd music-demo
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，修改 `NEXTAUTH_SECRET` 为你自己的密钥（可通过 `openssl rand -base64 32` 生成）。

### 4. 初始化数据库

```bash
npx prisma db push
```

### 5. 创建管理员

启动服务后，在浏览器中访问以下地址创建初始管理员（仅限首次）：

```
http://localhost:3000/api/seed
```

默认账号：`admin` / `admin123`，登录后请立即修改密码。

> 此接口仅在数据库中没有任何管理员时可用，创建一次后自动失效。

### 6. 启动服务

**开发模式：**

```bash
npm run dev
```

**生产模式（PM2）：**

```bash
npm run build
# 方式一：使用 ecosystem.config.js（可自定义内存限制、自动重启等参数）
pm2 start ecosystem.config.js
# 方式二：直接使用 package.json
pm2 start package.json
```

后续管理：`pm2 restart music-demo` / `pm2 stop music-demo` / `pm2 logs music-demo`

打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

## 上传文件存储

用户上传的曲谱图片存储在 `uploads/sheets/` 目录中，通过 API 路由 `/api/files/sheets/{filename}` 提供访问。首次部署后该目录会由上传接口自动创建。

> `uploads/` 已在 `.gitignore` 中排除，上传的文件不会被提交到 Git。

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 运行代码检查 |
| `npx prisma db push` | 同步数据库结构 |
| `npx prisma studio` | 打开数据库管理面板 |
| `pm2 start ecosystem.config.js` | PM2 启动（推荐，支持自定义参数） |
| `pm2 start package.json` | PM2 启动（简洁方式） |
| `pm2 restart music-demo` | PM2 重启 |
| `pm2 stop music-demo` | PM2 停止 |
| `pm2 logs music-demo` | PM2 查看日志 |
