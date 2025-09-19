import { Controller, Post, Headers, Req } from '@nestjs/common';
import { StripeWebhookService } from './stripe.webhook.service';
import type { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiCommonResponses } from 'src/common/decorators/api-common-responses.decorator';

@ApiTags('Billing')
@Controller('billing/webhooks')
export class StripeWebhookController {
  constructor(private readonly webhookService: StripeWebhookService) {}

  @Post('stripe')
  @ApiOperation({ summary: 'Handle Stripe Webhook Events' })
  @ApiCommonResponses()
  async handleStripeWebhook(@Headers('stripe-signature') signature: string, @Req() req: Request) {
    const event = this.webhookService.constructEventFromPayload(signature, req.body as Buffer);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.webhookService.handleCheckoutSessionCompleted(event);
        break;
      case 'charge.refunded':
        await this.webhookService.handleChargeRefunded(event);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }
}
