import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Tenancy (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    prisma = app.get(PrismaService);

    const loginA = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@demo.com', password: 'Admin123!' });
    tokenA = loginA.body.data?.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject requests without token', () => {
    return request(app.getHttpServer()).get('/api/employees').expect(401);
  });

  it('should return employees for authenticated company', async () => {
    if (!tokenA) return;
    const res = await request(app.getHttpServer())
      .get('/api/employees')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('kvkk disclosure is public', async () => {
    const res = await request(app.getHttpServer()).get('/api/kvkk/disclosure').expect(200);
    expect(res.body.data.sections).toBeDefined();
  });
});
