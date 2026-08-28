export type IndicationId = 'gbm' | 'brainMetastasis' | 'opbt';
export type CountryId = 'USA' | 'DEU' | 'FRA' | 'ITA' | 'ESP' | 'GBR' | 'JPN' | 'IND' | 'CHN';
export type RegionId = 'North America' | 'Europe' | 'Asia-Pacific';
export type AccessRoute = 'commercial' | 'named-patient' | 'clinical-trial' | 'none';

export interface IndicationAssumption {
  id: IndicationId;
  name: string;
  incidencePer100kByRegion: Record<RegionId, number>;
  defaultRampYears: number;
  enabled: boolean;
}

export interface NamedPatientAssumption {
  startYear: number;
  centres: number;
  annualCentreGrowthPct: number;
  maxCentres: number;
  eligiblePatientsPerCentre: number;
  conversionPct: number;
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
  namedPatient?: NamedPatientAssumption;
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
}

export interface YearResult {
  year: number;
  grossRevenueUsd: number;
  cogsUsd: number;
  commercialOpexUsd: number;
  developmentCostsUsd: number;
  netCashFlowUsd: number;
  cumulativeCashFlowUsd: number;
  treatedPatients: number;
}

export interface ValuationResult {
  npvUsd: number;
  riskAdjustedNpvUsd: number;
  discountRatePct: number;
  riskAdjustmentPct: number;
}

export interface ModelResult {
  years: YearResult[];
  countryYears: CountryYearResult[];
  peakRevenueUsd: number;
  peakRevenueYear: number;
  cumulativeRevenueUsd: number;
  cumulativeCashFlowUsd: number;
  peakTreatedPatients: number;
  peakFundingRequirementUsd: number;
  breakEvenYear: number | null;
  valuation: ValuationResult;
}
