import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSurveyInput, SubmitSurveyResponseInput, UpdateSurveyInput } from '@qr/shared';
import { SurveyQuestionType, SurveyStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { BranchScope } from '../common/decorators';
import { branchWhere } from '../common/branch-scope';

@Injectable()
export class SurveysService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private whatsapp: WhatsappService,
  ) {}

  private async scopedEmployeeIds(companyId: string, scope: BranchScope): Promise<string[] | null> {
    if (scope.mode === 'ALL') return null;
    return (
      await this.prisma.employee.findMany({
        where: { companyId, isActive: true, ...branchWhere(scope) },
        select: { id: true },
      })
    ).map((e) => e.id);
  }

  private async resolveTargetEmployeeIds(
    companyId: string,
    dto: Pick<CreateSurveyInput, 'targetType' | 'departmentIds' | 'employeeIds'>,
    scope: BranchScope,
  ): Promise<string[]> {
    const baseWhere = { companyId, isActive: true, ...branchWhere(scope) };

    if (dto.targetType === 'ALL') {
      const employees = await this.prisma.employee.findMany({
        where: baseWhere,
        select: { id: true },
      });
      return employees.map((e) => e.id);
    }

    if (dto.targetType === 'DEPARTMENT' && dto.departmentIds?.length) {
      const employees = await this.prisma.employee.findMany({
        where: { ...baseWhere, departmentId: { in: dto.departmentIds } },
        select: { id: true },
      });
      return employees.map((e) => e.id);
    }

    if (dto.targetType === 'SELECTED' && dto.employeeIds?.length) {
      const employees = await this.prisma.employee.findMany({
        where: { ...baseWhere, id: { in: dto.employeeIds } },
        select: { id: true },
      });
      if (employees.length !== dto.employeeIds.length) {
        throw new ForbiddenException('Seçilen personellerden bazıları kapsam dışında');
      }
      return employees.map((e) => e.id);
    }

    throw new BadRequestException('Geçersiz hedefleme parametreleri');
  }

  async create(companyId: string, createdById: string, dto: CreateSurveyInput, scope: BranchScope) {
    for (const q of dto.questions) {
      if (q.type === 'SINGLE_CHOICE' && (!q.options || q.options.length < 2)) {
        throw new BadRequestException('Çoktan seçmeli sorular en az 2 seçenek içermelidir');
      }
    }

    const employeeIds = await this.resolveTargetEmployeeIds(companyId, dto, scope);
    if (!employeeIds.length) {
      throw new BadRequestException('Hedef personel bulunamadı');
    }

    const survey = await this.prisma.survey.create({
      data: {
        companyId,
        title: dto.title,
        description: dto.description,
        status: dto.status as SurveyStatus,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        createdById,
        questions: {
          create: dto.questions.map((q) => ({
            order: q.order,
            type: q.type as SurveyQuestionType,
            text: q.text,
            required: q.required,
            options:
              q.type === 'SINGLE_CHOICE' && q.options
                ? { create: q.options.map((o) => ({ label: o.label, order: o.order })) }
                : undefined,
          })),
        },
        assignments: { create: employeeIds.map((employeeId) => ({ employeeId })) },
      },
      include: {
        questions: { include: { options: true }, orderBy: { order: 'asc' } },
        _count: { select: { assignments: true, responses: true } },
      },
    });

    if (dto.status === 'ACTIVE') {
      for (const empId of employeeIds) {
        await this.notifications.notifyEmployee(
          companyId,
          empId,
          'Yeni Anket',
          dto.title,
          'SURVEY',
          { surveyId: survey.id },
        );
      }
    }

    return survey;
  }

  async list(companyId: string, scope: BranchScope) {
    const surveys = await this.prisma.survey.findMany({
      where: { companyId },
      include: {
        _count: { select: { assignments: true, responses: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (scope.mode === 'ALL') return surveys;

    const scopedEmployeeIds = (
      await this.prisma.employee.findMany({
        where: { companyId, isActive: true, ...branchWhere(scope) },
        select: { id: true },
      })
    ).map((e) => e.id);

    const filtered = [];
    for (const survey of surveys) {
      const assignments = await this.prisma.surveyAssignment.findMany({
        where: { surveyId: survey.id, employeeId: { in: scopedEmployeeIds } },
        select: { id: true },
      });
      if (assignments.length > 0) {
        filtered.push({
          ...survey,
          _count: {
            assignments: assignments.length,
            responses: await this.prisma.surveyResponse.count({
              where: { surveyId: survey.id, employeeId: { in: scopedEmployeeIds } },
            }),
          },
        });
      }
    }
    return filtered;
  }

  async getById(surveyId: string, companyId: string) {
    const survey = await this.prisma.survey.findFirst({
      where: { id: surveyId, companyId },
      include: {
        questions: { include: { options: true }, orderBy: { order: 'asc' } },
        _count: { select: { assignments: true, responses: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    if (!survey) throw new NotFoundException('Anket bulunamadı');
    return survey;
  }

  async getForEmployee(surveyId: string, employeeId: string) {
    const assignment = await this.prisma.surveyAssignment.findUnique({
      where: { surveyId_employeeId: { surveyId, employeeId } },
    });
    if (!assignment) throw new ForbiddenException('Bu ankete erişim yok');

    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: { include: { options: true }, orderBy: { order: 'asc' } },
        responses: { where: { employeeId }, select: { id: true, submittedAt: true } },
      },
    });
    if (!survey || survey.status !== SurveyStatus.ACTIVE) {
      throw new NotFoundException('Anket bulunamadı veya aktif değil');
    }
    if (survey.deadline && survey.deadline < new Date()) {
      throw new BadRequestException('Anket süresi dolmuş');
    }
    return survey;
  }

  async mySurveys(employeeId: string) {
    const assignments = await this.prisma.surveyAssignment.findMany({
      where: { employeeId },
      include: {
        survey: {
          include: {
            responses: { where: { employeeId }, select: { id: true, submittedAt: true } },
            _count: { select: { questions: true } },
          },
        },
      },
      orderBy: { survey: { createdAt: 'desc' } },
    });

    return assignments
      .filter((a) => a.survey.status === SurveyStatus.ACTIVE)
      .map((a) => ({
        ...a.survey,
        completed: a.survey.responses.length > 0,
      }));
  }

  async update(surveyId: string, companyId: string, dto: UpdateSurveyInput) {
    const survey = await this.prisma.survey.findFirst({ where: { id: surveyId, companyId } });
    if (!survey) throw new NotFoundException('Anket bulunamadı');

    return this.prisma.survey.update({
      where: { id: surveyId },
      data: {
        status: dto.status as SurveyStatus | undefined,
        title: dto.title,
        description: dto.description,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      },
      include: {
        questions: { include: { options: true }, orderBy: { order: 'asc' } },
        _count: { select: { assignments: true, responses: true } },
      },
    });
  }

  async submitResponse(
    surveyId: string,
    employeeId: string,
    dto: SubmitSurveyResponseInput,
  ) {
    const survey = await this.getForEmployee(surveyId, employeeId);

    const existing = await this.prisma.surveyResponse.findUnique({
      where: { surveyId_employeeId: { surveyId, employeeId } },
    });
    if (existing) throw new BadRequestException('Bu anketi zaten doldurdunuz');

    for (const q of survey.questions) {
      if (!q.required) continue;
      const answer = dto.answers.find((a) => a.questionId === q.id);
      if (!answer) throw new BadRequestException(`Zorunlu soru cevaplanmadı: ${q.text}`);
      if (q.type === SurveyQuestionType.SINGLE_CHOICE && !answer.optionId) {
        throw new BadRequestException(`Seçenek seçilmedi: ${q.text}`);
      }
      if (q.type === SurveyQuestionType.SHORT_TEXT && !answer.textValue?.trim()) {
        throw new BadRequestException(`Metin cevabı gerekli: ${q.text}`);
      }
    }

    return this.prisma.surveyResponse.create({
      data: {
        surveyId,
        employeeId,
        answers: {
          create: dto.answers.map((a) => ({
            questionId: a.questionId,
            optionId: a.optionId,
            textValue: a.textValue,
          })),
        },
      },
      include: { answers: true },
    });
  }

  async getParticipants(surveyId: string, companyId: string, scope: BranchScope) {
    await this.getById(surveyId, companyId);
    const scopedEmployeeIds = await this.scopedEmployeeIds(companyId, scope);

    const assignments = await this.prisma.surveyAssignment.findMany({
      where: scopedEmployeeIds
        ? { surveyId, employeeId: { in: scopedEmployeeIds } }
        : { surveyId },
      include: {
        employee: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            branch: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
      },
    });

    const responses = await this.prisma.surveyResponse.findMany({
      where: scopedEmployeeIds
        ? { surveyId, employeeId: { in: scopedEmployeeIds } }
        : { surveyId },
      select: { employeeId: true, submittedAt: true },
    });
    const responseMap = new Map(responses.map((r) => [r.employeeId, r.submittedAt]));

    const participants = assignments.map((a) => {
      const submittedAt = responseMap.get(a.employeeId);
      return {
        employeeId: a.employeeId,
        firstName: a.employee.user.firstName,
        lastName: a.employee.user.lastName,
        branchName: a.employee.branch?.name ?? null,
        departmentName: a.employee.department?.name ?? null,
        status: submittedAt ? ('completed' as const) : ('pending' as const),
        submittedAt: submittedAt ?? null,
      };
    });

    const completed = participants.filter((p) => p.status === 'completed').length;
    return {
      surveyId,
      totalAssigned: participants.length,
      totalCompleted: completed,
      totalPending: participants.length - completed,
      completionRate: participants.length ? Math.round((completed / participants.length) * 100) : 0,
      participants,
    };
  }

  async remindPending(surveyId: string, companyId: string, scope: BranchScope) {
    const survey = await this.getById(surveyId, companyId);
    if (survey.status !== SurveyStatus.ACTIVE) {
      throw new BadRequestException('Yalnızca aktif anketler için hatırlatma gönderilebilir');
    }

    const data = await this.getParticipants(surveyId, companyId, scope);
    const pending = data.participants.filter((p) => p.status === 'pending');

    let pushSent = 0;
    let whatsappSent = 0;
    for (const p of pending) {
      await this.notifications.notifyEmployee(
        companyId,
        p.employeeId,
        'Anket Hatırlatması',
        survey.title,
        'SURVEY',
        { surveyId },
      );
      pushSent++;

      const employee = await this.prisma.employee.findUnique({
        where: { id: p.employeeId },
        include: { user: { select: { phone: true, firstName: true } } },
      });
      if (employee?.user.phone) {
        const wa = await this.whatsapp.sendText(
          employee.user.phone,
          `Merhaba ${employee.user.firstName}, "${survey.title}" anketini henüz doldurmadınız. Lütfen mobil uygulamadan tamamlayın.`,
        );
        if (wa.ok) whatsappSent++;
      }
    }

    return { reminded: pending.length, pushSent, whatsappSent };
  }

  async exportExcel(surveyId: string, companyId: string, scope: BranchScope): Promise<ExcelJS.Buffer> {
    const survey = await this.getById(surveyId, companyId);
    const stats = await this.getStats(surveyId, companyId, scope);
    const participants = await this.getParticipants(surveyId, companyId, scope);

    const workbook = new ExcelJS.Workbook();
    const summary = workbook.addWorksheet('Özet');
    summary.addRow(['Anket', survey.title]);
    summary.addRow(['Hedef', stats.totalAssigned]);
    summary.addRow(['Tamamlayan', stats.totalCompleted]);
    summary.addRow(['Oran %', stats.completionRate]);

    const partSheet = workbook.addWorksheet('Katılım');
    partSheet.columns = [
      { header: 'Ad', key: 'first', width: 18 },
      { header: 'Soyad', key: 'last', width: 18 },
      { header: 'Şube', key: 'branch', width: 20 },
      { header: 'Departman', key: 'dept', width: 20 },
      { header: 'Durum', key: 'status', width: 14 },
      { header: 'Tarih', key: 'date', width: 20 },
    ];
    for (const p of participants.participants) {
      partSheet.addRow({
        first: p.firstName,
        last: p.lastName,
        branch: p.branchName ?? '',
        dept: p.departmentName ?? '',
        status: p.status === 'completed' ? 'Tamamladı' : 'Bekliyor',
        date: p.submittedAt ? new Date(p.submittedAt).toLocaleString('tr-TR') : '',
      });
    }

    const qSheet = workbook.addWorksheet('Sorular');
    qSheet.columns = [
      { header: 'Soru', key: 'q', width: 40 },
      { header: 'Cevap / Seçenek', key: 'a', width: 30 },
      { header: 'Adet', key: 'c', width: 10 },
    ];
    for (const q of stats.questions) {
      if (q.optionCounts) {
        for (const o of q.optionCounts) {
          qSheet.addRow({ q: q.text, a: o.label, c: o.count });
        }
      } else if (q.textAnswers) {
        for (const t of q.textAnswers) {
          qSheet.addRow({ q: q.text, a: t, c: 1 });
        }
      }
    }

    return workbook.xlsx.writeBuffer();
  }

  async exportPdf(surveyId: string, companyId: string, scope: BranchScope): Promise<Buffer> {
    const survey = await this.getById(surveyId, companyId);
    const stats = await this.getStats(surveyId, companyId, scope);
    const participants = await this.getParticipants(surveyId, companyId, scope);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).text('Anket Sonuç Raporu', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Anket: ${survey.title}`);
      doc.text(`Hedef: ${stats.totalAssigned} | Tamamlayan: ${stats.totalCompleted} | Oran: %${stats.completionRate}`);
      doc.moveDown();

      doc.fontSize(14).text('Katılım Durumu');
      doc.fontSize(10);
      for (const p of participants.participants) {
        const label = p.status === 'completed' ? 'Tamamladı' : 'Bekliyor';
        doc.text(
          `- ${p.firstName} ${p.lastName} (${p.branchName ?? '-'}) — ${label}`,
        );
      }
      doc.moveDown();

      doc.fontSize(14).text('Soru Dağılımları');
      doc.fontSize(10);
      for (const q of stats.questions) {
        doc.moveDown(0.5);
        doc.text(q.text, { underline: true });
        if (q.optionCounts) {
          for (const o of q.optionCounts) {
            doc.text(`  ${o.label}: ${o.count}`);
          }
        } else if (q.textAnswers) {
          for (const t of q.textAnswers.slice(0, 20)) {
            doc.text(`  • ${t}`);
          }
        }
      }
      doc.end();
    });
  }

  async getStats(surveyId: string, companyId: string, scope: BranchScope) {
    const survey = await this.getById(surveyId, companyId);
    const scopedEmployeeIds = await this.scopedEmployeeIds(companyId, scope);

    const responseFilter = scopedEmployeeIds
      ? { surveyId, employeeId: { in: scopedEmployeeIds } }
      : { surveyId };

    const totalAssigned = await this.prisma.surveyAssignment.count({
      where: scopedEmployeeIds
        ? { surveyId, employeeId: { in: scopedEmployeeIds } }
        : { surveyId },
    });
    const totalCompleted = await this.prisma.surveyResponse.count({ where: responseFilter });

    const questionStats = [];
    for (const q of survey.questions) {
      if (q.type === SurveyQuestionType.SINGLE_CHOICE) {
        const optionCounts = [];
        for (const opt of q.options) {
          const count = await this.prisma.surveyAnswer.count({
            where: {
              questionId: q.id,
              optionId: opt.id,
              response: scopedEmployeeIds
                ? { surveyId, employeeId: { in: scopedEmployeeIds } }
                : { surveyId },
            },
          });
          optionCounts.push({ optionId: opt.id, label: opt.label, count });
        }
        questionStats.push({ questionId: q.id, text: q.text, type: q.type, optionCounts });
      } else {
        const textAnswers = await this.prisma.surveyAnswer.findMany({
          where: {
            questionId: q.id,
            response: scopedEmployeeIds
              ? { surveyId, employeeId: { in: scopedEmployeeIds } }
              : { surveyId },
          },
          select: { textValue: true },
          take: 50,
        });
        questionStats.push({
          questionId: q.id,
          text: q.text,
          type: q.type,
          textAnswers: textAnswers.map((a) => a.textValue).filter(Boolean),
        });
      }
    }

    return {
      surveyId,
      title: survey.title,
      totalAssigned,
      totalCompleted,
      completionRate: totalAssigned ? Math.round((totalCompleted / totalAssigned) * 100) : 0,
      questions: questionStats,
    };
  }
}
