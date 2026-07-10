import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedbackService } from './feedback.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../common/decorators';
import { createFeedbackSchema, replyFeedbackSchema } from '@qr/shared';

@Controller('feedback')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FeedbackController {
  constructor(private feedback: FeedbackService) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = createFeedbackSchema.parse(body);
    return {
      success: true,
      data: await this.feedback.create(user.sub, user.role, user.companyId, user.resellerId, dto),
    };
  }

  @Get('my')
  async listMy(@CurrentUser() user: JwtPayload) {
    return {
      success: true,
      data: await this.feedback.listMy(user.sub, user.role, user.companyId, user.resellerId),
    };
  }

  @Post(':id/reply')
  async reply(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const dto = replyFeedbackSchema.parse(body);
    return { success: true, data: await this.feedback.reply(id, user.sub, dto.body) };
  }

  @Patch(':id/close')
  async close(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.feedback.close(id, user.sub) };
  }
}
