import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Controller('admin/whatsapp')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class WhatsappAdminController {
  constructor(private whatsapp: WhatsappService) {}

  @Get('status')
  async status() {
    return { success: true, data: await this.whatsapp.getConnectionStatus() };
  }

  @Get('qr')
  async qr() {
    return { success: true, data: await this.whatsapp.getQrCode() };
  }
}
