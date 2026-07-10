import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { loginSchema, registerCompanySchema } from '@qr/shared';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  async register(@Body() body: unknown) {
    const dto = registerCompanySchema.parse(body);
    return { success: true, data: await this.auth.registerCompany(dto) };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() body: unknown) {
    const dto = loginSchema.parse(body);
    return { success: true, data: await this.auth.login(dto) };
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return { success: true, data: await this.auth.refresh(refreshToken) };
  }

  @Post('accept-invite')
  async acceptInvite(
    @Body() body: { token: string; password: string; deviceId?: string },
  ) {
    return {
      success: true,
      data: await this.auth.acceptInvite(body.token, body.password, body.deviceId),
    };
  }
}
