import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { IyzicoService } from '../billing/iyzico.service';
import {
  ResellerApplicationInput,
  ApproveApplicationInput,
} from '@qr/shared';
import {
  ResellerApplicationStatus,
  ResellerApplicationEventType,
  UserRole,
} from '@prisma/client';
import { createUniquePublicId } from '../common/utils/public-id';

@Injectable()
export class ResellerApplicationsService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
    private iyzico: IyzicoService,
  ) {}

  async submit(dto: ResellerApplicationInput) {
    const pending = await this.prisma.resellerApplication.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone }],
        status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
      },
    });
    if (pending) {
      throw new ConflictException('Bu e-posta veya telefon ile bekleyen başvuru var');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const application = await this.prisma.resellerApplication.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        companyName: dto.companyName,
        city: dto.city,
        experienceNotes: dto.experienceNotes,
        surveyAnswers: JSON.stringify(dto.surveyAnswers),
        status: 'SUBMITTED',
        events: {
          create: {
            type: 'SUBMITTED',
            message: 'Başvuru gönderildi',
          },
        },
      },
      include: { events: true },
    });

    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const webAppUrl = settings?.webAppUrl || 'http://localhost:5173';
    const wa = await this.whatsapp.sendApplicationReceived(dto.phone, application.id, webAppUrl);

    if (wa.ok) {
      await this.prisma.$transaction([
        this.prisma.resellerApplication.update({
          where: { id: application.id },
          data: { whatsappSentAt: new Date(), whatsappStatus: 'received_sent' },
        }),
        this.prisma.resellerApplicationEvent.create({
          data: {
            applicationId: application.id,
            type: 'WHATSAPP_SENT',
            message: 'Başvuru alındı WhatsApp mesajı gönderildi',
          },
        }),
      ]);
    }

    return {
      id: application.id,
      status: application.status,
      message: 'Başvurunuz alındı. İnceleme sürecinde WhatsApp ile bilgilendirileceksiniz.',
    };
  }

  async getStatus(id: string, phone: string) {
    const app = await this.prisma.resellerApplication.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });
    if (!app || app.phone !== phone) throw new NotFoundException('Başvuru bulunamadı');

    return {
      id: app.id,
      status: app.status,
      firstName: app.firstName,
      createdAt: app.createdAt,
      reviewedAt: app.reviewedAt,
      rejectionReason: app.rejectionReason,
      events: app.events.map((e) => ({
        type: e.type,
        message: e.message,
        createdAt: e.createdAt,
      })),
    };
  }

  async list(status?: ResellerApplicationStatus) {
    return this.prisma.resellerApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const app = await this.prisma.resellerApplication.findUnique({
      where: { id },
      include: { events: { orderBy: { createdAt: 'asc' } }, reseller: true },
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı');
    return {
      ...app,
      surveyAnswers: JSON.parse(app.surveyAnswers),
    };
  }

  async startReview(id: string, adminUserId: string, reviewNotes?: string) {
    const app = await this.prisma.resellerApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Başvuru bulunamadı');
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(app.status)) {
      throw new BadRequestException('Bu başvuru incelenemez');
    }

    return this.prisma.resellerApplication.update({
      where: { id },
      data: {
        status: 'UNDER_REVIEW',
        reviewNotes,
        events: {
          create: {
            type: 'REVIEW_STARTED',
            message: reviewNotes || 'İnceleme başlatıldı',
            actorUserId: adminUserId,
          },
        },
      },
    });
  }

  async approve(id: string, adminUserId: string, dto: ApproveApplicationInput) {
    const app = await this.prisma.resellerApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Başvuru bulunamadı');
    if (app.status === 'APPROVED') throw new BadRequestException('Zaten onaylanmış');
    if (app.status === 'REJECTED') throw new BadRequestException('Reddedilmiş başvuru onaylanamaz');

    const code = dto.code.toUpperCase();
    const codeExists = await this.prisma.reseller.findUnique({ where: { code } });
    if (codeExists) throw new ConflictException('Bu bayi kodu kullanılıyor');

    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const tempPassword = randomBytes(4).toString('hex') + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const commissionRate = dto.commissionRate ?? settings?.defaultCommissionRate ?? 0.15;

    const result = await this.prisma.$transaction(async (tx) => {
      const publicId = await createUniquePublicId(tx);
      const user = await tx.user.create({
        data: {
          email: app.email,
          passwordHash,
          role: UserRole.RESELLER,
          firstName: app.firstName,
          lastName: app.lastName,
          phone: app.phone,
          publicId,
          isActive: true,
          mustChangePassword: true,
        },
      });

      const reseller = await tx.reseller.create({
        data: {
          userId: user.id,
          companyName: app.companyName || `${app.firstName} ${app.lastName}`,
          code,
          phone: app.phone,
          commissionRate,
          applicationId: app.id,
          assignedPlanId: dto.assignedPlanId,
          iban: dto.iban,
          taxNumber: dto.taxNumber,
        },
      });

      await tx.resellerApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedById: adminUserId,
          reviewedAt: new Date(),
          approvedResellerId: reseller.id,
          events: {
            create: [
              { type: 'APPROVED', message: `Bayi kodu: ${code}`, actorUserId: adminUserId },
            ],
          },
        },
      });

      return { user, reseller, tempPassword };
    });

    const webAppUrl = settings?.webAppUrl || 'http://localhost:5173';
    const wa = await this.whatsapp.sendApplicationApproved(app.phone, {
      email: app.email,
      password: result.tempPassword,
      code,
      loginUrl: `${webAppUrl}/login`,
    });

    await this.prisma.resellerApplicationEvent.create({
      data: {
        applicationId: id,
        type: 'WHATSAPP_SENT',
        message: wa.ok ? 'Onay WhatsApp mesajı gönderildi' : `WhatsApp hatası: ${wa.error}`,
        actorUserId: adminUserId,
      },
    });

    if (dto.iban) {
      const resellerWithUser = await this.prisma.reseller.findUnique({
        where: { id: result.reseller.id },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      });
      const iyzicoResult = await this.iyzico.registerSubMerchant(resellerWithUser!);
      await this.prisma.resellerApplicationEvent.create({
        data: {
          applicationId: id,
          type: iyzicoResult.ok ? 'IYZICO_REGISTERED' : 'IYZICO_PENDING',
          message: iyzicoResult.message,
          actorUserId: adminUserId,
        },
      });
    }

    return {
      reseller: result.reseller,
      message: 'Bayi onaylandı ve WhatsApp ile bilgilendirildi',
    };
  }

  async reject(id: string, adminUserId: string, rejectionReason: string) {
    const app = await this.prisma.resellerApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Başvuru bulunamadı');
    if (app.status === 'APPROVED') throw new BadRequestException('Onaylanmış başvuru reddedilemez');

    await this.prisma.resellerApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason,
        reviewedById: adminUserId,
        reviewedAt: new Date(),
        events: {
          create: {
            type: 'REJECTED',
            message: rejectionReason,
            actorUserId: adminUserId,
          },
        },
      },
    });

    const wa = await this.whatsapp.sendApplicationRejected(app.phone, rejectionReason);
    await this.prisma.resellerApplicationEvent.create({
      data: {
        applicationId: id,
        type: 'WHATSAPP_SENT',
        message: wa.ok ? 'Red WhatsApp mesajı gönderildi' : `WhatsApp hatası: ${wa.error}`,
        actorUserId: adminUserId,
      },
    });

    return { success: true };
  }
}
