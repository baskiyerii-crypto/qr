import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ResellersService } from '../resellers/resellers.service';
import { UserRole } from '@prisma/client';
import { RegisterCompanyInput, LoginInput } from '@qr/shared';
import { createUniquePublicId } from '../common/utils/public-id';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private resellers: ResellersService,
  ) {}

  async registerCompany(dto: RegisterCompanyInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    let resellerId: string | undefined;
    if (dto.resellerCode) {
      const reseller = await this.resellers.findByCode(dto.resellerCode);
      if (!reseller) throw new BadRequestException('Geçersiz bayi kodu');
      resellerId = reseller.id;
    }

    let marketerId: string | undefined;
    if (dto.marketerCode && !resellerId) {
      const marketer = await this.prisma.marketer.findFirst({
        where: { code: dto.marketerCode.toUpperCase(), isActive: true },
      });
      if (!marketer) throw new BadRequestException('Geçersiz pazarlamacı kodu');
      marketerId = marketer.id;
    }

    const settings = await this.resellers.getPlatformSettings();
    const slug = dto.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const publicId = await createUniquePublicId(this.prisma);

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName,
        slug: `${slug}-${Date.now()}`,
        resellerId,
        marketerId,
        monthlySubscriptionFee: settings.monthlySubscriptionFee,
        users: {
          create: {
            email: dto.email,
            passwordHash,
            role: UserRole.COMPANY_ADMIN,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            publicId,
          },
        },
      },
      include: { users: true },
    });

    const user = company.users[0];
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { employee: true, reseller: true, marketer: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Geçersiz e-posta veya şifre');
    }
    if (user.role === UserRole.RESELLER && user.reseller && !user.reseller.isActive) {
      throw new UnauthorizedException('Bayi hesabınız aktif değil');
    }
    if (user.role === UserRole.MARKETER && user.marketer && !user.marketer.isActive) {
      throw new UnauthorizedException('Pazarlamacı hesabınız aktif değil');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Geçersiz e-posta veya şifre');

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET') || 'dev-refresh-secret',
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { employee: true, reseller: true, marketer: true },
      });
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException();
      }
      return this.buildAuthResponse(user);
    } catch {
      throw new UnauthorizedException('Geçersiz refresh token');
    }
  }

  async acceptInvite(token: string, password: string, deviceId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { inviteToken: token, role: UserRole.EMPLOYEE },
      include: { employee: true },
    });
    if (!user) throw new UnauthorizedException('Geçersiz davet bağlantısı');

    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, inviteToken: null, isActive: true },
      include: { employee: true, reseller: true },
    });

    if (deviceId && updated.employee) {
      await this.prisma.employeeDevice.upsert({
        where: {
          employeeId_deviceId: { employeeId: updated.employee.id, deviceId },
        },
        create: {
          employeeId: updated.employee.id,
          deviceId,
          status: 'PENDING',
        },
        update: {},
      });
    }

    return this.buildAuthResponse(updated);
  }

  private async computeBranchScope(user: {
    id: string;
    role: UserRole;
    employee?: { id: string; branchId?: string | null } | null;
  }): Promise<{ mode: 'ALL' | 'LIST'; branchIds: string[] }> {
    if (user.role === UserRole.REGIONAL_MANAGER || user.role === UserRole.BRANCH_MANAGER) {
      const assignments = await this.prisma.branchAssignment.findMany({
        where: { userId: user.id },
        select: { branchId: true },
      });
      return { mode: 'LIST', branchIds: assignments.map((a) => a.branchId) };
    }
    if (user.role === UserRole.EMPLOYEE) {
      const branchId = user.employee?.branchId ?? null;
      return { mode: 'LIST', branchIds: branchId ? [branchId] : [] };
    }
    return { mode: 'ALL', branchIds: [] };
  }

  private async buildAuthResponse(user: {
    id: string;
    publicId: string;
    email: string;
    role: UserRole;
    companyId: string | null;
    firstName: string;
    lastName: string;
    mustChangePassword?: boolean;
    employee?: { id: string; branchId?: string | null } | null;
    reseller?: { id: string } | null;
    marketer?: { id: string } | null;
  }) {
    const branchScope = await this.computeBranchScope(user);
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      employeeId: user.employee?.id ?? null,
      resellerId: user.reseller?.id ?? null,
      marketerId: user.marketer?.id ?? null,
      branchScope,
    };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET') || 'dev-refresh-secret',
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const platform = await this.resellers.getPlatformSettings();

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        publicId: user.publicId,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        employeeId: user.employee?.id ?? null,
        resellerId: user.reseller?.id ?? null,
        marketerId: user.marketer?.id ?? null,
        firstName: user.firstName,
        lastName: user.lastName,
        mustChangePassword: user.mustChangePassword ?? false,
        branchScope,
        requireEmployeeLocation: platform.requireEmployeeLocation,
      },
    };
  }
}
