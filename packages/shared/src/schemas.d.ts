import { z } from 'zod';
import { UserRole, AttendanceType, LeaveType, TaskPriority } from './constants';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerCompanySchema: z.ZodObject<{
    companyName: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    companyName: string;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
}, {
    email: string;
    password: string;
    companyName: string;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
}>;
export declare const checkInSchema: z.ZodObject<{
    branchId: z.ZodString;
    qrToken: z.ZodString;
    type: z.ZodNativeEnum<typeof AttendanceType>;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    accuracy: z.ZodOptional<z.ZodNumber>;
    deviceId: z.ZodString;
    clientTimestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: AttendanceType;
    branchId: string;
    qrToken: string;
    latitude: number;
    longitude: number;
    deviceId: string;
    clientTimestamp: string;
    accuracy?: number | undefined;
}, {
    type: AttendanceType;
    branchId: string;
    qrToken: string;
    latitude: number;
    longitude: number;
    deviceId: string;
    clientTimestamp: string;
    accuracy?: number | undefined;
}>;
export declare const createBranchSchema: z.ZodObject<{
    name: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    geofenceRadiusM: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
    name: string;
    geofenceRadiusM: number;
    address?: string | undefined;
}, {
    latitude: number;
    longitude: number;
    name: string;
    address?: string | undefined;
    geofenceRadiusM?: number | undefined;
}>;
export declare const createEmployeeSchema: z.ZodObject<{
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    branchId: z.ZodOptional<z.ZodString>;
    position: z.ZodOptional<z.ZodString>;
    monthlySalary: z.ZodOptional<z.ZodNumber>;
    hireDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
    branchId?: string | undefined;
    departmentId?: string | undefined;
    position?: string | undefined;
    monthlySalary?: number | undefined;
    hireDate?: string | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | undefined;
    branchId?: string | undefined;
    departmentId?: string | undefined;
    position?: string | undefined;
    monthlySalary?: number | undefined;
    hireDate?: string | undefined;
}>;
export declare const createLeaveSchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof LeaveType>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason?: string | undefined;
}, {
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason?: string | undefined;
}>;
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    employeeIds: z.ZodArray<z.ZodString, "many">;
    dueDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodNativeEnum<typeof TaskPriority>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    employeeIds: string[];
    dueDate: string;
    priority: TaskPriority;
    endDate?: string | undefined;
    description?: string | undefined;
}, {
    title: string;
    employeeIds: string[];
    dueDate: string;
    endDate?: string | undefined;
    description?: string | undefined;
    priority?: TaskPriority | undefined;
}>;
export declare const createAnnouncementSchema: z.ZodObject<{
    title: z.ZodString;
    body: z.ZodString;
    requiresAck: z.ZodDefault<z.ZodBoolean>;
    deadline: z.ZodOptional<z.ZodString>;
    targetType: z.ZodEnum<["ALL", "DEPARTMENT", "SELECTED"]>;
    departmentIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    employeeIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    body: string;
    requiresAck: boolean;
    targetType: "ALL" | "DEPARTMENT" | "SELECTED";
    employeeIds?: string[] | undefined;
    deadline?: string | undefined;
    departmentIds?: string[] | undefined;
}, {
    title: string;
    body: string;
    targetType: "ALL" | "DEPARTMENT" | "SELECTED";
    employeeIds?: string[] | undefined;
    requiresAck?: boolean | undefined;
    deadline?: string | undefined;
    departmentIds?: string[] | undefined;
}>;
export declare const sendMessageSchema: z.ZodObject<{
    conversationId: z.ZodOptional<z.ZodString>;
    recipientEmployeeId: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    broadcast: z.ZodDefault<z.ZodBoolean>;
    employeeIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    body: string;
    broadcast: boolean;
    employeeIds?: string[] | undefined;
    conversationId?: string | undefined;
    recipientEmployeeId?: string | undefined;
}, {
    body: string;
    employeeIds?: string[] | undefined;
    conversationId?: string | undefined;
    recipientEmployeeId?: string | undefined;
    broadcast?: boolean | undefined;
}>;
export declare const shiftTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    dayOfWeek: z.ZodNumber;
    startTime: z.ZodString;
    endTime: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}, {
    name: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    companyId: string | null;
    employeeId: string | null;
    firstName: string;
    lastName: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
