import { Controller, Get, Post, Query, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { TimesheetsService } from './timesheets.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser, CompanyId, JwtPayload, BranchScopeParam, BranchScope } from '../common/decorators';

@Controller('timesheets')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TimesheetsController {
  constructor(private timesheets: TimesheetsService) {}

  @Get('my')
  @Roles(UserRole.EMPLOYEE)
  async my(
    @CurrentUser() user: JwtPayload,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return {
      success: true,
      data: await this.timesheets.getSummary(user.employeeId!, y, m),
    };
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER)
  async company(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return {
      success: true,
      data: await this.timesheets.getCompanyTimesheet(companyId, y, m, scope),
    };
  }

  @Post('calculate/:employeeId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async calculate(
    @Param('employeeId') employeeId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return {
      success: true,
      data: await this.timesheets.calculateForEmployee(employeeId, y, m),
    };
  }
}
