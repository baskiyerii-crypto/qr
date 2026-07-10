import { Module } from '@nestjs/common';
import { BranchTransfersService } from './branch-transfers.service';
import { BranchTransfersController } from './branch-transfers.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [BranchTransfersController],
  providers: [BranchTransfersService],
  exports: [BranchTransfersService],
})
export class BranchTransfersModule {}
