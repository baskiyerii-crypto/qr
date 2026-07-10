import { BranchScope } from './decorators';

/**
 * Builds a Prisma `where` fragment that restricts records to the branches a user
 * may access. `ALL` scope returns an empty object (no restriction). `LIST` scope
 * restricts to the assigned branch ids. An empty LIST returns an impossible
 * filter so a manager with no assigned branch sees nothing.
 */
export function branchWhere(
  scope: BranchScope | undefined,
  field = 'branchId',
): Record<string, unknown> {
  if (!scope || scope.mode === 'ALL') return {};
  if (!scope.branchIds || scope.branchIds.length === 0) {
    return { [field]: '__none__' };
  }
  return { [field]: { in: scope.branchIds } };
}

/**
 * When a client passes an explicit branchId filter, intersect it with the
 * allowed scope. Returns undefined if the requested branch is outside scope.
 */
export function resolveBranchFilter(
  scope: BranchScope | undefined,
  requestedBranchId?: string,
): { where: Record<string, unknown>; allowed: boolean } {
  if (!scope || scope.mode === 'ALL') {
    return {
      where: requestedBranchId ? { branchId: requestedBranchId } : {},
      allowed: true,
    };
  }
  const ids = scope.branchIds ?? [];
  if (requestedBranchId) {
    if (!ids.includes(requestedBranchId)) return { where: { branchId: '__none__' }, allowed: false };
    return { where: { branchId: requestedBranchId }, allowed: true };
  }
  if (ids.length === 0) return { where: { branchId: '__none__' }, allowed: true };
  return { where: { branchId: { in: ids } }, allowed: true };
}

/**
 * Branch restriction nested under an `employee` relation (for records that don't
 * carry branchId directly, e.g. leave/overtime requests).
 */
export function employeeBranchWhere(scope: BranchScope | undefined): Record<string, unknown> {
  if (!scope || scope.mode === 'ALL') return {};
  const ids = scope.branchIds && scope.branchIds.length ? scope.branchIds : ['__none__'];
  return { employee: { branchId: { in: ids } } };
}

export function canAccessBranch(scope: BranchScope | undefined, branchId: string | null): boolean {
  if (!branchId) return true;
  if (!scope || scope.mode === 'ALL') return true;
  return (scope.branchIds ?? []).includes(branchId);
}
