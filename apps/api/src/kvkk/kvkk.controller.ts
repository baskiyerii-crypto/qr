import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { KvkkService } from './kvkk.service';
import { CurrentUser, JwtPayload } from '../common/decorators';

@Controller('kvkk')
export class KvkkController {
  constructor(private kvkk: KvkkService) {}

  @Get('disclosure')
  getDisclosure() {
    return { success: true, data: this.kvkk.getDisclosureText() };
  }

  @Post('consent')
  @UseGuards(AuthGuard('jwt'))
  async consent(@CurrentUser() user: JwtPayload, @Req() req: Request) {
    return {
      success: true,
      data: await this.kvkk.acceptConsent({
        companyId: user.companyId!,
        employeeId: user.employeeId ?? undefined,
        userId: user.sub,
        ipAddress: req.ip,
      }),
    };
  }

  @Get('my-data')
  @UseGuards(AuthGuard('jwt'))
  async myData(@CurrentUser() user: JwtPayload) {
    if (!user.employeeId) {
      return { success: true, data: { message: 'Yönetici hesabı — personel verisi yok' } };
    }
    return { success: true, data: await this.kvkk.getMyData(user.employeeId) };
  }

  @Get('consent-status')
  @UseGuards(AuthGuard('jwt'))
  async consentStatus(@CurrentUser() user: JwtPayload) {
    if (!user.employeeId) return { success: true, data: { hasConsent: true } };
    return {
      success: true,
      data: { hasConsent: await this.kvkk.hasConsent(user.employeeId) },
    };
  }
}
