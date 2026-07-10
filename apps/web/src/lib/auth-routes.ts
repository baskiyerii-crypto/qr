import { UserRole } from '@qr/shared';
import type { AuthUser } from '@qr/shared';

export function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    clearSession();
    return null;
  }
}

export function getHomeRoute(role?: string): string {
  if (role === UserRole.MARKETER) return '/marketer';
  if (role === UserRole.RESELLER) return '/reseller';
  if (role === UserRole.SUPER_ADMIN) return '/admin';
  if (isCompanyStaff(role)) return '/dashboard';
  return '/login';
}

export function canAccessCompanyPanel(role?: string): boolean {
  return isCompanyStaff(role);
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
