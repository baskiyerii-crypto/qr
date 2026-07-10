import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeesService } from '../employees/employees.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CompanyId } from '../common/decorators';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.COMPANY_ADMIN, UserRole.HR_MANAGER, UserRole.BRANCH_MANAGER)
export class DashboardController {
  constructor(
    private prisma: PrismaService,
    private employees: EmployeesService,
  ) {}

  @Get()
  async stats(@CompanyId() companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalEmployees, activeToday, pendingLeaves, pendingDevices, recentAnnouncements] =
      await Promise.all([
        this.prisma.employee.count({ where: { companyId, isActive: true } }),
        this.prisma.attendanceRecord.count({
          where: { companyId, serverTimestamp: { gte: today }, type: 'CHECK_IN' },
        }),
        this.prisma.leaveRequest.count({ where: { companyId, status: 'PENDING' } }),
        this.prisma.employeeDevice.count({
          where: { status: 'PENDING', employee: { companyId } },
        }),
        this.prisma.announcement.count({
          where: { companyId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
        }),
      ]);

    const live = await this.employees.getLiveAttendance(companyId);

    return {
      success: true,
      data: {
        totalEmployees,
        checkedInNow: live.length,
        checkInsToday: activeToday,
        pendingLeaves,
        pendingDevices,
        recentAnnouncements,
        liveAttendance: live,
      },
    };
  }
}
