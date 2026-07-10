import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  private apiInfo() {
    return {
      success: true,
      name: 'QR Personel API',
      version: '1.0.0',
      message: 'API çalışıyor. Uç noktalar /api altında.',
      endpoints: {
        root: '/',
        health: '/health',
        auth: '/api/auth/login',
        docs: 'POST /api/auth/login ile giriş; diğer istekler Authorization: Bearer <token>',
      },
      web: 'http://localhost:5173',
    };
  }

  @Get()
  root() {
    return this.apiInfo();
  }

  @Get('api')
  apiRoot() {
    return this.apiInfo();
  }

  @Get('health')
  health() {
    return {
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
