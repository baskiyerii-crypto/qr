import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { EmployeesService } from './employees.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CompanyId, BranchScopeParam, BranchScope } from '../common/decorators';
import { createEmployeeSchema } from '@qr/shared';

@Controller('employees')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EmployeesController {
  constructor(private employees: EmployeesService) {}

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER)
  async list(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Query('branchId') branchId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return {
      success: true,
      data: await this.employees.list(companyId, branchId, includeInactive === 'true', scope),
    };
  }

  @Get('live')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER)
  async live(@CompanyId() companyId: string, @BranchScopeParam() scope: BranchScope) {
    return { success: true, data: await this.employees.getLiveAttendance(companyId, scope) };
  }

  @Get('import/template')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.employees.generateImportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=personel-sablonu.xlsx');
    res.send(Buffer.from(buffer));
  }

  @Post('import')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @CompanyId() companyId: string,
    @UploadedFile() file?: { buffer: Buffer },
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Excel dosyası gerekli (.xlsx)');
    }
    return { success: true, data: await this.employees.importFromExcel(companyId, file.buffer) };
  }

  @Get(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER, UserRole.EMPLOYEE)
  async getOne(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @BranchScopeParam() scope: BranchScope,
  ) {
    return { success: true, data: await this.employees.getById(companyId, id, scope) };
  }

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async create(@CompanyId() companyId: string, @Body() body: unknown) {
    const dto = createEmployeeSchema.parse(body);
    return { success: true, data: await this.employees.create(companyId, dto) };
  }

  @Patch(':id/salary')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async updateSalary(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @Body('monthlySalary') monthlySalary: number,
  ) {
    await this.employees.updateSalary(companyId, id, monthlySalary);
    return { success: true };
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async deactivate(@CompanyId() companyId: string, @Param('id') id: string) {
    return { success: true, data: await this.employees.deactivate(companyId, id) };
  }
}
