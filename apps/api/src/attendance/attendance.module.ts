import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceRemindersService } from './attendance-reminders.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceRemindersService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
