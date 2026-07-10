import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomBytes } from 'crypto';
import { UserRole } from '@prisma/client';
import { DocumentsService } from './documents.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CompanyId, CurrentUser, JwtPayload, BranchScopeParam, BranchScope } from '../common/decorators';
import { createEmployeeDocumentSchema } from '@qr/shared';

const STAFF = [
  UserRole.COMPANY_ADMIN,
  UserRole.HR_MANAGER,
  UserRole.REGIONAL_MANAGER,
  UserRole.BRANCH_MANAGER,
];

@Controller('documents')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DocumentsController {
  constructor(private documents: DocumentsService) {}

  @Post('upload')
  @Roles(...STAFF)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${randomBytes(6).toString('hex')}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file?: { filename: string }) {
    if (!file?.filename) throw new BadRequestException('Dosya gerekli');
    return { success: true, data: { fileUrl: `/api/uploads/${file.filename}` } };
  }

  @Post()
  @Roles(...STAFF)
  async create(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Body() body: unknown,
  ) {
    const dto = createEmployeeDocumentSchema.parse(body);
    return { success: true, data: await this.documents.create(companyId, dto, scope) };
  }

  @Get()
  @Roles(...STAFF)
  async list(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Query('employeeId') employeeId?: string,
  ) {
    return { success: true, data: await this.documents.list(companyId, employeeId, scope) };
  }

  @Get('my')
  @Roles(UserRole.EMPLOYEE)
  async mine(@CurrentUser() user: JwtPayload) {
    return { success: true, data: await this.documents.listMine(user.employeeId!) };
  }

  @Delete(':id')
  @Roles(...STAFF)
  async remove(
    @CompanyId() companyId: string,
    @BranchScopeParam() scope: BranchScope,
    @Param('id') id: string,
  ) {
    return { success: true, data: await this.documents.remove(companyId, id, scope) };
  }
}
