import { UserRole } from '@qr/shared';

export function homeRoute(role?: string): string {
  if (role === UserRole.MARKETER) return '/(marketer)';
  if (role === UserRole.SUPER_ADMIN) return '/(admin)';
  if (role === UserRole.RESELLER) return '/(reseller)';
  if (isCompanyStaff(role)) {
    return '/(tabs)';
  }
  return '/(tabs)';
}

export function isCompanyStaff(role?: string): boolean {
  return (
    role === UserRole.COMPANY_ADMIN ||
    role === UserRole.HR_MANAGER ||
    role === UserRole.REGIONAL_MANAGER ||
    role === UserRole.BRANCH_MANAGER
  );
}

export function isCompanyAdmin(role?: string): boolean {
  return role === UserRole.COMPANY_ADMIN || role === UserRole.HR_MANAGER;
}
