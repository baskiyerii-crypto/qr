import { Module } from '@nestjs/common';
import { MarketersService } from './marketers.service';
import { MarketersController } from './marketers.controller';
import { CompaniesModule } from '../companies/companies.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [CompaniesModule, AnalyticsModule],
  controllers: [MarketersController],
  providers: [MarketersService],
  exports: [MarketersService],
})
export class MarketersModule {}
