import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('platform')
@UseGuards(AuthGuard('jwt'))
export class PlatformController {
  constructor(private prisma: PrismaService) {}

  @Get('config')
  async config() {
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    return {
      success: true,
      data: {
        requireEmployeeLocation: settings?.requireEmployeeLocation !== false,
        brandTitle: settings?.brandTitle ?? null,
        brandAddress: settings?.brandAddress ?? null,
        brandIconUrl: settings?.brandIconUrl ?? null,
        brandSubtitleCompany: settings?.brandSubtitleCompany ?? null,
        brandSubtitleAdmin: settings?.brandSubtitleAdmin ?? null,
        brandSubtitleReseller: settings?.brandSubtitleReseller ?? null,
        brandSubtitleMarketer: settings?.brandSubtitleMarketer ?? null,
      },
    };
  }
}
