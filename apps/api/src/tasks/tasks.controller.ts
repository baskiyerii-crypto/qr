import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole, TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser, CompanyId, JwtPayload } from '../common/decorators';
import { createTaskSchema } from '@qr/shared';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.BRANCH_MANAGER)
  async create(@CompanyId() companyId: string, @Body() body: unknown) {
    const dto = createTaskSchema.parse(body);
    return { success: true, data: await this.tasks.create(companyId, dto) };
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.BRANCH_MANAGER)
  async list(@CompanyId() companyId: string) {
    return { success: true, data: await this.tasks.list(companyId) };
  }

  @Get('my')
  @Roles(UserRole.EMPLOYEE)
  async my(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.tasks.myTasks(user.employeeId!) };
  }

  @Patch('assignments/:id/status')
  @Roles(UserRole.EMPLOYEE)
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
  ) {
    await this.tasks.updateStatus(id, user.employeeId!, status);
    return { success: true };
  }
}
