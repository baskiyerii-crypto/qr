import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { CurrentUser, JwtPayload } from '../common/decorators';
import { registerPushTokenSchema } from '@qr/shared';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    return {
      success: true,
      data: await this.notifications.getForUser(
        user.role !== 'EMPLOYEE' ? user.sub : undefined,
        user.employeeId ?? undefined,
      ),
    };
  }

  @Post('register-device')
  async registerDevice(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = registerPushTokenSchema.parse(body);
    return {
      success: true,
      data: await this.notifications.registerPushToken(user.sub, dto.pushToken),
    };
  }

  @Post(':id/read')
  async markRead(@Param('id') id: string) {
    return { success: true, data: await this.notifications.markRead(id) };
  }
}
