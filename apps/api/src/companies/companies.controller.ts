import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { CompaniesService } from './companies.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CompanyId, BranchScopeParam, BranchScope } from '../common/decorators';
import { createBranchSchema, companySettingsSchema } from '@qr/shared';

@Controller('companies')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CompaniesController {
  constructor(private companies: CompaniesService) {}

  @Get('me')
  async me(@CompanyId() companyId: string) {
    return { success: true, data: await this.companies.getCompany(companyId) };
  }

  @Patch('settings')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async updateSettings(@CompanyId() companyId: string, @Body() body: unknown) {
    const dto = companySettingsSchema.parse(body);
    return { success: true, data: await this.companies.updateSettings(companyId, dto) };
  }

  @Get('qr')
  async getQr(@CompanyId() companyId: string) {
    return { success: true, data: await this.companies.getQrData(companyId) };
  }

  @Get('branches')
  async listBranches(@CompanyId() companyId: string) {
    return { success: true, data: await this.companies.listBranches(companyId) };
  }

  @Get('branches/:id/qr')
  @Roles(
    UserRole.COMPANY_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.REGIONAL_MANAGER,
    UserRole.BRANCH_MANAGER,
  )
  async getBranchQr(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Param('id') id: string,
  ) {
    return { success: true, data: await this.companies.getBranchQrData(companyId, id, scope) };
  }

  @Post('branches')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.BRANCH_MANAGER)
  async createBranch(@CompanyId() companyId: string, @Body() body: unknown) {
    const dto = createBranchSchema.parse(body);
    return { success: true, data: await this.companies.createBranch(companyId, dto) };
  }

  @Get('departments')
  async listDepartments(@CompanyId() companyId: string) {
    return { success: true, data: await this.companies.listDepartments(companyId) };
  }

  @Post('departments')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async createDepartment(@CompanyId() companyId: string, @Body('name') name: string) {
    return { success: true, data: await this.companies.createDepartment(companyId, name) };
  }
}
