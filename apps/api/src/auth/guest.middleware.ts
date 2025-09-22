import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@chimeralens/db';
import { subHours } from 'date-fns';

export interface RequestWithUser extends Request {
  user?: Omit<User, 'password'> & { hasPassword?: boolean };
}

@Injectable()
export class GuestMiddleware implements NestMiddleware {
  private readonly logger = new Logger(GuestMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    const guestId = req.headers['x-guest-id'] as string;
    const fingerprint = req.headers['x-fingerprint'] as string;
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;

    // 场景1: 用户有 guestId，直接查找并返回
    if (guestId) {
      const user = await this.prisma.user.findUnique({ where: { guestId } });
      if (user) {
        req.user = { ...user, hasPassword: !!user.password };
        return next();
      }
    }

    // 场景2: 用户没有 guestId，但有设备指纹
    if (fingerprint) {
      const recentUserFromFingerprint = await this.prisma.user.findFirst({
        where: {
          fingerprint,
          isGuest: true,
          createdAt: { gte: subHours(new Date(), 24) },
        },
      });
      if (recentUserFromFingerprint) {
        this.logger.log(`Fingerprint matched existing guest user: ${recentUserFromFingerprint.id}`);
        req.user = { ...recentUserFromFingerprint, hasPassword: !!recentUserFromFingerprint.password };
        return next();
      }
    }

    // 场景3: 用户没有 guestId 和有效的指纹，回退到 IP 地址检查
    if (clientIp) {
      const recentUserFromIp = await this.prisma.user.findFirst({
        where: {
          createdIp: clientIp,
          isGuest: true,
          createdAt: { gte: subHours(new Date(), 24) },
        },
      });
      if (recentUserFromIp) {
        this.logger.log(`IP matched existing guest user: ${recentUserFromIp.id}`);
        req.user = { ...recentUserFromIp, hasPassword: !!recentUserFromIp.password };
        return next();
      }
    }

    // 场景4: 以上都未命中，创建全新的游客账户
    this.logger.log(`Creating new guest user. IP: ${clientIp}, Fingerprint: ${fingerprint}`);
    const newGuest = await this.prisma.user.create({
      data: {
        guestId: `guest_${Date.now()}`,
        isGuest: true,
        credits: 10,
        createdIp: clientIp,
        fingerprint: fingerprint,
      },
    });

    req.user = { ...newGuest, hasPassword: !!newGuest.password };
    next();
  }
}
