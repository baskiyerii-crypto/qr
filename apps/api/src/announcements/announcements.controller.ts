import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { AnnouncementsService } from './announcements.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser, CompanyId, JwtPayload } from '../common/decorators';
import { createAnnouncementSchema } from '@qr/shared';

@Controller('announcements')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AnnouncementsController {
  constructor(private announcements: AnnouncementsService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.BRANCH_MANAGER, UserRole.REGIONAL_MANAGER)
  async create(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
  ) {
    const dto = createAnnouncementSchema.parse(body);
    return {
      success: true,
      data: await this.announcements.create(companyId, user.sub, dto),
    };
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.BRANCH_MANAGER)
  async list(@CompanyId() companyId: string) {
    return { success: true, data: await this.announcements.list(companyId) };
  }

  @Get('my')
  @Roles(UserRole.EMPLOYEE)
  async my(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.announcements.myAnnouncements(user.employeeId!) };
  }

  @Get(':id/stats')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.BRANCH_MANAGER)
  async stats(@CompanyId() companyId: string, @Param('id') id: string) {
    return { success: true, data: await this.announcements.getReadStats(id, companyId) };
  }

  @Post(':id/read')
  @Roles(UserRole.EMPLOYEE)
  async read(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('acknowledge') acknowledge?: boolean,
  ) {
    return {
      success: true,
      data: await this.announcements.markRead(id, user.employeeId!, acknowledge),
    };
  }
}
