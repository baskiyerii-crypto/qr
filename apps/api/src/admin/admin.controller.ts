import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ResellersService } from '../resellers/resellers.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';
import {
  createResellerSchema,
  createMarketerSchema,
  updateMarketerSchema,
  platformSettingsSchema,
  integrationsSettingsSchema,
  adminCompanyPatchSchema,
  adminResellerPatchSchema,
  createSuperAdminSchema,
  adminSubscriptionPatchSchema,
} from '@qr/shared';
import { AdminPlatformService } from './admin-platform.service';
import { MarketersService } from '../marketers/marketers.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(
    private resellers: ResellersService,
    private platform: AdminPlatformService,
    private marketers: MarketersService,
  ) {}

  @Get('overview')
  async overview() {
    return { success: true, data: await this.platform.getOverview() };
  }

  @Get('marketers')
  async listMarketers() {
    return { success: true, data: await this.marketers.listAll() };
  }

  @Get('marketers/:id')
  async getMarketer(@Param('id') id: string) {
    return { success: true, data: await this.marketers.getById(id) };
  }

  @Post('marketers')
  async createMarketer(@Body() body: unknown) {
    const dto = createMarketerSchema.parse(body);
    return { success: true, data: await this.marketers.createMarketer(dto) };
  }

  @Patch('marketers/:id')
  async updateMarketer(@Param('id') id: string, @Body() body: unknown) {
    const dto = updateMarketerSchema.parse(body);
    return { success: true, data: await this.marketers.update(id, dto) };
  }

  @Get('resellers')
  async listResellers() {
    return { success: true, data: await this.resellers.listAll() };
  }

  @Get('resellers/:id')
  async getReseller(@Param('id') id: string) {
    return { success: true, data: await this.platform.getReseller(id) };
  }

  @Post('resellers')
  async createReseller(@Body() body: unknown) {
    const dto = createResellerSchema.parse(body);
    return { success: true, data: await this.resellers.createReseller(dto) };
  }

  @Patch('resellers/:id')
  async updateReseller(@Param('id') id: string, @Body() body: unknown) {
    const dto = adminResellerPatchSchema.parse(body);
    return { success: true, data: await this.platform.updateReseller(id, dto) };
  }

  @Patch('resellers/:id/commission')
  async updateCommission(
    @Param('id') id: string,
    @Body('commissionRate') commissionRate: number,
  ) {
    return { success: true, data: await this.resellers.updateCommission(id, commissionRate) };
  }

  @Get('settings')
  async getSettings() {
    return { success: true, data: await this.platform.getSettings() };
  }

  @Patch('settings')
  async updateSettings(@Body() body: unknown) {
    const dto = platformSettingsSchema.parse(body);
    const data = await this.platform.updateSettings(dto);
    return { success: true, data };
  }

  @Get('settings/integrations')
  async getIntegrations() {
    return { success: true, data: await this.platform.getIntegrations() };
  }

  @Patch('settings/integrations')
  async updateIntegrations(@Body() body: unknown) {
    const dto = integrationsSettingsSchema.parse(body);
    const data = await this.platform.updateIntegrations(dto);
    return { success: true, data };
  }

  @Get('companies')
  async listCompanies() {
    return { success: true, data: await this.platform.listCompanies() };
  }

  @Get('companies/:id')
  async getCompany(@Param('id') id: string) {
    return { success: true, data: await this.platform.getCompany(id) };
  }

  @Patch('companies/:id')
  async updateCompany(@Param('id') id: string, @Body() body: unknown) {
    const dto = adminCompanyPatchSchema.parse(body);
    return { success: true, data: await this.platform.updateCompany(id, dto) };
  }

  @Get('subscriptions')
  async listSubscriptions() {
    return { success: true, data: await this.platform.listSubscriptions() };
  }

  @Patch('subscriptions/:id')
  async updateSubscription(@Param('id') id: string, @Body() body: unknown) {
    const dto = adminSubscriptionPatchSchema.parse(body);
    return { success: true, data: await this.platform.updateSubscription(id, dto) };
  }

  @Get('payments')
  async listPayments(
    @Query('status') status?: string,
    @Query('resellerId') resellerId?: string,
    @Query('companyId') companyId?: string,
  ) {
    return {
      success: true,
      data: await this.platform.listPayments({ status, resellerId, companyId }),
    };
  }

  @Get('commissions/summary')
  async commissionSummary() {
    return { success: true, data: await this.platform.getCommissionSummary() };
  }

  @Get('users')
  async listUsers() {
    return { success: true, data: await this.platform.listSuperAdmins() };
  }

  @Post('users')
  async createUser(@Body() body: unknown) {
    const dto = createSuperAdminSchema.parse(body);
    return { success: true, data: await this.platform.createSuperAdmin(dto) };
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: { isActive?: boolean }) {
    return { success: true, data: await this.platform.updateSuperAdmin(id, body) };
  }

  @Get('activity-log')
  async activityLog() {
    return { success: true, data: await this.platform.getActivityLog() };
  }
}
