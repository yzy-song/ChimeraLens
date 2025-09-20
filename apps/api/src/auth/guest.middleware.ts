import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@chimeralens/db';

// Extend Express Request type to include our user object shape
export interface RequestWithUser extends Request {
  user?: Omit<User, 'password'> & { hasPassword: boolean };
}

@Injectable()
export class GuestMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger: Logger = new Logger(GuestMiddleware.name);

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    const guestId = req.headers['x-guest-id'] as string;

    if (!guestId) {
      return next();
    }

    let user = await this.prisma.user.findUnique({
      where: { guestId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          guestId: guestId,
          isGuest: true,
          credits: 10, // Initial credits
        },
      });
    }

    // Attach user info without password, but with the hasPassword flag
    req.user = {
      ...user,
      hasPassword: !!user.password,
    };

    this.logger.log(`Guest user identified: ${user.id} (hasPassword: ${!!user.password})`);
    next();
  }
}
