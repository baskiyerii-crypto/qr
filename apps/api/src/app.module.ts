import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { DevicesModule } from './devices/devices.module';
import { ShiftsModule } from './shifts/shifts.module';
import { LeavesModule } from './leaves/leaves.module';
import { TimesheetsModule } from './timesheets/timesheets.module';
import { TasksModule } from './tasks/tasks.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PayrollModule } from './payroll/payroll.module';
import { KvkkModule } from './kvkk/kvkk.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { UsersModule } from './users/users.module';
import { ResellersModule } from './resellers/resellers.module';
import { AdminModule } from './admin/admin.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { ResellerApplicationsModule } from './reseller-applications/reseller-applications.module';
import { BillingModule } from './billing/billing.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MarketersModule } from './marketers/marketers.module';
import { BranchTransfersModule } from './branch-transfers/branch-transfers.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { RequestsModule } from './requests/requests.module';
import { DocumentsModule } from './documents/documents.module';
import { ReportsModule } from './reports/reports.module';
import { SurveysModule } from './surveys/surveys.module';
import { PlatformModule } from './platform/platform.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    WhatsappModule,
    AuthModule,
    CompaniesModule,
    EmployeesModule,
    UsersModule,
    ResellersModule,
    ResellerApplicationsModule,
    BillingModule,
    AdminModule,
    FeedbackModule,
    AnalyticsModule,
    MarketersModule,
    AttendanceModule,
    BranchTransfersModule,
    RecruitmentModule,
    RequestsModule,
    DocumentsModule,
    ReportsModule,
    SurveysModule,
    PlatformModule,
    DevicesModule,
    ShiftsModule,
    LeavesModule,
    TimesheetsModule,
    TasksModule,
    AnnouncementsModule,
    MessagingModule,
    NotificationsModule.forRoot(),
    PayrollModule,
    KvkkModule,
    DashboardModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
