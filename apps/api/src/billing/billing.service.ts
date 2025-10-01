import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import { User } from '@chimeralens/db';

// 假设我们把价格和点数的映射关系存在这里
const PRICE_TO_CREDITS_MAP = {
  price_1S8s4z5AZtVqRLhiywQF5cj3: 700,
  price_1S8s3U5AZtVqRLhiMpWdYhvU: 250,
  price_1S8s2h5AZtVqRLhicy7IarMX: 100,
};

@Injectable()
export class BillingService {
  private stripe: Stripe;
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(stripeSecretKey);
  }

  async createCheckoutSession(user: User, priceId: string) {
    const creditsToAdd = PRICE_TO_CREDITS_MAP[priceId];
    if (!creditsToAdd) {
      throw new Error('Invalid price ID');
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      // 用户支付成功或取消后，应该跳转回的页面
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/canceled`,
      // 将关键信息存入 metadata，以便 webhook 使用
      metadata: {
        userId: user.id,
        creditsToAdd: creditsToAdd.toString(),
      },
      payment_intent_data: {
        metadata: {
          userId: user.id,
          creditsToAdd: creditsToAdd.toString(),
        },
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  async getOrderHistory(userId: string) {
    return await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
