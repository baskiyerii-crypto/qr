import { Module } from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { SurveysController } from './surveys.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [NotificationsModule, WhatsappModule],
  controllers: [SurveysController],
  providers: [SurveysService],
})
export class SurveysModule {}
