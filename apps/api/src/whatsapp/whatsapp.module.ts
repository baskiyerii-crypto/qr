import { Module, Global } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappAdminController } from './whatsapp-admin.controller';

@Global()
@Module({
  controllers: [WhatsappAdminController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
