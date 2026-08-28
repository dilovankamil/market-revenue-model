import type { CountryAssumption, CountryId, RegionId, Scenario } from './types';

const EU_GBM_INCIDENCE = 4.52;
const US_GBM_INCIDENCE = 3.4229616188;
const JP_GBM_INCIDENCE = 2.1;
const BM_INCIDENCE = 19.8268283291;

const incidenceByRegion = (gbm: number): Record<RegionId, number> => ({
  'North America': gbm,
  Europe: gbm,
  'Asia-Pacific': gbm,
});

const launches = (gbm: number, expansion: number, japanDelay = 0) => ({
  gbm: gbm + japanDelay,
  brainMetastasis: expansion + japanDelay,
  opbt: expansion + japanDelay,
});

const euCountry = (
  id: CountryId,
  name: string,
  geoName: string,
  populationBase: number,
): CountryAssumption => ({
  id,
  name,
  geoName,
  region: 'Europe',
  populationBaseYear: 2028,
  populationBase,
  populationGrowthPct: 0.105,
  enabled: true,
  priceUsd: 75_000,
  peakSharePct: 30,
  loeYear: 2040,
  launchYearByIndication: launches(2031, 2033),
  surgeryEligibility: { gbm: 0.741, brainMetastasis: 0.25, opbt: 0.33 },
  accessiblePopulationPct: 100,
  accessRoute: 'commercial',
});

/**
 * Public/demo assumptions only.
 * Detailed internal financing, salary and transaction assumptions from the finance workbook
 * are intentionally not committed to this public repository.
 *
 * Epidemiology/source basis carried over from the model workbook:
 * GBM EU: https://pubmed.ncbi.nlm.nih.gov/40203511/
 * GBM US: https://pmc.ncbi.nlm.nih.gov/articles/PMC6352755/
 * GBM Japan: https://pubmed.ncbi.nlm.nih.gov/38206510/
 * BM incidence/operability: https://pubmed.ncbi.nlm.nih.gov/2405271/
 */
export const baseScenario: Scenario = {
  name: 'Base case',
  startYear: 2026,
  endYear: 2047,
  erosionPct: 15,
  patentExtensionYears: 0,
  indications: {
    gbm: {
      id: 'gbm',
      name: 'Glioblastoma',
      incidencePer100kByRegion: {
        'North America': US_GBM_INCIDENCE,
        Europe: EU_GBM_INCIDENCE,
        'Asia-Pacific': JP_GBM_INCIDENCE,
      },
      defaultRampYears: 6,
      enabled: true,
    },
    brainMetastasis: {
      id: 'brainMetastasis',
      name: 'Brain Metastases',
      incidencePer100kByRegion: incidenceByRegion(BM_INCIDENCE),
      defaultRampYears: 6,
      enabled: false,
    },
    opbt: {
      id: 'opbt',
      name: 'Other Primary Brain Tumors',
      incidencePer100kByRegion: {
        'North America': US_GBM_INCIDENCE,
        Europe: EU_GBM_INCIDENCE,
        'Asia-Pacific': JP_GBM_INCIDENCE,
      },
      defaultRampYears: 6,
      enabled: false,
    },
  },
  countries: {
    USA: {
      id: 'USA',
      name: 'United States',
      geoName: 'United States of America',
      region: 'North America',
      populationBaseYear: 2028,
      populationBase: 353_050_000,
      populationGrowthPct: 0.543,
      enabled: true,
      priceUsd: 75_000,
      peakSharePct: 30,
      loeYear: 2037,
      launchYearByIndication: launches(2030, 2032),
      surgeryEligibility: { gbm: 0.73, brainMetastasis: 0.25, opbt: 0.33 },
      accessiblePopulationPct: 100,
      accessRoute: 'commercial',
    },
    DEU: euCountry('DEU', 'Germany', 'Germany', 84_500_000),
    FRA: euCountry('FRA', 'France', 'France', 68_300_000),
    ITA: euCountry('ITA', 'Italy', 'Italy', 58_500_000),
    ESP: euCountry('ESP', 'Spain', 'Spain', 49_500_000),
    GBR: euCountry('GBR', 'United Kingdom', 'United Kingdom', 67_800_000),
    JPN: {
      id: 'JPN',
      name: 'Japan',
      geoName: 'Japan',
      region: 'Asia-Pacific',
      populationBaseYear: 2028,
      populationBase: 121_221_170,
      populationGrowthPct: -0.52,
      enabled: true,
      priceUsd: 75_000,
      peakSharePct: 30,
      loeYear: 2040,
      launchYearByIndication: launches(2033, 2035),
      surgeryEligibility: { gbm: 0.886, brainMetastasis: 0.25, opbt: 0.33 },
      accessiblePopulationPct: 100,
      accessRoute: 'commercial',
    },
    IND: {
      id: 'IND',
      name: 'India',
      geoName: 'India',
      region: 'Asia-Pacific',
      populationBaseYear: 2028,
      populationBase: 1_480_000_000,
      populationGrowthPct: 0.75,
      enabled: false,
      priceUsd: 25_000,
      peakSharePct: 15,
      loeYear: 2040,
      launchYearByIndication: launches(2032, 2034),
      surgeryEligibility: { gbm: 0.50, brainMetastasis: 0.15, opbt: 0.33 },
      accessiblePopulationPct: 25,
      accessRoute: 'named-patient',
      namedPatient: {
        startYear: 2027,
        centres: 4,
        annualCentreGrowthPct: 40,
        maxCentres: 35,
        eligiblePatientsPerCentre: 20,
        conversionPct: 50,
      },
    },
    CHN: {
      id: 'CHN',
      name: 'China',
      geoName: 'China',
      region: 'Asia-Pacific',
      populationBaseYear: 2028,
      populationBase: 1_400_000_000,
      populationGrowthPct: -0.15,
      enabled: false,
      priceUsd: 35_000,
      peakSharePct: 15,
      loeYear: 2040,
      launchYearByIndication: launches(2033, 2035),
      surgeryEligibility: { gbm: 0.55, brainMetastasis: 0.18, opbt: 0.33 },
      accessiblePopulationPct: 30,
      accessRoute: 'commercial',
      assumptionNote: 'Commercial access is a scenario assumption and requires validation before external use.',
    },
  },
  developmentStages: [
    { id: 'gbm-p1', indication: 'gbm', phase: 'Phase I', startDate: '2026-06-01', endDate: '2028-05-31', publicCostUsd: 4_400_000, successProbabilityPct: 100 },
    { id: 'gbm-p2', indication: 'gbm', phase: 'Phase II', startDate: '2029-01-01', endDate: '2030-08-31', publicCostUsd: 24_700_000, successProbabilityPct: 70 },
    { id: 'gbm-p3', indication: 'gbm', phase: 'Phase III', startDate: '2030-12-01', endDate: '2032-11-30', publicCostUsd: 45_000_000, successProbabilityPct: 65 },
    { id: 'bm-p2', indication: 'brainMetastasis', phase: 'Bridging Phase II', startDate: '2031-03-01', endDate: '2032-05-31', publicCostUsd: 9_700_000, successProbabilityPct: 70 },
    { id: 'bm-p3', indication: 'brainMetastasis', phase: 'Phase III', startDate: '2032-11-01', endDate: '2034-10-31', publicCostUsd: 44_700_000, successProbabilityPct: 65 },
    { id: 'opbt-p2', indication: 'opbt', phase: 'Bridging Phase II', startDate: '2031-03-01', endDate: '2032-05-31', publicCostUsd: 9_700_000, successProbabilityPct: 70 },
    { id: 'opbt-p3', indication: 'opbt', phase: 'Phase III', startDate: '2032-11-01', endDate: '2034-10-31', publicCostUsd: 44_700_000, successProbabilityPct: 65 },
  ],
  corporateCosts: [],
  financingEvents: [],
  financial: {
    cogsPerTreatmentUsd: 500,
    commercialOpexPct: 8,
    discountRatePct: 10.135,
    corporateTaxPct: 20,
    riskAdjustmentPct: 100,
  },
};

// Scenario state is plain JSON data, so a JSON round-trip provides a robust deep clone
// without relying on structuredClone(), which is unavailable in some mobile/embedded browsers.
export const cloneScenario = (scenario: Scenario): Scenario => JSON.parse(JSON.stringify(scenario)) as Scenario;
