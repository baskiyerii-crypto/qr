import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { Response } from 'express';
import { UserRole, JobApplicationStatus } from '@prisma/client';
import { RecruitmentService } from './recruitment.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CompanyId, CurrentUser, JwtPayload, BranchScopeParam, BranchScope } from '../common/decorators';
import {
  createJobPostingSchema,
  updateJobPostingSchema,
  jobApplicationSchema,
  applicationPhoneQuerySchema,
  jobApplicationReviewSchema,
  approveJobApplicationSchema,
  createJobFormTemplateSchema,
  updateJobFormTemplateSchema,
} from '@qr/shared';

const CV_EXT = ['.pdf', '.doc', '.docx'];

@Controller('recruitment')
export class PublicRecruitmentController {
  constructor(private recruitment: RecruitmentService) {}

  @Get('public/careers/:companySlug')
  async careers(@Param('companySlug') companySlug: string) {
    return { success: true, data: await this.recruitment.listPublicCareers(companySlug) };
  }

  @Get('public/posting/:publicToken/form')
  async postingForm(@Param('publicToken') publicToken: string) {
    return { success: true, data: await this.recruitment.getPublicPostingForm(publicToken) };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('public/upload-cv/:publicToken')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const unique = `cv-${Date.now()}-${randomBytes(6).toString('hex')}`;
          cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!CV_EXT.includes(ext)) {
          cb(new BadRequestException('Yalnızca PDF, DOC veya DOCX yüklenebilir'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadCv(
    @Param('publicToken') publicToken: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Dosya gerekli');
    return { success: true, data: await this.recruitment.uploadPublicCv(publicToken, file.filename) };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('apply/:publicToken')
  async apply(@Param('publicToken') publicToken: string, @Body() body: unknown) {
    const dto = jobApplicationSchema.parse(body);
    return { success: true, data: await this.recruitment.apply(publicToken, dto) };
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get('status/:trackingCode')
  async status(@Param('trackingCode') trackingCode: string, @Query() query: unknown) {
    const { phone } = applicationPhoneQuerySchema.parse(query);
    return { success: true, data: await this.recruitment.getStatusByTracking(trackingCode, phone) };
  }
}

@Controller('recruitment/manage')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(
  UserRole.COMPANY_ADMIN,
  UserRole.HR_MANAGER,
  UserRole.REGIONAL_MANAGER,
  UserRole.BRANCH_MANAGER,
)
export class RecruitmentController {
  constructor(private recruitment: RecruitmentService) {}

  @Get('form-templates')
  async listTemplates(@CompanyId() companyId: string) {
    return { success: true, data: await this.recruitment.listFormTemplates(companyId) };
  }

  @Post('form-templates')
  async createTemplate(@CompanyId() companyId: string, @Body() body: unknown) {
    const dto = createJobFormTemplateSchema.parse(body);
    return { success: true, data: await this.recruitment.createFormTemplate(companyId, dto) };
  }

  @Patch('form-templates/:id')
  async updateTemplate(
    @CompanyId() companyId: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = updateJobFormTemplateSchema.parse(body);
    return { success: true, data: await this.recruitment.updateFormTemplate(companyId, id, dto) };
  }

  @Delete('form-templates/:id')
  async deleteTemplate(@CompanyId() companyId: string, @Param('id') id: string) {
    return { success: true, data: await this.recruitment.deleteFormTemplate(companyId, id) };
  }

  @Get('postings')
  async listPostings(@CompanyId() companyId: string, @BranchScopeParam() scope: BranchScope) {
    return { success: true, data: await this.recruitment.listPostings(companyId, scope) };
  }

  @Post('postings')
  async createPosting(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Body() body: unknown,
  ) {
    const dto = createJobPostingSchema.parse(body);
    return { success: true, data: await this.recruitment.createPosting(companyId, dto, scope) };
  }

  @Patch('postings/:id')
  async updatePosting(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = updateJobPostingSchema.parse(body);
    return { success: true, data: await this.recruitment.updatePosting(companyId, id, dto, scope) };
  }

  @Get('postings/:id/applications')
  async listApplications(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Param('id') id: string,
  ) {
    return { success: true, data: await this.recruitment.listApplications(companyId, id, scope) };
  }

  @Get('postings/:id/applications/export/excel')
  async exportApplications(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.recruitment.exportApplicationsExcel(companyId, id, scope);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=basvurular-${id.slice(0, 8)}.xlsx`);
    res.send(Buffer.from(buffer));
  }

  @Get('applications/:id/cv')
  async downloadCv(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const cvUrl = await this.recruitment.getApplicationCvUrl(companyId, id, scope);
    const path = this.recruitment.getCvFilePath(cvUrl);
    const filename = cvUrl.split('/').pop() ?? 'cv';
    res.download(path, filename);
  }

  @Get('applications/:id/cv.pdf')
  async downloadCvPdf(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.recruitment.generateApplicationPdf(companyId, id, scope);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=basvuru-${id.slice(0, 8)}.pdf`);
    res.send(buffer);
  }

  @Patch('applications/:id/review')
  async review(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @BranchScopeParam() scope: BranchScope,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = jobApplicationReviewSchema.parse(body);
    return {
      success: true,
      data: await this.recruitment.reviewApplication(
        companyId,
        id,
        user.sub,
        dto.status as JobApplicationStatus,
        dto.note,
        scope,
      ),
    };
  }

  @Post('applications/:id/approve')
  async approve(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @BranchScopeParam() scope: BranchScope,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const dto = approveJobApplicationSchema.parse(body);
    return { success: true, data: await this.recruitment.approve(companyId, id, user.sub, dto, scope) };
  }

  @Post('applications/:id/reject')
  async reject(
    @CompanyId() companyId: string,
    @CurrentUser() user: JwtPayload,
    @BranchScopeParam() scope: BranchScope,
    @Param('id') id: string,
    @Body() body: { note?: string },
  ) {
    return { success: true, data: await this.recruitment.reject(companyId, id, user.sub, body?.note, scope) };
  }
}
