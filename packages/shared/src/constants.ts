export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MARKETER = 'MARKETER',
  RESELLER = 'RESELLER',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  HR_MANAGER = 'HR_MANAGER',
  REGIONAL_MANAGER = 'REGIONAL_MANAGER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum AttendanceType {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
}

export enum LeaveType {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  UNPAID = 'UNPAID',
  OTHER = 'OTHER',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum DeviceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ConversationType {
  DIRECT = 'DIRECT',
  BROADCAST = 'BROADCAST',
}

export enum PayrollStatus {
  DRAFT = 'DRAFT',
  CALCULATED = 'CALCULATED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
}

export enum AttendanceStatus {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
}

export enum BranchTransferType {
  PERMANENT = 'PERMANENT',
  TEMPORARY = 'TEMPORARY',
}

export enum BranchTransferStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  ENDED = 'ENDED',
}

export enum JobPostingStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum JobApplicationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

export enum JobFormFieldType {
  TEXT = 'TEXT',
  TEXTAREA = 'TEXTAREA',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTI_CHOICE = 'MULTI_CHOICE',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  FILE_CV = 'FILE_CV',
}

export enum StaffRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum AdvanceRequestType {
  ADVANCE = 'ADVANCE',
  EXPENSE = 'EXPENSE',
}

export const ADMIN_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.MARKETER,
  UserRole.RESELLER,
  UserRole.COMPANY_ADMIN,
  UserRole.HR_MANAGER,
  UserRole.REGIONAL_MANAGER,
  UserRole.BRANCH_MANAGER,
];

export const COMPANY_STAFF_ROLES: UserRole[] = [
  UserRole.COMPANY_ADMIN,
  UserRole.HR_MANAGER,
  UserRole.REGIONAL_MANAGER,
  UserRole.BRANCH_MANAGER,
];

export const COMPANY_ADMIN_ROLES: UserRole[] = [
  UserRole.COMPANY_ADMIN,
  UserRole.HR_MANAGER,
];

export const DEFAULT_GEOFENCE_RADIUS_M = 200;
export const MAX_CLOCK_SKEW_SECONDS = 300;
export const QR_ROTATION_WINDOW_SECONDS = 30;
export const QR_ALLOWED_WINDOWS = 2;
