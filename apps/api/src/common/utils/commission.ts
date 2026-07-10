import { calculateCommissionSplit } from '@qr/shared';

export type CompanyCommissionContext = {
  resellerId?: string | null;
  marketerId?: string | null;
  reseller?: { commissionRate: number; marketerId?: string | null; marketer?: { commissionRate: number } | null } | null;
  marketer?: { commissionRate: number } | null;
};

export function resolveCommissionForCompany(company: CompanyCommissionContext, gross: number) {
  const hasReseller = !!company.resellerId;
  const marketer = company.marketer ?? (company.reseller?.marketer ?? null);
  const hasMarketer = !!company.marketerId || !!company.reseller?.marketerId;
  return {
    ...calculateCommissionSplit({
      gross,
      hasReseller,
      resellerRate: company.reseller?.commissionRate,
      hasMarketer,
      marketerRate: marketer?.commissionRate,
    }),
    marketerId: company.marketerId ?? company.reseller?.marketerId ?? null,
    resellerId: company.resellerId ?? null,
  };
}
