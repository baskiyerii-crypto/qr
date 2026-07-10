import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { BranchTransfersService } from './branch-transfers.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CompanyId, CurrentUser, JwtPayload, BranchScopeParam, BranchScope } from '../common/decorators';
import { createBranchTransferSchema } from '@qr/shared';

@Controller('branch-transfers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  UserRole.COMPANY_ADMIN,
  UserRole.HR_MANAGER,
  UserRole.REGIONAL_MANAGER,
  UserRole.BRANCH_MANAGER,
)
export class BranchTransfersController {
  constructor(private transfers: BranchTransfersService) {}

  @Get()
  async list(@CompanyId() companyId: string, @BranchScopeParam() scope: BranchScope) {
    return { success: true, data: await this.transfers.list(companyId, scope) };
  }

  @Post()
  async create(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @BranchScopeParam() scope: BranchScope,
    @Body() body: unknown,
  ) {
    const dto = createBranchTransferSchema.parse(body);
    return { success: true, data: await this.transfers.create(companyId, user.sub, dto, scope) };
  }

  @Patch(':id/end')
  async end(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @BranchScopeParam() scope: BranchScope,
    @Param('id') id: string,
  ) {
    return { success: true, data: await this.transfers.end(companyId, id, user.sub, scope) };
  }
}
