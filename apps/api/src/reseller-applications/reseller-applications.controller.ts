import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { ResellerApplicationsService } from './reseller-applications.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser, JwtPayload } from '../common/decorators';
import {
  resellerApplicationSchema,
  applicationStatusQuerySchema,
  reviewApplicationSchema,
  approveApplicationSchema,
  rejectApplicationSchema,
} from '@qr/shared';

@Controller('reseller-applications')
export class ResellerApplicationsController {
  constructor(private applications: ResellerApplicationsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async submit(@Body() body: unknown) {
    const dto = resellerApplicationSchema.parse(body);
    return { success: true, data: await this.applications.submit(dto) };
  }

  @Get(':id/status')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async status(@Param('id') id: string, @Query('phone') phone: string) {
    applicationStatusQuerySchema.parse({ phone });
    return { success: true, data: await this.applications.getStatus(id, phone) };
  }
}

@Controller('admin/reseller-applications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminResellerApplicationsController {
  constructor(private applications: ResellerApplicationsService) {}

  @Get()
  async list(@Query('status') status?: string) {
    return {
      success: true,
      data: await this.applications.list(status as never),
    };
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return { success: true, data: await this.applications.getById(id) };
  }

  @Patch(':id/review')
  async review(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
  ) {
    const dto = reviewApplicationSchema.parse(body);
    return {
      success: true,
      data: await this.applications.startReview(id, user.sub, dto.reviewNotes),
    };
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
  ) {
    const dto = approveApplicationSchema.parse(body);
    return {
      success: true,
      data: await this.applications.approve(id, user.sub, dto),
    };
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
  ) {
    const dto = rejectApplicationSchema.parse(body);
    return {
      success: true,
      data: await this.applications.reject(id, user.sub, dto.rejectionReason),
    };
  }
}
