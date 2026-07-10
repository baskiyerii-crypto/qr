import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ResellersService } from './resellers.service';
import { BillingService } from '../billing/billing.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser, JwtPayload } from '../common/decorators';
import { createResellerCustomerSchema } from '@qr/shared';

@Controller('reseller')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.RESELLER)
export class ResellersController {
  constructor(
    private resellers: ResellersService,
    private billing: BillingService,
    private analyticsService: AnalyticsService,
  ) {}

  @Get('dashboard')
  async dashboard(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.resellers.getDashboard(user.resellerId!) };
  }

  @Get('analytics')
  async analytics(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.analyticsService.getResellerAnalytics(user.resellerId!) };
  }

  @Get('payments')
  async payments(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.billing.getResellerPayments(user.resellerId!) };
  }

  @Post('companies')
  async createCompany(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = createResellerCustomerSchema.parse(body);
    return { success: true, data: await this.resellers.createCustomer(user.resellerId!, dto) };
  }

  @Get('companies/:id')
  async companyDetail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return {
      success: true,
      data: await this.resellers.getCompanyDetail(user.resellerId!, id),
    };
  }

  @Get('companies/:id/qr')
  async companyQr(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return { success: true, data: await this.resellers.getCompanyQr(user.resellerId!, id) };
  }

  @Get('companies/:id/performance')
  async companyPerformance(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return { success: true, data: await this.resellers.getCompanyPerformance(user.resellerId!, id) };
  }
}
