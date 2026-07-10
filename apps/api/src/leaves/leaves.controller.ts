import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole, LeaveStatus } from '@prisma/client';
import { LeavesService } from './leaves.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser, CompanyId, JwtPayload, BranchScopeParam, BranchScope } from '../common/decorators';
import { createLeaveSchema } from '@qr/shared';

@Controller('leaves')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LeavesController {
  constructor(private leaves: LeavesService) {}

  @Post()
  @Roles(UserRole.EMPLOYEE)
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = createLeaveSchema.parse(body);
    return {
      success: true,
      data: await this.leaves.create(user.employeeId!, user.companyId!, dto),
    };
  }

  @Get('my')
  @Roles(UserRole.EMPLOYEE)
  async my(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.leaves.myLeaves(user.employeeId!) };
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER)
  async list(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Query('status') status?: LeaveStatus,
  ) {
    return { success: true, data: await this.leaves.list(companyId, status, scope) };
  }

  @Post(':id/review')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER)
  async review(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @BranchScopeParam() scope: BranchScope,
    @Param('id') id: string,
    @Body() body: { approve: boolean; note?: string },
  ) {
    return {
      success: true,
      data: await this.leaves.review(companyId, id, user.sub, body.approve, body.note, scope),
    };
  }
}
