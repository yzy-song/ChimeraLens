import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookService {
  private stripe: Stripe;
  private webhookSecret: string;
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(stripeSecretKey);
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
  }

  // 验证逻辑被封装在 Service 中
  constructEventFromPayload(signature: string, payload: Buffer): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }

  async handleCheckoutSessionCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, creditsToAdd } = session.metadata;

    if (!userId || !creditsToAdd) {
      this.logger.error('Webhook received without userId or creditsToAdd in metadata', session.metadata);
      return;
    }

    const credits = parseInt(creditsToAdd, 10);
    const amount = session.amount_total;

    this.logger.log(`Payment successful for user ${userId}. Adding ${creditsToAdd} credits.`);

    await this.prisma.$transaction([
      // 1. 增加用户点数
      this.prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: credits } },
      }),
      // 2. 创建订单记录
      this.prisma.order.create({
        data: {
          userId,
          credits,
          amount,
          currency: session.currency,
          stripeCheckoutId: session.id,
        },
      }),
    ]);
  }

  async handleChargeRefunded(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) return;

    // 通过 paymentIntentId 找到对应的 paymentIntent 以获取 metadata
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId); // 你需要把 stripe 实例传入或在这里创建
    const { userId, creditsToAdd } = paymentIntent.metadata;

    if (!userId || !creditsToAdd) {
      this.logger.error(
        `Refund webhook received without userId or creditsToAdd in PI metadata`,
        paymentIntent.metadata,
      );
      return;
    }

    const credits = parseInt(creditsToAdd, 10);
    this.logger.log(`Refunding ${creditsToAdd} credits from user ${userId}`);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { credits: { decrement: credits } },
      }),
      // TODO可以在这里更新订单状态为 "REFUNDED"
    ]);
  }
}
