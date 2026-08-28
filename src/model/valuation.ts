import type { ValuationResult, YearResult } from './types';

export const calculateValuation = (
  years: YearResult[],
  startYear: number,
  discountRatePct: number,
  riskAdjustmentPct: number,
): ValuationResult => {
  const discountRate = discountRatePct / 100;
  const riskFactor = riskAdjustmentPct / 100;

  const npvUsd = years.reduce((sum, row) => {
    const t = row.year - startYear;
    return sum + row.netCashFlowUsd / Math.pow(1 + discountRate, t);
  }, 0);

  // Public/demo rNPV: development spend is not discounted by PoS, while positive
  // commercial cash flows are risk-adjusted. Replace with stage-conditional PoS
  // in the private/internal model once validated against the clinical strategy.
  const riskAdjustedNpvUsd = years.reduce((sum, row) => {
    const t = row.year - startYear;
    const adjusted = row.netCashFlowUsd > 0 ? row.netCashFlowUsd * riskFactor : row.netCashFlowUsd;
    return sum + adjusted / Math.pow(1 + discountRate, t);
  }, 0);

  return { npvUsd, riskAdjustedNpvUsd, discountRatePct, riskAdjustmentPct };
};
