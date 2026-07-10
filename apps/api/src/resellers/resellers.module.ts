import { Module } from '@nestjs/common';
import { ResellersController } from './resellers.controller';
import { ResellersService } from './resellers.service';
import { BillingModule } from '../billing/billing.module';
import { CompaniesModule } from '../companies/companies.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [BillingModule, CompaniesModule, AnalyticsModule],
  controllers: [ResellersController],
  providers: [ResellersService],
  exports: [ResellersService],
})
export class ResellersModule {}
