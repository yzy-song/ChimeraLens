# ChimeraLens AI

**Transform your photos into stunning, stylized portraits with a single click. ChimeraLens is a full-stack AI face-swapping application that allows you to blend your face with artistic templates.**

This project is a monorepo built with a modern tech stack, showcasing a complete workflow from user authentication and payment processing to AI image generation and gallery management.

![ChimeraLens Demo](https://res.cloudinary.com/deaxv6w30/image/upload/v1758833446/Gemini_Generated_Image_n1rtbpn1rtbpn1rt_hyaw8k.png)

## ✨ Core Features

- **AI-Powered Face Swapping**: Upload your photo, choose a style from our curated templates, and let the AI work its magic.
- **Guest & Registered Users**: Try the app without an account. Sign up to save your creations and manage your profile.
- **Social & Email Login**: Quick and easy authentication using Google or traditional email and password.
- **Credit System**: Start with free credits and purchase more through our secure Stripe integration to continue creating.
- **Personal Gallery**: All your creations are saved in a personal, paginated gallery where you can view, download, or delete them.
- **Intelligent Face Detection**: The app automatically detects faces in your uploaded photos. If multiple faces are found, you can select which one to use.
- **Image Optimization**: Images are compressed and optimized for speed and quality before being sent to the AI model.
- **Responsive Design**: A beautiful and intuitive interface that works seamlessly on both desktop and mobile devices.

## 🚀 The Development Journey & My Thought Process

This project started as an exploration into the exciting world of generative AI. I wanted to build a complete, production-ready application that was more than just a simple demo. My goal was to tackle real-world challenges like user management, payments, and robust backend architecture.

### Phase 1: Foundation & Monorepo

I chose a **monorepo architecture** using **pnpm Workspaces** and **Turborepo**. This setup allows for clean separation of concerns (`apps/web`, `apps/api`) while enabling code sharing (`packages/db`) and unified build/dev commands. It's a scalable approach that keeps the codebase organized.

### Phase 2: Building the Backend with NestJS

For the backend, I selected **NestJS** for its powerful, modular architecture and first-class TypeScript support. Key backend features were built incrementally:

- **Database & Prisma**: I used **PostgreSQL** with **Prisma** as the ORM. Prisma's type-safe client, which is shared across the monorepo, is a game-changer for full-stack development.
- **Authentication**: A flexible auth system was a priority. It supports both JWT-based email/password login and Firebase for Google social sign-in. A crucial piece is the **"guest" middleware**, which uses device fingerprinting to provide a seamless experience for first-time users.
- **AI Integration**: The core of the app. I created an abstraction layer (`AiProvider`) to decouple the application from a specific AI service. Currently, it uses the **Replicate API**, with a robust polling mechanism to handle long-running AI tasks without request timeouts.
- **Payments**: **Stripe** was integrated for credit purchases. The system uses Stripe Checkout for a secure payment flow and **webhooks** to automatically update user credits upon successful payment.

### Phase 3: Crafting the Frontend with Next.js

The frontend is built with **Next.js (App Router)**, offering a great developer experience and performance.

- **UI/UX**: I used **Tailwind CSS** and **shadcn/ui** to build a modern, responsive, and aesthetically pleasing interface. The focus was on creating an intuitive user flow: select a template, upload a photo, and generate.
- **State Management**: For client-side state, I used a combination of **React Query (TanStack Query)** for server state caching and **Zustand** for managing global UI state (like modals).
- **Client-Side Intelligence**: To improve performance and success rates, I integrated **MediaPipe** for client-side face detection. This allows the user to select a face _before_ uploading, and the backend can crop the image precisely.

## 🛠️ Tech Stack

- **Monorepo**: pnpm Workspaces, Turborepo
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, React Query, Zustand
- **Backend**: NestJS, TypeScript, PostgreSQL, Prisma
- **AI**: Replicate API
- **Image Storage**: Cloudinary
- **Authentication**: JWT, Firebase Authentication
- **Payments**: Stripe
- **Deployment**: Vercel (Frontend), Render (Backend)

## 📦 Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm
- PostgreSQL database

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/your-username/chimeralens.git](https://github.com/your-username/chimeralens.git)
    cd chimeralens
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**

    - Create a `.env` file in the root of the `apps/api` directory.
    - Create a `.env.local` file in the root of the `apps/web` directory.
    - Populate them based on the `.env.example` files (you'll need to create these). Key variables include database URL, JWT secret, and API keys for Replicate, Cloudinary, Stripe, etc.

4.  **Push database schema:**

    ```bash
    pnpm -F @chimeralens/db db:push
    ```

5.  **Run the development servers:**

    ```bash
    pnpm dev
    ```

    - The Next.js frontend will be available at `http://localhost:3001`.
    - The NestJS backend will be available at `http://localhost:3000`.

## 🔮 Future Improvements

This project is a solid MVP, but there's always room to grow.

---

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
