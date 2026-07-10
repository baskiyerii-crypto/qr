import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { MessagingService } from './messaging.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser, CompanyId, JwtPayload } from '../common/decorators';
import {
  sendMessageSchema,
  createConversationSchema,
  addGroupMembersSchema,
} from '@qr/shared';

@Controller('messages')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MessagingController {
  constructor(private messaging: MessagingService) {}

  @Get('conversations')
  async conversations(@CompanyId() companyId: string, @CurrentUser() user: JwtPayload) {
    return {
      success: true,
      data: await this.messaging.getConversations(companyId, user),
    };
  }

  @Post('conversations')
  async createConversation(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
  ) {
    const dto = createConversationSchema.parse(body);
    return {
      success: true,
      data: await this.messaging.createConversation(companyId, user, dto),
    };
  }

  @Get('conversations/:id')
  async messages(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return { success: true, data: await this.messaging.getMessages(id, user, companyId) };
  }

  @Patch('conversations/:id/read')
  async markRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return { success: true, data: await this.messaging.markRead(id, user) };
  }

  @Post('conversations/:id/members')
  async addMembers(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = addGroupMembersSchema.parse(body);
    return {
      success: true,
      data: await this.messaging.addGroupMembers(companyId, user, id, dto),
    };
  }

  @Post()
  async send(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
  ) {
    const dto = sendMessageSchema.parse(body);
    return {
      success: true,
      data: await this.messaging.send(companyId, user, dto),
    };
  }

  @Post('conversations/:id/reply')
  @Roles(UserRole.EMPLOYEE)
  async reply(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('body') body: string,
  ) {
    return {
      success: true,
      data: await this.messaging.replyAsEmployee(id, user.employeeId!, body, user, companyId),
    };
  }
}
