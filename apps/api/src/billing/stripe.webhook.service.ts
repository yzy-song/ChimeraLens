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

    this.logger.log(`Payment successful for user ${userId}. Adding ${creditsToAdd} credits.`);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: parseInt(creditsToAdd, 10),
        },
      },
    });
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

    this.logger.log(`Refunding ${creditsToAdd} credits from user ${userId}`);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: parseInt(creditsToAdd, 10), // 扣除点数
        },
      },
    });
  }
}
