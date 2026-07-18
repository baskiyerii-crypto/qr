import { z } from 'zod';
import {
  UserRole,
  AttendanceType,
  AttendanceMode,
  LeaveType,
  TaskPriority,
  BranchTransferType,
  JobPostingStatus,
  JobFormFieldType,
  AdvanceRequestType,
} from './constants';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerCompanySchema = z.object({
  companyName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10).max(20),
  resellerCode: z.string().optional(),
  marketerCode: z.string().optional(),
});

export const checkInSchema = z.object({
  branchId: z.string().uuid().optional(),
  qrToken: z.string().min(1).optional(),
  type: z.nativeEnum(AttendanceType),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().positive().optional(),
  deviceId: z.string().uuid(),
  clientTimestamp: z.string().datetime(),
  offBranchReason: z.string().max(500).optional(),
});

export const createBranchSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  geofenceRadiusM: z.number().min(50).max(5000).default(200),
});

export const createEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  departmentId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  position: z.string().optional(),
  monthlySalary: z.number().positive().optional(),
  hireDate: z.string().datetime().optional(),
});

export const createStaffUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum([
    UserRole.COMPANY_ADMIN,
    UserRole.HR_MANAGER,
    UserRole.REGIONAL_MANAGER,
    UserRole.BRANCH_MANAGER,
  ]),
  branchIds: z.array(z.string().uuid()).optional(),
});

export const assignBranchesSchema = z.object({
  branchIds: z.array(z.string().uuid()),
});

export const createResellerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10).max(20),
  companyName: z.string().min(2),
  code: z.string().min(3).max(20).regex(/^[A-Z0-9-]+$/),
  commissionRate: z.number().min(0).max(1).optional(),
  marketerId: z.string().uuid().optional(),
});

export const createMarketerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10).max(20),
  companyName: z.string().min(2),
  code: z.string().min(3).max(20).regex(/^[A-Z0-9-]+$/),
  commissionRate: z.number().min(0).max(1).optional(),
});

export const updateMarketerSchema = z.object({
  commissionRate: z.number().min(0).max(1).optional(),
  isActive: z.boolean().optional(),
  companyName: z.string().min(2).optional(),
  phone: z.string().min(10).max(20).optional(),
  iban: z.string().optional(),
});

export const createMarketerResellerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10).max(20),
  companyName: z.string().min(2),
  code: z.string().min(3).max(20).regex(/^[A-Z0-9-]+$/),
  commissionRate: z.number().min(0).max(1).optional(),
});

export const createMarketerCustomerSchema = z.object({
  companyName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10).max(20),
  planId: z.string().uuid().optional(),
});

export const createResellerCustomerSchema = z.object({
  companyName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10).max(20),
  planId: z.string().uuid().optional(),
});

export const createFeedbackSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(1).max(5000),
});

export const replyFeedbackSchema = z.object({
  body: z.string().min(1).max(5000),
});

export const registerPushTokenSchema = z.object({
  pushToken: z.string().min(1),
});

export const assignShiftSchema = z.object({
  shiftTemplateIds: z.array(z.string().uuid()).min(1),
});

export const createLeaveSchema = z.object({
  type: z.nativeEnum(LeaveType),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  employeeIds: z.array(z.string().uuid()).min(1),
  dueDate: z.string(),
  endDate: z.string().optional(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.NORMAL),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  requiresAck: z.boolean().default(false),
  deadline: z.string().datetime().optional(),
  targetType: z.enum(['ALL', 'DEPARTMENT', 'SELECTED']),
  departmentIds: z.array(z.string().uuid()).optional(),
  employeeIds: z.array(z.string().uuid()).optional(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  recipientEmployeeId: z.string().uuid().optional(),
  body: z.string().min(1).max(5000),
  broadcast: z.boolean().default(false),
  employeeIds: z.array(z.string().uuid()).optional(),
});

export const createConversationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('DIRECT'),
    recipientEmployeeId: z.string().uuid(),
    body: z.string().min(1).max(5000).optional(),
  }),
  z.object({
    type: z.literal('GROUP'),
    name: z.string().min(1).max(100),
    memberEmployeeIds: z.array(z.string().uuid()).min(1),
    memberUserIds: z.array(z.string().uuid()).optional(),
    body: z.string().min(1).max(5000).optional(),
  }),
]);

export const addGroupMembersSchema = z.object({
  memberEmployeeIds: z.array(z.string().uuid()).optional(),
  memberUserIds: z.array(z.string().uuid()).optional(),
});

export const surveyQuestionSchema = z.object({
  order: z.number().int().min(0),
  type: z.enum(['SINGLE_CHOICE', 'SHORT_TEXT']),
  text: z.string().min(1).max(500),
  required: z.boolean().default(true),
  options: z
    .array(
      z.object({
        label: z.string().min(1).max(200),
        order: z.number().int().min(0),
      }),
    )
    .optional(),
});

export const createSurveySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  deadline: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'ACTIVE']).default('ACTIVE'),
  targetType: z.enum(['ALL', 'DEPARTMENT', 'SELECTED']),
  departmentIds: z.array(z.string().uuid()).optional(),
  employeeIds: z.array(z.string().uuid()).optional(),
  questions: z.array(surveyQuestionSchema).min(1),
});

export const updateSurveySchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  deadline: z.string().datetime().optional(),
});

export const surveyAnswerSchema = z.object({
  questionId: z.string().uuid(),
  optionId: z.string().uuid().optional(),
  textValue: z.string().max(2000).optional(),
});

export const submitSurveyResponseSchema = z.object({
  answers: z.array(surveyAnswerSchema).min(1),
});

export const shiftTemplateSchema = z.object({
  name: z.string().min(1),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const companySettingsSchema = z.object({
  deviceBindingEnabled: z.boolean().optional(),
  dataRetentionDays: z.number().int().min(30).max(3650).optional(),
  overtimeMultiplier: z.number().min(1).max(3).optional(),
  workScheduleMode: z.enum(['SHIFT', 'STANDARD']).optional(),
  standardWorkDays: z.array(z.number().min(0).max(6)).min(1).max(7).optional(),
  standardStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  standardEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  attendanceMode: z.nativeEnum(AttendanceMode).optional(),
  mealBreakEnabled: z.boolean().optional(),
  mealBreakLimitMinutes: z.number().int().min(15).max(180).optional(),
  attendanceRemindersEnabled: z.boolean().optional(),
  reminderMinutesBefore: z.number().int().min(5).max(60).optional(),
});

export const resellerSurveySchema = z.object({
  dailyDeviceUsage: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  hasMarketingExperience: z.boolean(),
  marketingExperienceDetail: z.string().optional(),
  hasDataAnalysisExperience: z.boolean(),
  dataAnalysisTools: z.string().optional(),
  targetSectors: z.array(z.string()).min(1),
  estimatedMonthlyClients: z.number().int().min(0).max(1000),
  salesChannels: z.array(z.string()).min(1),
  whyReseller: z.string().min(20).max(2000),
  kvkkConsent: z.literal(true),
});

export const resellerApplicationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  companyName: z.string().optional(),
  city: z.string().optional(),
  experienceNotes: z.string().optional(),
  surveyAnswers: resellerSurveySchema,
});

export const applicationStatusQuerySchema = z.object({
  phone: z.string().min(10),
});

export const reviewApplicationSchema = z.object({
  reviewNotes: z.string().optional(),
});

export const approveApplicationSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9-]+$/),
  commissionRate: z.number().min(0).max(1).optional(),
  assignedPlanId: z.string().uuid().optional(),
  iban: z.string().optional(),
  taxNumber: z.string().optional(),
});

export const rejectApplicationSchema = z.object({
  rejectionReason: z.string().min(5).max(500),
});

export const updateSubscriptionPlanSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  monthlyPrice: z.number().positive().optional(),
  maxEmployees: z.number().int().positive().optional(),
  maxBranches: z.number().int().positive().optional(),
  platformShareRate: z.number().min(0).max(1).optional(),
  resellerShareRate: z.number().min(0).max(1).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const subscriptionPlanSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  monthlyPrice: z.number().positive(),
  maxEmployees: z.number().int().positive(),
  maxBranches: z.number().int().positive(),
  platformShareRate: z.number().min(0).max(1),
  resellerShareRate: z.number().min(0).max(1),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
}).refine((d) => d.platformShareRate + d.resellerShareRate <= 1.001, {
  message: 'Plan payları toplamı 1\'i geçemez',
});

export const commissionPayoutConfigSchema = z.object({
  payoutFrequency: z.enum(['INSTANT', 'WEEKLY', 'MONTHLY']).optional(),
  minimumPayoutAmount: z.number().min(0).optional(),
  holdDays: z.number().int().min(0).max(90).optional(),
});

export const platformSettingsSchema = z.object({
  defaultCommissionRate: z.number().min(0).max(1).optional(),
  monthlySubscriptionFee: z.number().positive().optional(),
  defaultPlanId: z.string().uuid().nullable().optional(),
  webAppUrl: z.string().optional(),
  requireEmployeeLocation: z.boolean().optional(),
});

export const integrationsSettingsSchema = z.object({
  evolutionApiUrl: z.string().optional(),
  evolutionApiKey: z.string().optional(),
  evolutionInstance: z.string().optional(),
  iyzicoApiKey: z.string().optional(),
  iyzicoSecretKey: z.string().optional(),
  iyzicoBaseUrl: z.string().url().optional(),
  webAppUrl: z.string().optional(),
});

export const adminCompanyPatchSchema = z.object({
  resellerId: z.string().uuid().nullable().optional(),
  marketerId: z.string().uuid().nullable().optional(),
  monthlySubscriptionFee: z.number().positive().optional(),
});

export const adminResellerPatchSchema = z.object({
  commissionRate: z.number().min(0).max(1).optional(),
  marketerId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  assignedPlanId: z.string().uuid().nullable().optional(),
  iban: z.string().optional(),
  taxNumber: z.string().optional(),
});

export const createSuperAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const adminSubscriptionPatchSchema = z.object({
  status: z.enum(['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8),
});

export const createBranchTransferSchema = z.object({
  employeeId: z.string().uuid(),
  toBranchId: z.string().uuid(),
  type: z.nativeEnum(BranchTransferType).default(BranchTransferType.TEMPORARY),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
  reason: z.string().max(500).optional(),
});

export const reviewSchema = z.object({
  approve: z.boolean(),
  note: z.string().max(500).optional(),
});

export const createJobPostingSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().max(5000).optional(),
  position: z.string().max(150).optional(),
  employmentType: z.string().max(50).optional(),
  salaryRange: z.string().max(100).optional(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  formTemplateId: z.string().uuid().optional(),
  status: z.nativeEnum(JobPostingStatus).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateJobPostingSchema = createJobPostingSchema.partial();

export const jobFormFieldSchema = z.object({
  order: z.number().int().min(0),
  type: z.nativeEnum(JobFormFieldType),
  label: z.string().min(1).max(200),
  required: z.boolean().default(false),
  options: z.array(z.string().min(1).max(100)).optional(),
});

export const createJobFormTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  isDefault: z.boolean().optional(),
  fields: z.array(jobFormFieldSchema).min(1),
});

export const updateJobFormTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
  fields: z.array(jobFormFieldSchema).min(1).optional(),
});

export const publicCvUploadSchema = z.object({
  publicToken: z.string().uuid(),
});

export const jobApplicationSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20),
  answers: z.record(z.string(), z.any()).optional(),
  cvUrl: z.string().optional(),
});

export const applicationPhoneQuerySchema = z.object({
  phone: z.string().min(10),
});

export const jobApplicationReviewSchema = z.object({
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']),
  note: z.string().max(500).optional(),
});

export const approveJobApplicationSchema = z.object({
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  position: z.string().optional(),
  monthlySalary: z.number().positive().optional(),
});

export const createShiftSwapSchema = z.object({
  targetEmployeeId: z.string().uuid().optional(),
  date: z.string().datetime(),
  toDate: z.string().datetime().optional(),
  reason: z.string().max(500).optional(),
});

export const createOvertimeSchema = z.object({
  date: z.string().datetime(),
  minutes: z.number().int().positive().max(1440),
  reason: z.string().max(500).optional(),
});

export const createAdvanceSchema = z.object({
  type: z.nativeEnum(AdvanceRequestType).default(AdvanceRequestType.ADVANCE),
  amount: z.number().positive(),
  reason: z.string().max(500).optional(),
});

export const createEmployeeDocumentSchema = z.object({
  employeeId: z.string().uuid(),
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(150),
  fileUrl: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type CreateStaffUserInput = z.infer<typeof createStaffUserSchema>;
export type CreateResellerInput = z.infer<typeof createResellerSchema>;
export type CreateMarketerInput = z.infer<typeof createMarketerSchema>;
export type UpdateMarketerInput = z.infer<typeof updateMarketerSchema>;
export type CreateMarketerResellerInput = z.infer<typeof createMarketerResellerSchema>;
export type CreateMarketerCustomerInput = z.infer<typeof createMarketerCustomerSchema>;
export type CreateResellerCustomerInput = z.infer<typeof createResellerCustomerSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
export type ResellerApplicationInput = z.infer<typeof resellerApplicationSchema>;
export type ApproveApplicationInput = z.infer<typeof approveApplicationSchema>;
export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>;
export type UpdateSubscriptionPlanInput = z.infer<typeof updateSubscriptionPlanSchema>;
export type CommissionPayoutConfigInput = z.infer<typeof commissionPayoutConfigSchema>;
export type AssignBranchesInput = z.infer<typeof assignBranchesSchema>;
export type CreateBranchTransferInput = z.infer<typeof createBranchTransferSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;
export type UpdateJobPostingInput = z.infer<typeof updateJobPostingSchema>;
export type CreateJobFormTemplateInput = z.infer<typeof createJobFormTemplateSchema>;
export type UpdateJobFormTemplateInput = z.infer<typeof updateJobFormTemplateSchema>;
export type JobFormFieldInput = z.infer<typeof jobFormFieldSchema>;
export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
export type JobApplicationReviewInput = z.infer<typeof jobApplicationReviewSchema>;
export type ApproveJobApplicationInput = z.infer<typeof approveJobApplicationSchema>;
export type CreateShiftSwapInput = z.infer<typeof createShiftSwapSchema>;
export type CreateOvertimeInput = z.infer<typeof createOvertimeSchema>;
export type CreateAdvanceInput = z.infer<typeof createAdvanceSchema>;
export type CreateEmployeeDocumentInput = z.infer<typeof createEmployeeDocumentSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type AddGroupMembersInput = z.infer<typeof addGroupMembersSchema>;
export type CreateSurveyInput = z.infer<typeof createSurveySchema>;
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>;
export type SubmitSurveyResponseInput = z.infer<typeof submitSurveyResponseSchema>;

export type BranchScope = { mode: 'ALL' | 'LIST'; branchIds: string[] };

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  publicId: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  employeeId: string | null;
  resellerId: string | null;
  marketerId: string | null;
  firstName: string;
  lastName: string;
  mustChangePassword?: boolean;
  branchScope?: BranchScope;
  requireEmployeeLocation?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
