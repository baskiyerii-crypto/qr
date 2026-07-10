import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingScopeService } from './messaging-scope.service';
import { MessagingController } from './messaging.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [MessagingController],
  providers: [MessagingService, MessagingScopeService],
})
export class MessagingModule {}
