import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export interface BranchScope {
  mode: 'ALL' | 'LIST';
  branchIds: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  employeeId: string | null;
  resellerId: string | null;
  marketerId: string | null;
  branchScope: BranchScope;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);

export const CompanyId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.companyId as string | null;
});

export const ResellerId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.resellerId as string | null;
});

export const MarketerId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.marketerId as string | null;
});

export const BranchScopeParam = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return (request.user?.branchScope as BranchScope) ?? { mode: 'ALL', branchIds: [] };
});
