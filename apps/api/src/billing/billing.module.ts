import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { StripeWebhookController } from '../billing/stripe.webhook.controller';
import { StripeWebhookService } from '../billing/stripe.webhook.service';

@Module({
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService, StripeWebhookService],
})
export class BillingModule {}
