export type IndicationId = 'gbm' | 'brainMetastasis' | 'opbt';
export type CountryId = string;
export type RegionId = 'North America' | 'Europe' | 'Asia-Pacific';
export type AccessRoute = 'commercial' | 'clinical-trial' | 'none';
export type FinancingType = 'equity' | 'debt' | 'partner' | 'grant';
export type AssumptionStatus = 'configured' | 'proxy';

export interface IndicationAssumption {
  id: IndicationId;
  name: string;
  incidencePer100kByRegion: Record<RegionId, number>;
  defaultRampYears: number;
  enabled: boolean;
}

export interface CountryAssumption {
  id: CountryId;
  name: string;
  geoName: string;
  region: RegionId;
  populationBaseYear: number;
  populationBase: number;
  populationGrowthPct: number;
  enabled: boolean;
  priceUsd: number;
  peakSharePct: number;
  loeYear: number;
  launchYearByIndication: Record<IndicationId, number>;
  surgeryEligibility: Record<IndicationId, number>;
  accessiblePopulationPct: number;
  accessRoute: AccessRoute;
  assumptionStatus?: AssumptionStatus;
  assumptionNote?: string;
}

export interface DevelopmentStage {
  id: string;
  indication: IndicationId;
  phase: string;
  startDate: string;
  endDate: string;
  publicCostUsd: number;
  successProbabilityPct: number;
}

export interface CorporateCostLine {
  id: string;
  label: string;
  startYear: number;
  endYear: number;
  annualCostUsd: number;
  annualGrowthPct: number;
}

export interface FinancingEvent {
  id: string;
  label: string;
  year: number;
  amountUsd: number;
  type: FinancingType;
}

export interface FinancialAssumptions {
  cogsPerTreatmentUsd: number;
  commercialOpexPct: number;
  discountRatePct: number;
  corporateTaxPct: number;
  riskAdjustmentPct: number;
}

export interface Scenario {
  name: string;
  startYear: number;
  endYear: number;
  erosionPct: number;
  patentExtensionYears: number;
  countries: Record<CountryId, CountryAssumption>;
  indications: Record<IndicationId, IndicationAssumption>;
  developmentStages: DevelopmentStage[];
  corporateCosts: CorporateCostLine[];
  financingEvents: FinancingEvent[];
  financial: FinancialAssumptions;
}

export interface CountryYearResult {
  countryId: CountryId;
  year: number;
  population: number;
  eligiblePatients: number;
  treatedPatients: number;
  grossRevenueUsd: number;
  cogsUsd: number;
  commercialOpexUsd: number;
  contributionUsd: number;
  grossRevenueByIndicationUsd: Record<IndicationId, number>;
  contributionByIndicationUsd: Record<IndicationId, number>;
}

export interface YearResult {
  year: number;
  grossRevenueUsd: number;
  riskAdjustedGrossRevenueUsd: number;
  cogsUsd: number;
  commercialOpexUsd: number;
  developmentCostsUsd: number;
  corporateCostsUsd: number;
  taxUsd: number;
  netCashFlowUsd: number;
  riskAdjustedNetCashFlowUsd: number;
  cumulativeCashFlowUsd: number;
  financingCashUsd: number;
  cashBalanceUsd: number;
  treatedPatients: number;
}

export interface ValuationResult {
  npvUsd: number;
  riskAdjustedNpvUsd: number;
  discountRatePct: number;
  riskAdjustmentPct: number;
  commercializationSuccessPctByIndication: Record<IndicationId, number>;
}

export interface ModelResult {
  years: YearResult[];
  countryYears: CountryYearResult[];
  peakRevenueUsd: number;
  peakRevenueYear: number;
  cumulativeRevenueUsd: number;
  cumulativeCashFlowUsd: number;
  endingCashBalanceUsd: number;
  externalFundingUsd: number;
  peakTreatedPatients: number;
  peakFundingRequirementUsd: number;
  breakEvenYear: number | null;
  valuation: ValuationResult;
}
