import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [EmployeesModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
