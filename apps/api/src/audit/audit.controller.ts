import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { AuditService } from './audit.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CompanyId } from '../common/decorators';

@Controller('audit')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditController {
  constructor(private audit: AuditService) {}

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER)
  async list(@CompanyId() companyId: string, @Query('limit') limit?: string) {
    const take = limit ? Math.min(parseInt(limit, 10) || 50, 200) : 50;
    return { success: true, data: await this.audit.findByCompany(companyId, take) };
  }
}
