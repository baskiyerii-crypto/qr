import { Module } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentController, PublicRecruitmentController } from './recruitment.controller';

@Module({
  controllers: [PublicRecruitmentController, RecruitmentController],
  providers: [RecruitmentService],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
