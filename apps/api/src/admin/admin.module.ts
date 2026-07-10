import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminPlatformService } from './admin-platform.service';
import { ResellersModule } from '../resellers/resellers.module';
import { MarketersModule } from '../marketers/marketers.module';

@Module({
  imports: [ResellersModule, MarketersModule],
  controllers: [AdminController],
  providers: [AdminPlatformService],
})
export class AdminModule {}