export interface CommissionSplitInput {
  gross: number;
  hasReseller: boolean;
  resellerRate?: number;
  hasMarketer: boolean;
  marketerRate?: number;
}

export interface CommissionSplitResult {
  amount: number;
  resellerAmount: number;
  marketerAmount: number;
  platformAmount: number;
}

export function calculateCommissionSplit(input: CommissionSplitInput): CommissionSplitResult {
  const gross = input.gross;
  const resellerRate = input.hasReseller ? (input.resellerRate ?? 0) : 0;
  const resellerAmount = gross * resellerRate;
  const remainder = gross - resellerAmount;
  const marketerRate = input.hasMarketer ? (input.marketerRate ?? 0) : 0;
  const marketerAmount = remainder * marketerRate;
  const platformAmount = gross - resellerAmount - marketerAmount;
  return {
    amount: gross,
    resellerAmount: round2(resellerAmount),
    marketerAmount: round2(marketerAmount),
    platformAmount: round2(platformAmount),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
