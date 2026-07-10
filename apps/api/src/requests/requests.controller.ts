import { Controller, Get, Post, Patch, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { RequestsService } from './requests.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CompanyId, CurrentUser, JwtPayload, BranchScopeParam, BranchScope } from '../common/decorators';
import { createShiftSwapSchema, createOvertimeSchema, createAdvanceSchema } from '@qr/shared';

const KINDS = ['shift-swap', 'overtime', 'advance'] as const;
type RequestKind = (typeof KINDS)[number];

@Controller('requests')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RequestsController {
  constructor(private requests: RequestsService) {}

  @Post('shift-swap')
  @Roles(UserRole.EMPLOYEE)
  async shiftSwap(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = createShiftSwapSchema.parse(body);
    return { success: true, data: await this.requests.createShiftSwap(user.companyId!, user.employeeId!, dto) };
  }

  @Post('overtime')
  @Roles(UserRole.EMPLOYEE)
  async overtime(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = createOvertimeSchema.parse(body);
    return { success: true, data: await this.requests.createOvertime(user.companyId!, user.employeeId!, dto) };
  }

  @Post('advance')
  @Roles(UserRole.EMPLOYEE)
  async advance(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = createAdvanceSchema.parse(body);
    return { success: true, data: await this.requests.createAdvance(user.companyId!, user.employeeId!, dto) };
  }

  @Get('my')
  @Roles(UserRole.EMPLOYEE)
  async my(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.requests.myRequests(user.employeeId!) };
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER)
  async list(@CompanyId() companyId: string, @BranchScopeParam() scope: BranchScope) {
    return { success: true, data: await this.requests.listForManagers(companyId, scope) };
  }

  @Patch(':kind/:id/review')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.REGIONAL_MANAGER, UserRole.BRANCH_MANAGER)
  async review(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @BranchScopeParam() scope: BranchScope,
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Body() body: { approve: boolean; note?: string },
  ) {
    if (!KINDS.includes(kind as RequestKind)) throw new BadRequestException('Geçersiz talep türü');
    return {
      success: true,
      data: await this.requests.review(companyId, kind as RequestKind, id, user.sub, body.approve, body.note, scope),
    };
  }
}
