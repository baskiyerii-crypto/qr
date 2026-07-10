import { Module } from '@nestjs/common';
import { ResellerApplicationsService } from './reseller-applications.service';
import {
  ResellerApplicationsController,
  AdminResellerApplicationsController,
} from './reseller-applications.controller';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [ResellerApplicationsController, AdminResellerApplicationsController],
  providers: [ResellerApplicationsService],
  exports: [ResellerApplicationsService],
})
export class ResellerApplicationsModule {}
