import { PrismaClient } from "@prisma/client";

// 导出一个 PrismaClient 实例，供应用使用
export const prisma = new PrismaClient();

// 重新导出所有由 Prisma 生成的类型
export * from "@prisma/client";
