import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { DevicesService } from './devices.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CompanyId } from '../common/decorators';

@Controller('devices')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
export class DevicesController {
  constructor(private devices: DevicesService) {}

  @Get('pending')
  async pending(@CompanyId() companyId: string) {
    return { success: true, data: await this.devices.listPending(companyId) };
  }

  @Post(':id/review')
  async review(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @Body('approve') approve: boolean,
  ) {
    return { success: true, data: await this.devices.approve(companyId, id, approve) };
  }
}
