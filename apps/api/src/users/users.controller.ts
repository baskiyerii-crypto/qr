import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CompanyId, CurrentUser, JwtPayload } from '../common/decorators';
import { createStaffUserSchema, assignBranchesSchema } from '@qr/shared';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.COMPANY_ADMIN)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  async list(@CompanyId() companyId: string) {
    return { success: true, data: await this.users.listStaff(companyId) };
  }

  @Post()
  async create(
    @CompanyId() companyId: string,
    @CurrentUser() actor: JwtPayload,
    @Body() body: unknown,
  ) {
    const dto = createStaffUserSchema.parse(body);
    return { success: true, data: await this.users.createStaff(companyId, dto, actor.sub) };
  }

  @Patch(':id/password')
  async resetPassword(
    @CompanyId() companyId: string,
    @CurrentUser() actor: JwtPayload,
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    return { success: true, data: await this.users.resetPassword(companyId, id, password, actor.sub) };
  }

  @Patch(':id/active')
  async setActive(
    @CompanyId() companyId: string,
    @CurrentUser() actor: JwtPayload,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return { success: true, data: await this.users.setActive(companyId, id, isActive, actor.sub) };
  }

  @Patch(':id/branches')
  async assignBranches(
    @CompanyId() companyId: string,
    @CurrentUser() actor: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = assignBranchesSchema.parse(body);
    return {
      success: true,
      data: await this.users.assignBranches(companyId, id, dto.branchIds, actor.sub),
    };
  }
}
