export type IndicationId = 'gbm' | 'brainMetastasis' | 'opbt';
export type MarketId = 'US' | 'EU4UK' | 'Japan' | 'India';

export interface IndicationAssumption {
  id: IndicationId;
  name: string;
  incidencePer100k: number;
  launchYear: number;
  rampYears: number;
  enabled: boolean;
}

export interface MarketAssumption {
  id: MarketId;
  name: string;
  population: number;
  enabled: boolean;
  priceUsd: number;
  peakSharePct: number;
  loeYear: number;
  surgeryEligibility: Record<IndicationId, number>;
}

export interface DevelopmentCost {
  id: string;
  label: string;
  year: number;
  amountUsd: number;
  indication?: IndicationId;
}

export interface Scenario {
  name: string;
  startYear: number;
  endYear: number;
  erosionPct: number;
  operatingCostPct: number;
  patentExtensionYears: number;
  markets: Record<MarketId, MarketAssumption>;
  indications: Record<IndicationId, IndicationAssumption>;
  developmentCosts: DevelopmentCost[];
}

export interface MarketYearResult {
  marketId: MarketId;
  year: number;
  eligiblePatients: number;
  treatedPatients: number;
  grossRevenueUsd: number;
  operatingCostsUsd: number;
  developmentCostsUsd: number;
  netCashFlowUsd: number;
}

export interface YearResult {
  year: number;
  grossRevenueUsd: number;
  operatingCostsUsd: number;
  developmentCostsUsd: number;
  netCashFlowUsd: number;
  cumulativeCashFlowUsd: number;
  treatedPatients: number;
}

export interface ModelResult {
  years: YearResult[];
  marketYears: MarketYearResult[];
  peakRevenueUsd: number;
  peakRevenueYear: number;
  cumulativeRevenueUsd: number;
  cumulativeCashFlowUsd: number;
  peakTreatedPatients: number;
}
