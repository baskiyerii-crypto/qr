import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { IyzicoService } from './iyzico.service';
import { BillingController, AdminBillingController } from './billing.controller';

@Module({
  controllers: [BillingController, AdminBillingController],
  providers: [BillingService, IyzicoService],
  exports: [BillingService, IyzicoService],
})
export class BillingModule {}
