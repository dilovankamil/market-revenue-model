import { describe, expect, it } from 'vitest';
import { baseScenario } from './assumptions';
import { calculateModel } from './calculateModel';
import { calculateDeal } from './deal';

describe('calculateDeal', () => {
  const model = calculateModel(baseScenario);

  it('uses rNPV and full funding burden for self-commercialization', () => {
    const result = calculateDeal(model, {
      type: 'self-commercialize',
      upfrontUsd: 0,
      milestonesUsd: 0,
      royaltyPct: 0,
      retainedCommercialPct: 100,
      partnerDevelopmentFundingPct: 0,
    });
    expect(result.indicativeValueUsd).toBe(model.valuation.riskAdjustedNpvUsd);
    expect(result.fundingBurdenUsd).toBe(model.peakFundingRequirementUsd);
  });

  it('discounts and risk-adjusts royalty economics', () => {
    const result = calculateDeal(model, {
      type: 'global-license',
      upfrontUsd: 100_000_000,
      milestonesUsd: 200_000_000,
      royaltyPct: 20,
      retainedCommercialPct: 0,
      partnerDevelopmentFundingPct: 100,
    });
    expect(result.royaltyNpvUsd).toBeGreaterThan(0);
    expect(result.royaltyNpvUsd).toBeLessThan(model.cumulativeRevenueUsd * 0.2);
    expect(result.riskAdjustedMilestonesUsd).toBe(140_000_000);
    expect(result.fundingBurdenUsd).toBe(0);
  });
});
