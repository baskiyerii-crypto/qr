import { Controller, Get, Post, Patch, Param, Body, UseGuards, ForbiddenException, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { SurveysService } from './surveys.service';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  Roles,
  CurrentUser,
  CompanyId,
  JwtPayload,
  BranchScopeParam,
  BranchScope,
} from '../common/decorators';
import {
  createSurveySchema,
  updateSurveySchema,
  submitSurveyResponseSchema,
} from '@qr/shared';

const SURVEY_MANAGER_ROLES = [
  UserRole.COMPANY_ADMIN,
  UserRole.HR_MANAGER,
  UserRole.REGIONAL_MANAGER,
  UserRole.BRANCH_MANAGER,
] as const;

@Controller('surveys')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SurveysController {
  constructor(private surveys: SurveysService) {}

  @Post()
  @Roles(...SURVEY_MANAGER_ROLES)
  async create(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @BranchScopeParam() scope: BranchScope,
    @Body() body: unknown,
  ) {
    const dto = createSurveySchema.parse(body);
    return {
      success: true,
      data: await this.surveys.create(companyId, user.sub, dto, scope),
    };
  }

  @Get()
  @Roles(...SURVEY_MANAGER_ROLES)
  async list(@CompanyId() companyId: string, @BranchScopeParam() scope: BranchScope) {
    return { success: true, data: await this.surveys.list(companyId, scope) };
  }

  @Get('my')
  async my(@CurrentUser() user: JwtPayload) {
    if (!user.employeeId) {
      return { success: true, data: [] };
    }
    return { success: true, data: await this.surveys.mySurveys(user.employeeId) };
  }

  @Get(':id/stats')
  @Roles(...SURVEY_MANAGER_ROLES)
  async stats(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @BranchScopeParam() scope: BranchScope,
  ) {
    return { success: true, data: await this.surveys.getStats(id, companyId, scope) };
  }

  @Get(':id/participants')
  @Roles(...SURVEY_MANAGER_ROLES)
  async participants(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @BranchScopeParam() scope: BranchScope,
  ) {
    return { success: true, data: await this.surveys.getParticipants(id, companyId, scope) };
  }

  @Post(':id/remind')
  @Roles(...SURVEY_MANAGER_ROLES)
  async remind(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @BranchScopeParam() scope: BranchScope,
  ) {
    return { success: true, data: await this.surveys.remindPending(id, companyId, scope) };
  }

  @Get(':id/export/excel')
  @Roles(...SURVEY_MANAGER_ROLES)
  async exportExcel(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @BranchScopeParam() scope: BranchScope,
    @Res() res: Response,
  ) {
    const buffer = await this.surveys.exportExcel(id, companyId, scope);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=anket-${id.slice(0, 8)}.xlsx`);
    res.send(Buffer.from(buffer));
  }

  @Get(':id/export/pdf')
  @Roles(...SURVEY_MANAGER_ROLES)
  async exportPdf(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @BranchScopeParam() scope: BranchScope,
    @Res() res: Response,
  ) {
    const buffer = await this.surveys.exportPdf(id, companyId, scope);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=anket-${id.slice(0, 8)}.pdf`);
    res.send(buffer);
  }

  @Get(':id')
  async getById(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    if (user.employeeId && !SURVEY_MANAGER_ROLES.includes(user.role as (typeof SURVEY_MANAGER_ROLES)[number])) {
      return { success: true, data: await this.surveys.getForEmployee(id, user.employeeId) };
    }
    return { success: true, data: await this.surveys.getById(id, companyId) };
  }

  @Patch(':id')
  @Roles(...SURVEY_MANAGER_ROLES)
  async update(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = updateSurveySchema.parse(body);
    return { success: true, data: await this.surveys.update(id, companyId, dto) };
  }

  @Post(':id/responses')
  async submit(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    if (!user.employeeId) {
      throw new ForbiddenException('Personel kaydı gerekli');
    }
    const dto = submitSurveyResponseSchema.parse(body);
    return {
      success: true,
      data: await this.surveys.submitResponse(id, user.employeeId, dto),
    };
  }
}
