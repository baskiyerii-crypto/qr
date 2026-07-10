import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { join } from 'path';
import { existsSync } from 'fs';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import {
  CreateJobPostingInput,
  UpdateJobPostingInput,
  JobApplicationInput,
  ApproveJobApplicationInput,
  CreateJobFormTemplateInput,
  UpdateJobFormTemplateInput,
} from '@qr/shared';
import {
  JobPostingStatus,
  JobApplicationStatus,
  JobApplicationEventType,
  JobFormFieldType,
  UserRole,
  Prisma,
} from '@prisma/client';
import { BranchScope } from '../common/decorators';
import { canAccessBranch } from '../common/branch-scope';
import { createUniquePublicId } from '../common/utils/public-id';

@Injectable()
export class RecruitmentService {
  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
  ) {}

  private async generateTrackingCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      const exists = await this.prisma.jobApplication.findUnique({ where: { trackingCode: code } });
      if (!exists) return code;
    }
    return randomBytes(6).toString('hex').toUpperCase();
  }

  private postingScopeWhere(scope?: BranchScope): Prisma.JobPostingWhereInput {
    if (!scope || scope.mode === 'ALL') return {};
    const ids = scope.branchIds ?? [];
    return { OR: [{ branchId: null }, { branchId: { in: ids.length ? ids : ['__none__'] } }] };
  }

  private defaultFields() {
    return [
      { order: 0, type: JobFormFieldType.TEXT, label: 'Ad', required: true, options: null },
      { order: 1, type: JobFormFieldType.TEXT, label: 'Soyad', required: true, options: null },
      { order: 2, type: JobFormFieldType.TEXT, label: 'Telefon', required: true, options: null },
      { order: 3, type: JobFormFieldType.TEXT, label: 'E-posta', required: false, options: null },
      { order: 4, type: JobFormFieldType.TEXTAREA, label: 'Kendinizden bahsedin', required: false, options: null },
      { order: 5, type: JobFormFieldType.FILE_CV, label: 'CV Yükle', required: false, options: null },
    ];
  }

  async ensureDefaultTemplate(companyId: string) {
    const existing = await this.prisma.jobFormTemplate.findFirst({
      where: { companyId, isDefault: true },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
    if (existing) return existing;

    return this.prisma.jobFormTemplate.create({
      data: {
        companyId,
        name: 'Varsayılan Başvuru Formu',
        isDefault: true,
        fields: { create: this.defaultFields() },
      },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
  }

  async getTemplateForPosting(posting: { formTemplateId: string | null; companyId: string }) {
    if (posting.formTemplateId) {
      const tpl = await this.prisma.jobFormTemplate.findFirst({
        where: { id: posting.formTemplateId, companyId: posting.companyId },
        include: { fields: { orderBy: { order: 'asc' } } },
      });
      if (tpl) return tpl;
    }
    return this.ensureDefaultTemplate(posting.companyId);
  }

  private parseOptions(options: string | null): string[] {
    if (!options) return [];
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private validateAnswers(
    fields: Array<{ id: string; type: JobFormFieldType; label: string; required: boolean; options: string | null }>,
    answers: Record<string, unknown> | undefined,
    cvUrl?: string,
  ) {
    const result: Record<string, unknown> = {};
    for (const f of fields) {
      const val = answers?.[f.id];
      if (f.type === JobFormFieldType.FILE_CV) {
        if (f.required && !cvUrl) {
          throw new BadRequestException(`${f.label} zorunludur`);
        }
        if (cvUrl) result[f.id] = cvUrl;
        continue;
      }
      if (f.required && (val === undefined || val === null || val === '')) {
        throw new BadRequestException(`${f.label} zorunludur`);
      }
      if (val !== undefined && val !== null && val !== '') {
        if (f.type === JobFormFieldType.SINGLE_CHOICE) {
          const opts = this.parseOptions(f.options);
          if (opts.length && !opts.includes(String(val))) {
            throw new BadRequestException(`Geçersiz seçenek: ${f.label}`);
          }
        }
        if (f.type === JobFormFieldType.MULTI_CHOICE && Array.isArray(val)) {
          const opts = this.parseOptions(f.options);
          for (const v of val) {
            if (opts.length && !opts.includes(String(v))) {
              throw new BadRequestException(`Geçersiz seçenek: ${f.label}`);
            }
          }
        }
        result[f.id] = val;
      }
    }
    return result;
  }

  private extractCoreFromAnswers(
    fields: Array<{ id: string; label: string }>,
    answers: Record<string, unknown>,
    dto: JobApplicationInput,
  ) {
    let firstName = dto.firstName;
    let lastName = dto.lastName;
    let phone = dto.phone;
    let email = dto.email;

    for (const f of fields) {
      const val = answers[f.id];
      if (val === undefined || val === null) continue;
      const label = f.label.toLowerCase();
      if (label.includes('ad') && !label.includes('soyad') && label !== 'e-posta') firstName = String(val);
      if (label.includes('soyad')) lastName = String(val);
      if (label.includes('telefon')) phone = String(val);
      if (label.includes('e-posta') || label.includes('email')) email = String(val);
    }

    return { firstName, lastName, phone, email };
  }

  // ---------- Form templates ----------

  async listFormTemplates(companyId: string) {
    await this.ensureDefaultTemplate(companyId);
    return this.prisma.jobFormTemplate.findMany({
      where: { companyId },
      include: { fields: { orderBy: { order: 'asc' } }, _count: { select: { postings: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createFormTemplate(companyId: string, dto: CreateJobFormTemplateInput) {
    if (dto.isDefault) {
      await this.prisma.jobFormTemplate.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.jobFormTemplate.create({
      data: {
        companyId,
        name: dto.name,
        isDefault: dto.isDefault ?? false,
        fields: {
          create: dto.fields.map((f) => ({
            order: f.order,
            type: f.type as JobFormFieldType,
            label: f.label,
            required: f.required,
            options: f.options ? JSON.stringify(f.options) : null,
          })),
        },
      },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
  }

  async updateFormTemplate(companyId: string, id: string, dto: UpdateJobFormTemplateInput) {
    const tpl = await this.prisma.jobFormTemplate.findFirst({ where: { id, companyId } });
    if (!tpl) throw new NotFoundException('Şablon bulunamadı');
    if (dto.isDefault) {
      await this.prisma.jobFormTemplate.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }
    if (dto.fields) {
      await this.prisma.jobFormField.deleteMany({ where: { templateId: id } });
      await this.prisma.jobFormField.createMany({
        data: dto.fields.map((f) => ({
          templateId: id,
          order: f.order,
          type: f.type as JobFormFieldType,
          label: f.label,
          required: f.required,
          options: f.options ? JSON.stringify(f.options) : null,
        })),
      });
    }
    return this.prisma.jobFormTemplate.update({
      where: { id },
      data: { name: dto.name, isDefault: dto.isDefault },
      include: { fields: { orderBy: { order: 'asc' } } },
    });
  }

  async deleteFormTemplate(companyId: string, id: string) {
    const tpl = await this.prisma.jobFormTemplate.findFirst({
      where: { id, companyId },
      include: { _count: { select: { postings: true } } },
    });
    if (!tpl) throw new NotFoundException('Şablon bulunamadı');
    if (tpl.isDefault) throw new BadRequestException('Varsayılan şablon silinemez');
    if (tpl._count.postings > 0) throw new BadRequestException('Kullanımdaki şablon silinemez');
    await this.prisma.jobFormTemplate.delete({ where: { id } });
    return { deleted: true };
  }

  async getPublicPostingForm(publicToken: string) {
    const posting = await this.prisma.jobPosting.findUnique({
      where: { publicToken },
      include: { company: { select: { name: true, slug: true } }, branch: { select: { name: true } } },
    });
    if (!posting || posting.status !== JobPostingStatus.OPEN) {
      throw new NotFoundException('İlan bulunamadı');
    }
    const template = await this.getTemplateForPosting(posting);
    return {
      posting: {
        title: posting.title,
        description: posting.description,
        position: posting.position,
        employmentType: posting.employmentType,
        salaryRange: posting.salaryRange,
        companyName: posting.company.name,
        branchName: posting.branch?.name,
      },
      fields: template.fields.map((f) => ({
        id: f.id,
        order: f.order,
        type: f.type,
        label: f.label,
        required: f.required,
        options: this.parseOptions(f.options),
      })),
    };
  }

  async uploadPublicCv(publicToken: string, filename: string) {
    const posting = await this.prisma.jobPosting.findUnique({ where: { publicToken } });
    if (!posting || posting.status !== JobPostingStatus.OPEN) {
      throw new NotFoundException('İlan bulunamadı');
    }
    return { fileUrl: `/api/uploads/${filename}` };
  }

  async listPublicCareers(companySlug: string) {
    const company = await this.prisma.company.findUnique({ where: { slug: companySlug } });
    if (!company) throw new NotFoundException('Şirket bulunamadı');
    const postings = await this.prisma.jobPosting.findMany({
      where: { companyId: company.id, status: JobPostingStatus.OPEN },
      include: { branch: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return {
      company: { name: company.name, slug: company.slug },
      postings: postings.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        position: p.position,
        employmentType: p.employmentType,
        salaryRange: p.salaryRange,
        branchName: p.branch?.name,
        publicToken: p.publicToken,
      })),
    };
  }

  // ---------- Public ----------

  async apply(publicToken: string, dto: JobApplicationInput) {
    const posting = await this.prisma.jobPosting.findUnique({ where: { publicToken } });
    if (!posting || posting.status !== JobPostingStatus.OPEN) {
      throw new NotFoundException('İlan bulunamadı veya kapanmış');
    }
    if (posting.expiresAt && posting.expiresAt < new Date()) {
      throw new BadRequestException('İlan süresi dolmuş');
    }

    const template = await this.getTemplateForPosting(posting);
    const validatedAnswers = this.validateAnswers(template.fields, dto.answers, dto.cvUrl);
    const core = this.extractCoreFromAnswers(template.fields, validatedAnswers, dto);

    const trackingCode = await this.generateTrackingCode();
    const application = await this.prisma.jobApplication.create({
      data: {
        jobPostingId: posting.id,
        companyId: posting.companyId,
        firstName: core.firstName,
        lastName: core.lastName,
        email: core.email,
        phone: core.phone,
        answers: JSON.stringify(validatedAnswers),
        cvUrl: dto.cvUrl,
        status: JobApplicationStatus.SUBMITTED,
        trackingCode,
        events: { create: { type: JobApplicationEventType.SUBMITTED, note: 'Başvuru alındı' } },
      },
    });

    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const webAppUrl = settings?.webAppUrl || 'http://localhost:5173';
    const wa = await this.whatsapp.sendText(
      dto.phone,
      `Başvurunuz alındı.\nTakip kodu: ${trackingCode}\nDurum: ${webAppUrl}/kariyer/durum`,
    );
    if (wa.ok) {
      await this.prisma.jobApplicationEvent.create({
        data: {
          applicationId: application.id,
          type: JobApplicationEventType.WHATSAPP_SENT,
          note: 'Başvuru alındı bilgisi gönderildi',
        },
      });
    }

    return {
      trackingCode,
      status: application.status,
      message: 'Başvurunuz alındı. Takip kodunuzla durumu izleyebilirsiniz.',
    };
  }

  async getStatusByTracking(trackingCode: string, phone: string) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { trackingCode: trackingCode.toUpperCase() },
      include: {
        events: { orderBy: { createdAt: 'asc' } },
        jobPosting: { select: { title: true } },
      },
    });
    if (!app || app.phone !== phone) throw new NotFoundException('Başvuru bulunamadı');
    return {
      trackingCode: app.trackingCode,
      status: app.status,
      firstName: app.firstName,
      position: app.jobPosting.title,
      createdAt: app.createdAt,
      events: app.events.map((e) => ({ type: e.type, note: e.note, createdAt: e.createdAt })),
    };
  }

  // ---------- Company ----------

  async listPostings(companyId: string, scope?: BranchScope) {
    return this.prisma.jobPosting.findMany({
      where: { companyId, ...this.postingScopeWhere(scope) },
      include: {
        branch: { select: { name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPosting(companyId: string, dto: CreateJobPostingInput, scope?: BranchScope) {
    if (dto.branchId && !canAccessBranch(scope, dto.branchId)) {
      throw new ForbiddenException('Bu şube için ilan açma yetkiniz yok');
    }
    return this.prisma.jobPosting.create({
      data: {
        companyId,
        title: dto.title,
        description: dto.description,
        position: dto.position,
        employmentType: dto.employmentType,
        salaryRange: dto.salaryRange,
        branchId: dto.branchId,
        departmentId: dto.departmentId,
        formTemplateId: dto.formTemplateId,
        status: dto.status ?? JobPostingStatus.DRAFT,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async updatePosting(companyId: string, id: string, dto: UpdateJobPostingInput, scope?: BranchScope) {
    const posting = await this.prisma.jobPosting.findFirst({ where: { id, companyId } });
    if (!posting) throw new NotFoundException('İlan bulunamadı');
    if (!canAccessBranch(scope, posting.branchId)) throw new ForbiddenException('Yetkiniz yok');
    if (dto.branchId && !canAccessBranch(scope, dto.branchId)) {
      throw new ForbiddenException('Bu şube için yetkiniz yok');
    }
    return this.prisma.jobPosting.update({
      where: { id },
      data: {
        ...dto,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async listApplications(companyId: string, postingId: string, scope?: BranchScope) {
    const posting = await this.prisma.jobPosting.findFirst({ where: { id: postingId, companyId } });
    if (!posting) throw new NotFoundException('İlan bulunamadı');
    if (!canAccessBranch(scope, posting.branchId)) throw new ForbiddenException('Yetkiniz yok');
    const template = await this.getTemplateForPosting(posting);
    const apps = await this.prisma.jobApplication.findMany({
      where: { jobPostingId: postingId, companyId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return apps.map((app) => ({
      ...app,
      jobPosting: {
        ...posting,
        formTemplate: template,
      },
    }));
  }

  async exportApplicationsExcel(companyId: string, postingId: string, scope?: BranchScope): Promise<ExcelJS.Buffer> {
    const posting = await this.prisma.jobPosting.findFirst({ where: { id: postingId, companyId } });
    if (!posting) throw new NotFoundException('İlan bulunamadı');
    if (!canAccessBranch(scope, posting.branchId)) throw new ForbiddenException('Yetkiniz yok');

    const apps = await this.listApplications(companyId, postingId, scope);
    const template = await this.getTemplateForPosting(posting);
    const fieldMap = new Map(template.fields.map((f) => [f.id, f.label]));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Başvurular');
    const baseCols = ['Ad', 'Soyad', 'Telefon', 'E-posta', 'Durum', 'Takip Kodu', 'Tarih'];
    const dynamicCols = template.fields
      .filter((f) => f.type !== JobFormFieldType.FILE_CV)
      .map((f) => f.label);
    sheet.addRow([...baseCols, ...dynamicCols, 'CV']);

    for (const app of apps) {
      const answers: Record<string, unknown> = app.answers ? JSON.parse(app.answers) : {};
      const row: (string | number)[] = [
        app.firstName,
        app.lastName,
        app.phone,
        app.email ?? '',
        this.statusLabel(app.status),
        app.trackingCode,
        new Date(app.createdAt).toLocaleString('tr-TR'),
      ];
      for (const f of template.fields.filter((x) => x.type !== JobFormFieldType.FILE_CV)) {
        const v = answers[f.id];
        row.push(Array.isArray(v) ? v.join(', ') : v != null ? String(v) : '');
      }
      row.push(app.cvUrl ?? '');
      sheet.addRow(row);
    }
    void fieldMap;
    return workbook.xlsx.writeBuffer();
  }

  async generateApplicationPdf(companyId: string, applicationId: string, scope?: BranchScope): Promise<Buffer> {
    const app = await this.loadApplication(companyId, applicationId, scope);
    const template = await this.getTemplateForPosting(app.jobPosting);
    const answers: Record<string, unknown> = app.answers ? JSON.parse(app.answers) : {};

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Başvuru Özgeçmişi', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`İlan: ${app.jobPosting.title}`);
      doc.text(`Aday: ${app.firstName} ${app.lastName}`);
      doc.text(`Telefon: ${app.phone}`);
      if (app.email) doc.text(`E-posta: ${app.email}`);
      doc.text(`Durum: ${this.statusLabel(app.status)}`);
      doc.text(`Tarih: ${new Date(app.createdAt).toLocaleString('tr-TR')}`);
      doc.moveDown();
      doc.fontSize(14).text('Form Cevapları');
      doc.fontSize(10);
      for (const f of template.fields) {
        if (f.type === JobFormFieldType.FILE_CV) continue;
        const v = answers[f.id];
        if (v !== undefined && v !== null && v !== '') {
          doc.text(`${f.label}: ${Array.isArray(v) ? v.join(', ') : String(v)}`);
        }
      }
      if (app.cvUrl) {
        doc.moveDown();
        doc.text(`Yüklenen CV: ${app.cvUrl}`);
      }
      doc.end();
    });
  }

  getCvFilePath(cvUrl: string): string {
    const name = cvUrl.replace(/^\/api\/uploads\//, '');
    const path = join(process.cwd(), 'uploads', name);
    if (!existsSync(path)) throw new NotFoundException('CV dosyası bulunamadı');
    return path;
  }

  async getApplicationCvUrl(companyId: string, applicationId: string, scope?: BranchScope) {
    const app = await this.loadApplication(companyId, applicationId, scope);
    if (!app.cvUrl) throw new BadRequestException('CV yüklenmemiş');
    return app.cvUrl;
  }

  private async loadApplication(companyId: string, id: string, scope?: BranchScope) {
    const app = await this.prisma.jobApplication.findFirst({
      where: { id, companyId },
      include: { jobPosting: true },
    });
    if (!app) throw new NotFoundException('Başvuru bulunamadı');
    if (!canAccessBranch(scope, app.jobPosting.branchId)) throw new ForbiddenException('Yetkiniz yok');
    return app;
  }

  async reviewApplication(
    companyId: string,
    id: string,
    reviewerId: string,
    status: JobApplicationStatus,
    note?: string,
    scope?: BranchScope,
  ) {
    const app = await this.loadApplication(companyId, id, scope);
    const eventType = this.statusToEvent(status);
    const updated = await this.prisma.jobApplication.update({
      where: { id: app.id },
      data: {
        status,
        note,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        events: { create: { type: eventType, note: note ?? this.statusLabel(status) } },
      },
    });
    await this.notifyApplicant(app.phone, app.firstName, status, note);
    return updated;
  }

  async approve(
    companyId: string,
    id: string,
    reviewerId: string,
    dto: ApproveJobApplicationInput,
    scope?: BranchScope,
  ) {
    const app = await this.loadApplication(companyId, id, scope);
    if (app.hiredEmployeeId) throw new BadRequestException('Bu aday zaten işe alınmış');
    if (!app.email) throw new BadRequestException('Aday e-postası olmadan işe alınamaz');

    const existing = await this.prisma.user.findUnique({ where: { email: app.email } });
    if (existing) throw new ConflictException('Bu e-posta zaten kayıtlı');

    const tempPassword = randomBytes(4).toString('hex') + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const branchId = dto.branchId ?? app.jobPosting.branchId ?? undefined;

    const employee = await this.prisma.$transaction(async (tx) => {
      const publicId = await createUniquePublicId(tx);
      const user = await tx.user.create({
        data: {
          email: app.email!,
          passwordHash,
          role: UserRole.EMPLOYEE,
          companyId,
          firstName: app.firstName,
          lastName: app.lastName,
          phone: app.phone,
          publicId,
          isActive: true,
          mustChangePassword: true,
        },
      });
      const emp = await tx.employee.create({
        data: {
          companyId,
          userId: user.id,
          branchId,
          departmentId: dto.departmentId ?? app.jobPosting.departmentId ?? undefined,
          position: dto.position ?? app.jobPosting.position ?? undefined,
          monthlySalary: dto.monthlySalary,
          hireDate: new Date(),
        },
      });
      await tx.jobApplication.update({
        where: { id: app.id },
        data: {
          status: JobApplicationStatus.HIRED,
          hiredEmployeeId: emp.id,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          events: { create: { type: JobApplicationEventType.HIRED, note: 'İşe alındı' } },
        },
      });
      return emp;
    });

    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const webAppUrl = settings?.webAppUrl || 'http://localhost:5173';
    await this.whatsapp.sendText(
      app.phone,
      `Tebrikler ${app.firstName}! İşe alım başvurunuz onaylandı.\nGiriş: ${webAppUrl}/login\nE-posta: ${app.email}\nGeçici şifre: ${tempPassword}\nMobil uygulamadan giriş yapabilirsiniz.`,
    );

    return { employee, message: 'Aday işe alındı ve bilgilendirildi' };
  }

  async reject(companyId: string, id: string, reviewerId: string, note?: string, scope?: BranchScope) {
    return this.reviewApplication(companyId, id, reviewerId, JobApplicationStatus.REJECTED, note, scope);
  }

  private statusToEvent(status: JobApplicationStatus): JobApplicationEventType {
    switch (status) {
      case JobApplicationStatus.UNDER_REVIEW:
        return JobApplicationEventType.REVIEW_STARTED;
      case JobApplicationStatus.INTERVIEW:
        return JobApplicationEventType.INTERVIEW;
      case JobApplicationStatus.OFFER:
        return JobApplicationEventType.OFFER;
      case JobApplicationStatus.HIRED:
        return JobApplicationEventType.HIRED;
      case JobApplicationStatus.REJECTED:
        return JobApplicationEventType.REJECTED;
      default:
        return JobApplicationEventType.REVIEW_STARTED;
    }
  }

  private statusLabel(status: JobApplicationStatus): string {
    const labels: Record<string, string> = {
      SUBMITTED: 'Başvuru alındı',
      UNDER_REVIEW: 'İnceleme başladı',
      INTERVIEW: 'Mülakata çağrıldı',
      OFFER: 'Teklif yapıldı',
      HIRED: 'İşe alındı',
      REJECTED: 'Olumsuz sonuçlandı',
    };
    return labels[status] ?? status;
  }

  private async notifyApplicant(
    phone: string,
    firstName: string,
    status: JobApplicationStatus,
    note?: string,
  ) {
    if (status === JobApplicationStatus.SUBMITTED) return;
    const label = this.statusLabel(status);
    const settings = await this.prisma.platformSettings.findUnique({ where: { id: 'default' } });
    const webAppUrl = settings?.webAppUrl || 'http://localhost:5173';
    const statusHint =
      status === JobApplicationStatus.INTERVIEW
        ? '\nMülakat detayları için sizinle iletişime geçilecektir.'
        : status === JobApplicationStatus.OFFER
          ? '\nTeklif detayları paylaşılacaktır.'
          : '';
    await this.whatsapp.sendText(
      phone,
      `Merhaba ${firstName}, başvurunuzda güncelleme: ${label}.${statusHint}${note ? `\nNot: ${note}` : ''}\nDurum takibi: ${webAppUrl}/kariyer/durum`,
    );
  }
}
