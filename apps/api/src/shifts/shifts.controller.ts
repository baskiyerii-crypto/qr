import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ShiftsService } from './shifts.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CompanyId, BranchScopeParam, BranchScope } from '../common/decorators';
import { shiftTemplateSchema, assignShiftSchema } from '@qr/shared';

@Controller('shifts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ShiftsController {
  constructor(private shifts: ShiftsService) {}

  @Get('templates')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER)
  async listTemplates(@CompanyId() companyId: string) {
    return { success: true, data: await this.shifts.listTemplates(companyId) };
  }

  @Post('templates')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async createTemplate(@CompanyId() companyId: string, @Body() body: unknown) {
    const dto = shiftTemplateSchema.parse(body);
    return { success: true, data: await this.shifts.createTemplate(companyId, dto) };
  }

  @Get('assignments')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER)
  async listAssignments(@CompanyId() companyId: string, @BranchScopeParam() scope: BranchScope) {
    return { success: true, data: await this.shifts.listCompanyAssignments(companyId, scope) };
  }

  @Post('assign/:employeeId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async assign(
    @CompanyId() companyId: string,
    @Param('employeeId') employeeId: string,
    @Body() body: unknown,
  ) {
    const dto = assignShiftSchema.parse(body);
    return {
      success: true,
      data: await this.shifts.assignToEmployee(companyId, employeeId, dto.shiftTemplateIds),
    };
  }

  @Get('employee/:employeeId')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER)
  async employeeShifts(
    @CompanyId() companyId: string,
    @Param('employeeId') employeeId: string,
  ) {
    return { success: true, data: await this.shifts.getEmployeeShifts(companyId, employeeId) };
  }

  @Get('holidays')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async holidays(@CompanyId() companyId: string, @Query('year') year: string) {
    return {
      success: true,
      data: await this.shifts.listHolidays(companyId, parseInt(year) || new Date().getFullYear()),
    };
  }

  @Post('holidays')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async createHoliday(
    @CompanyId() companyId: string,
    @Body() body: { name: string; date: string },
  ) {
    return { success: true, data: await this.shifts.createHoliday(companyId, body.name, body.date) };
  }
}
