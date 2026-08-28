import type { ModelResult } from './types';

export type DealType = 'self-commercialize' | 'regional-license' | 'global-license' | 'acquisition';

export interface DealTerms {
  type: DealType;
  upfrontUsd: number;
  royaltyPct: number;
  retainedCommercialPct: number;
  partnerDevelopmentFundingPct: number;
  milestonesUsd: number;
}

export interface DealResult {
  indicativeValueUsd: number;
  fundingBurdenUsd: number;
}

export const calculateDeal = (model: ModelResult, terms: DealTerms): DealResult => {
  if (terms.type === 'self-commercialize') {
    return {
      indicativeValueUsd: model.valuation.riskAdjustedNpvUsd,
      fundingBurdenUsd: model.peakFundingRequirementUsd,
    };
  }

  if (terms.type === 'acquisition') {
    return {
      indicativeValueUsd: terms.upfrontUsd + terms.milestonesUsd,
      fundingBurdenUsd: 0,
    };
  }

  const royaltyValue = model.cumulativeRevenueUsd * (terms.royaltyPct / 100);
  const retainedValue = model.valuation.riskAdjustedNpvUsd * (terms.retainedCommercialPct / 100);
  const fundingBurdenUsd = model.peakFundingRequirementUsd * (1 - terms.partnerDevelopmentFundingPct / 100);

  return {
    indicativeValueUsd: terms.upfrontUsd + terms.milestonesUsd + royaltyValue + retainedValue,
    fundingBurdenUsd,
  };
};
