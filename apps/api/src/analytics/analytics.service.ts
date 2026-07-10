import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async getCompanyAnalytics(companyId: string) {
    const since = this.daysAgo(30);
    const [employees, attendance, tasks] = await Promise.all([
      this.prisma.employee.count({ where: { companyId, isActive: true } }),
      this.prisma.attendanceRecord.count({ where: { companyId, serverTimestamp: { gte: since } } }),
      this.prisma.taskAssignment.findMany({
        where: { employee: { companyId } },
        select: { status: true },
      }),
    ]);

    const workDays = 22;
    const expectedCheckins = employees * workDays;
    const checkInRate = expectedCheckins > 0 ? Math.min(100, (attendance / expectedCheckins) * 100) : 0;
    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const taskCompletionRate = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;

    return {
      activeEmployees: employees,
      checkInRate30d: Math.round(checkInRate * 10) / 10,
      attendanceRecords30d: attendance,
      taskCompletionRate: Math.round(taskCompletionRate * 10) / 10,
      totalTasks: tasks.length,
    };
  }

  async getResellerAnalytics(resellerId: string) {
    const since = this.daysAgo(30);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const companies = await this.prisma.company.findMany({
      where: { resellerId },
      include: { _count: { select: { employees: true, attendanceRecords: true } } },
    });

    const companyIds = companies.map((c) => c.id);
    const [attendance30d, newCompaniesMonth, payments] = await Promise.all([
      this.prisma.attendanceRecord.count({
        where: { companyId: { in: companyIds }, serverTimestamp: { gte: since } },
      }),
      this.prisma.company.count({ where: { resellerId, createdAt: { gte: startOfMonth } } }),
      this.prisma.paymentTransaction.aggregate({
        where: { resellerId, status: 'SUCCESS', paidAt: { gte: startOfMonth } },
        _sum: { resellerAmount: true },
      }),
    ]);

    const totalEmployees = companies.reduce((s, c) => s + c._count.employees, 0);
    const avgCheckInPerCompany = companies.length > 0 ? attendance30d / companies.length : 0;

    const companyMetrics = await Promise.all(
      companies.map(async (c) => ({
        id: c.id,
        name: c.name,
        employeeCount: c._count.employees,
        ...(await this.getCompanyAnalytics(c.id)),
      })),
    );

    return {
      totalCompanies: companies.length,
      totalEmployees,
      newCompaniesThisMonth: newCompaniesMonth,
      monthlyCommission: payments._sum?.resellerAmount ?? 0,
      attendanceRecords30d: attendance30d,
      avgAttendancePerCompany: Math.round(avgCheckInPerCompany),
      companies: companyMetrics,
    };
  }

  async getAdminResellerAnalytics() {
    const resellers = await this.prisma.reseller.findMany({
      where: { isActive: true },
      include: { _count: { select: { companies: true } } },
    });

    return Promise.all(
      resellers.map(async (r) => {
        const analytics = await this.getResellerAnalytics(r.id);
        return {
          id: r.id,
          companyName: r.companyName,
          code: r.code,
          clientCount: r._count.companies,
          ...analytics,
        };
      }),
    );
  }

  async getCompanyAnalyticsForReseller(resellerId: string, companyId: string) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, resellerId },
    });
    if (!company) return null;
    return this.getCompanyAnalytics(companyId);
  }

  async getMarketerAnalytics(marketerId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [resellers, directCompanies, payments] = await Promise.all([
      this.prisma.reseller.count({ where: { marketerId, isActive: true } }),
      this.prisma.company.count({ where: { marketerId } }),
      this.prisma.paymentTransaction.aggregate({
        where: { marketerId, status: 'SUCCESS', paidAt: { gte: startOfMonth } },
        _sum: { marketerAmount: true },
      }),
    ]);

    const resellerCompanyCount = await this.prisma.company.count({
      where: { reseller: { marketerId } },
    });

    return {
      totalResellers: resellers,
      directCompanies,
      resellerCompanies: resellerCompanyCount,
      monthlyCommission: payments._sum?.marketerAmount ?? 0,
    };
  }

  async getAdminHierarchy() {
    const marketers = await this.prisma.marketer.findMany({
      include: {
        user: { select: { id: true, publicId: true, email: true, firstName: true, lastName: true, phone: true, isActive: true } },
        resellers: {
          include: {
            user: { select: { id: true, publicId: true, email: true, firstName: true, lastName: true, role: true, isActive: true } },
            companies: {
              include: {
                users: { select: { id: true, publicId: true, email: true, firstName: true, lastName: true, role: true, isActive: true } },
                _count: { select: { employees: true } },
              },
            },
            _count: { select: { companies: true } },
          },
        },
        companies: {
          include: {
            users: { select: { id: true, publicId: true, email: true, firstName: true, lastName: true, role: true, isActive: true } },
            _count: { select: { employees: true } },
          },
        },
        _count: { select: { resellers: true, companies: true } },
      },
      orderBy: { companyName: 'asc' },
    });

    const directResellers = await this.prisma.reseller.findMany({
      where: { marketerId: null },
      include: {
        user: { select: { id: true, publicId: true, email: true, firstName: true, lastName: true, phone: true, isActive: true } },
        companies: {
          include: {
            users: { select: { id: true, publicId: true, email: true, firstName: true, lastName: true, role: true, isActive: true } },
            _count: { select: { employees: true } },
          },
        },
        _count: { select: { companies: true } },
      },
    });

    const directCompanies = await this.prisma.company.findMany({
      where: { resellerId: null, marketerId: null },
      include: {
        users: { select: { id: true, publicId: true, email: true, firstName: true, lastName: true, role: true, isActive: true } },
        _count: { select: { employees: true } },
      },
    });

    const [totalEmployees, totalResellers, totalCompanies, totalMarketers] = await Promise.all([
      this.prisma.employee.count({ where: { isActive: true } }),
      this.prisma.reseller.count({ where: { isActive: true } }),
      this.prisma.company.count(),
      this.prisma.marketer.count({ where: { isActive: true } }),
    ]);

    return {
      totals: { totalEmployees, totalResellers, totalCompanies, totalMarketers },
      marketers,
      directResellers,
      directCompanies,
    };
  }
}
