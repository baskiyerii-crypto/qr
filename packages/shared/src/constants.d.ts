export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    COMPANY_ADMIN = "COMPANY_ADMIN",
    HR_MANAGER = "HR_MANAGER",
    BRANCH_MANAGER = "BRANCH_MANAGER",
    EMPLOYEE = "EMPLOYEE"
}
export declare enum AttendanceType {
    CHECK_IN = "CHECK_IN",
    CHECK_OUT = "CHECK_OUT"
}
export declare enum LeaveType {
    ANNUAL = "ANNUAL",
    SICK = "SICK",
    UNPAID = "UNPAID",
    OTHER = "OTHER"
}
export declare enum LeaveStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}
export declare enum TaskStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum TaskPriority {
    LOW = "LOW",
    NORMAL = "NORMAL",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum DeviceStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum ConversationType {
    DIRECT = "DIRECT",
    BROADCAST = "BROADCAST"
}
export declare enum PayrollStatus {
    DRAFT = "DRAFT",
    CALCULATED = "CALCULATED",
    APPROVED = "APPROVED",
    PAID = "PAID"
}
export declare const ADMIN_ROLES: UserRole[];
export declare const DEFAULT_GEOFENCE_RADIUS_M = 200;
export declare const MAX_CLOCK_SKEW_SECONDS = 300;
