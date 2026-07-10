import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { ReportsService } from './reports.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CompanyId, BranchScopeParam, BranchScope } from '../common/decorators';

const MANAGER_ROLES = [
  UserRole.COMPANY_ADMIN,
  UserRole.HR_MANAGER,
  UserRole.REGIONAL_MANAGER,
  UserRole.BRANCH_MANAGER,
];

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('branches')
  @Roles(...MANAGER_ROLES)
  async branches(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const y = parseInt(year ?? '', 10) || new Date().getFullYear();
    const m = parseInt(month ?? '', 10) || new Date().getMonth() + 1;
    return { success: true, data: await this.reports.getBranchComparison(companyId, y, m, scope) };
  }

  @Get('branches/export')
  @Roles(...MANAGER_ROLES)
  async exportBranches(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Res() res: Response,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const y = parseInt(year ?? '', 10) || new Date().getFullYear();
    const m = parseInt(month ?? '', 10) || new Date().getMonth() + 1;
    const buffer = await this.reports.exportBranchComparisonExcel(companyId, y, m, scope);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=sube-karsilastirma.xlsx');
    res.send(Buffer.from(buffer));
  }

  @Get('absence-alerts')
  @Roles(...MANAGER_ROLES)
  async absenceAlerts(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
  ) {
    return { success: true, data: await this.reports.getAbsenceAlerts(companyId, scope) };
  }

  @Post('absence-alerts/run')
  @Roles(UserRole.COMPANY_ADMIN)
  async runAbsence() {
    await this.reports.runDailyAbsenceCheck();
    return { success: true };
  }
}
