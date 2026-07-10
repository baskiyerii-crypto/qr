import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { TimesheetsModule } from '../timesheets/timesheets.module';

@Module({
  imports: [TimesheetsModule],
  controllers: [PayrollController],
  providers: [PayrollService],
})
export class PayrollModule {}
