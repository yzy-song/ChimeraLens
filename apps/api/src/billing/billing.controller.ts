import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { BillingService } from './billing.service';
import { AuthGuard } from '@nestjs/passport';
import { User as UserModel } from '@chimeralens/db';

import { User } from 'src/auth/decorators/user.decorator';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { ApiCommonResponses } from 'src/common/decorators/api-common-responses.decorator';

@ApiTags('Billing')
@Controller('billing')
@UseGuards(AuthGuard('jwt'))
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Create Stripe Checkout Session' })
  @ApiResponse({ status: 200, description: 'Checkout session created successfully.' })
  @ApiCommonResponses()
  createCheckoutSession(@User() user: UserModel, @Body('priceId') priceId: string) {
    return this.billingService.createCheckoutSession(user, priceId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user order history' })
  @ApiResponse({ status: 200, description: 'Returns the list of orders.' })
  @ApiCommonResponses()
  getOrderHistory(@User('id') userId: string) {
    return this.billingService.getOrderHistory(userId);
  }
}
