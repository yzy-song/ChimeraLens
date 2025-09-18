import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@chimeralens/db';

// 扩展 Express 的 Request 类型，以便我们可以附加 user 对象
export interface RequestWithUser extends Request {
  user?: User;
}

@Injectable()
export class GuestMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    const guestId = req.headers['x-guest-id'] as string;

    if (!guestId) {
      // 如果前端没有提供 guestId，我们无法识别游客，直接进入下一步
      return next();
    }

    let user = await this.prisma.user.findUnique({
      where: { guestId },
    });

    if (!user) {
      // 如果数据库中没有这个 guestId，就创建一个新的游客用户
      user = await this.prisma.user.create({
        data: {
          guestId: guestId,
          isGuest: true,
          credits: 10, // 初始赠送10个点数
        },
      });
    }

    // 将找到的或新创建的用户信息附加到请求对象上
    req.user = user;

    next();
  }
}
