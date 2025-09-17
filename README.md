项目 chimeralens 核心命令清单
第一阶段：项目初始化与 Monorepo 环境搭建
这些命令用于创建项目骨架和配置 pnpm Workspace。

Bash

# 1. 创建项目目录并初始化 Git

mkdir chimeralens && cd chimeralens
git init

# 2. 初始化 pnpm Workspace (需手动创建 pnpm-workspace.yaml 文件)

pnpm init -y

# 3. 创建核心目录结构

mkdir apps packages

# 4. 安装并引入 Turborepo 管理工具

pnpm add turbo --save-dev -w
第二阶段：初始化后端 NestJS 应用 (api)
这些命令用于在 apps 目录中创建和配置 NestJS 后端。

Bash

# 1. 使用 NestJS CLI 创建新应用 (在项目根目录运行)

pnpm dlx @nestjs/cli new apps/api

# 2. (可选) 清理嵌套的 .git 目录

rm -rf apps/api/.git

# 3. 运行后端开发服务器 (用于测试)

pnpm dev --filter=@chimeralens/api

# 4. 运行后端构建命令 (用于排错和生产打包)

pnpm build --filter=@chimeralens/api
第三阶段：初始化前端 Next.js 应用 (web)
这些命令用于在 apps 目录中创建和配置 Next.js 前端。

Bash

# 1. 使用 Next.js 脚手架创建新应用 (在项目根目录运行)

pnpm create next-app apps/web

# 2. (可选) 清理嵌套的 .git 目录

rm -rf apps/web/.git

# 3. 运行前端开发服务器 (用于测试)

pnpm dev --filter=@chimeralens/web

# 4. (常用) 同时运行前后端两个应用的开发服务器

pnpm dev
第四阶段：数据库与共享包 (db) 的搭建
这些命令用于创建管理数据库的共享包 @chimeralens/db。

Bash

# 1. 创建共享包目录

mkdir packages/db

# 2. 为 db 包安装 Prisma 依赖 (在项目根目录运行)

pnpm add -D prisma --filter @chimeralens/db
pnpm add @prisma/client --filter @chimeralens/db

# 3. 初始化 Prisma (指定使用 PostgreSQL)

pnpm -F @chimeralens/db exec prisma init --datasource-provider postgresql

# 4. 将 Schema 定义推送到数据库以创建数据表

pnpm -F @chimeralens/db db:push

# 5. 生成类型安全的 Prisma Client

pnpm -F @chimeralens/db build
