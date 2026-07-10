import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { MarketersService } from './marketers.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser, JwtPayload } from '../common/decorators';
import { createMarketerResellerSchema, createMarketerCustomerSchema } from '@qr/shared';

@Controller('marketer')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.MARKETER)
export class MarketersController {
  constructor(
    private marketers: MarketersService,
    private analytics: AnalyticsService,
  ) {}

  @Get('dashboard')
  async dashboard(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.marketers.getDashboard(user.marketerId!) };
  }

  @Get('analytics')
  async analyticsEndpoint(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.analytics.getMarketerAnalytics(user.marketerId!) };
  }

  @Get('payments')
  async payments(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.marketers.getPayments(user.marketerId!) };
  }

  @Get('resellers')
  async resellers(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.marketers.listResellers(user.marketerId!) };
  }

  @Post('resellers')
  async createReseller(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = createMarketerResellerSchema.parse(body);
    return { success: true, data: await this.marketers.createReseller(user.marketerId!, dto) };
  }

  @Post('companies')
  async createCompany(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = createMarketerCustomerSchema.parse(body);
    return { success: true, data: await this.marketers.createCustomer(user.marketerId!, dto) };
  }

  @Get('companies/:id')
  async companyDetail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return { success: true, data: await this.marketers.getCompanyDetail(user.marketerId!, id) };
  }

  @Get('companies/:id/qr')
  async companyQr(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return { success: true, data: await this.marketers.getCompanyQr(user.marketerId!, id) };
  }
}
