import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser, CompanyId, JwtPayload, BranchScopeParam, BranchScope } from '../common/decorators';
import { checkInSchema } from '@qr/shared';

@Controller('attendance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AttendanceController {
  constructor(private attendance: AttendanceService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('check')
  @Roles(UserRole.EMPLOYEE)
  async check(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    if (!user.employeeId || !user.companyId) {
      return { success: false, error: 'Personel hesabı gerekli' };
    }
    const dto = checkInSchema.parse(body);
    return {
      success: true,
      data: await this.attendance.checkInOut(
        user.employeeId,
        user.companyId,
        user.sub,
        dto,
      ),
    };
  }

  @Get('my')
  @Roles(UserRole.EMPLOYEE)
  async myRecords(
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return {
      success: true,
      data: await this.attendance.getMyRecords(user.employeeId!, from, to),
    };
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER)
  async list(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Query('date') date?: string,
  ) {
    return { success: true, data: await this.attendance.listByCompany(companyId, date, scope) };
  }

  @Get('pending-approvals')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER)
  async pendingApprovals(@CompanyId() companyId: string, @BranchScopeParam() scope: BranchScope) {
    return { success: true, data: await this.attendance.listPendingApprovals(companyId, scope) };
  }

  @Patch(':id/review')
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
      data: await this.attendance.reviewRecord(companyId, id, user.sub, body.approve, body.note, scope),
    };
  }

  @Post('manual')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async manual(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      employeeId: string;
      branchId: string;
      type: 'CHECK_IN' | 'CHECK_OUT' | 'MEAL_START' | 'MEAL_END';
      timestamp: string;
      reason: string;
    },
  ) {
    return {
      success: true,
      data: await this.attendance.manualAdjust(companyId, user.sub, body),
    };
  }
}
