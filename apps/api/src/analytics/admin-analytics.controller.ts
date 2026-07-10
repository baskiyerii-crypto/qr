import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminAnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('hierarchy')
  async hierarchy() {
    return { success: true, data: await this.analytics.getAdminHierarchy() };
  }

  @Get('analytics/resellers')
  async resellerAnalytics() {
    return { success: true, data: await this.analytics.getAdminResellerAnalytics() };
  }
}
