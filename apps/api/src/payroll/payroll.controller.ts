import { Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { PayrollService } from './payroll.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser, CompanyId, JwtPayload } from '../common/decorators';

@Controller('payroll')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PayrollController {
  constructor(private payroll: PayrollService) {}

  @Post('calculate')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async calculate(
    @CompanyId() companyId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return { success: true, data: await this.payroll.calculate(companyId, y, m) };
  }

  @Get('my-summary')
  @Roles(UserRole.EMPLOYEE)
  async mySummary(
    @CurrentUser() user: JwtPayload,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return {
      success: true,
      data: await this.payroll.getEmployeeSummary(user.employeeId!, y, m),
    };
  }

  @Get('export/excel')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async exportExcel(
    @CompanyId() companyId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const buffer = await this.payroll.exportExcel(
      companyId,
      parseInt(year) || new Date().getFullYear(),
      parseInt(month) || new Date().getMonth() + 1,
    );
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=bordro.xlsx');
    res.send(Buffer.from(buffer));
  }

  @Get('export/pdf')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async exportPdf(
    @CompanyId() companyId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const buffer = await this.payroll.exportPdf(
      companyId,
      parseInt(year) || new Date().getFullYear(),
      parseInt(month) || new Date().getMonth() + 1,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=bordro.pdf');
    res.send(buffer);
  }
}
