import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { BillingService } from './billing.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CompanyId } from '../common/decorators';
import { subscriptionPlanSchema, commissionPayoutConfigSchema, updateSubscriptionPlanSchema } from '@qr/shared';

@Controller('billing')
export class BillingController {
  constructor(private billing: BillingService) {}

  @Get('plans')
  async listPlans() {
    return { success: true, data: await this.billing.listPlans() };
  }

  @Post('checkout')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN)
  async checkout(@CompanyId() companyId: string, @Body('planId') planId: string) {
    return { success: true, data: await this.billing.startCheckout(companyId, planId) };
  }

  @Get('subscription')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async subscription(@CompanyId() companyId: string) {
    return { success: true, data: await this.billing.getCompanySubscription(companyId) };
  }

  @Post('iyzico/callback')
  async iyzicoCallback(@Body('token') token: string, @Res() res: Response) {
    const result = await this.billing.handleCallback(token);
    const redirectUrl = await this.billing.getPaymentRedirectUrl(result.ok);
    res.redirect(redirectUrl);
  }
}

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminBillingController {
  constructor(private billing: BillingService) {}

  @Get('subscription-plans')
  async listPlans() {
    return { success: true, data: await this.billing.listAllPlans() };
  }

  @Post('subscription-plans')
  async createPlan(@Body() body: unknown) {
    const dto = subscriptionPlanSchema.parse(body);
    return { success: true, data: await this.billing.createPlan(dto) };
  }

  @Patch('subscription-plans/:id')
  async updatePlan(@Param('id') id: string, @Body() body: unknown) {
    const dto = updateSubscriptionPlanSchema.parse(body);
    return { success: true, data: await this.billing.updatePlan(id, dto) };
  }

  @Get('payout-config')
  async getPayoutConfig() {
    return { success: true, data: await this.billing.getPayoutConfig() };
  }

  @Patch('payout-config')
  async updatePayoutConfig(@Body() body: unknown) {
    const dto = commissionPayoutConfigSchema.parse(body);
    return { success: true, data: await this.billing.updatePayoutConfig(dto) };
  }
}
