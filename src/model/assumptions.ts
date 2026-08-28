import type { CountryAssumption, CountryId, RegionId, Scenario } from './types';

const EU_GBM_INCIDENCE = 4.52;
const US_GBM_INCIDENCE = 3.4229616188;
const JP_GBM_INCIDENCE = 2.1;
const BM_INCIDENCE = 19.8268283291;

const incidenceByRegion = (value: number): Record<RegionId, number> => ({
  'North America': value,
  Europe: value,
  'Asia-Pacific': value,
});

const launches = (gbm: number, expansion: number) => ({
  gbm,
  brainMetastasis: expansion,
  opbt: expansion,
});

const euCountry = (
  id: CountryId,
  name: string,
  geoName: string,
  populationBase: number,
  populationGrowthPct: number,
  assumptionStatus: CountryAssumption['assumptionStatus'] = 'proxy',
): CountryAssumption => ({
  id,
  name,
  geoName,
  region: 'Europe',
  populationBaseYear: 2026,
  populationBase,
  populationGrowthPct,
  enabled: true,
  priceUsd: 75_000,
  peakSharePct: 30,
  loeYear: 2040,
  launchYearByIndication: launches(2032, 2034),
  surgeryEligibility: { gbm: 0.741, brainMetastasis: 0.25, opbt: 0.33 },
  accessiblePopulationPct: 100,
  accessRoute: 'commercial',
  assumptionStatus,
  assumptionNote: assumptionStatus === 'proxy'
    ? 'EU regional commercial assumptions are applied as a planning proxy until country-specific pricing and access are validated.'
    : undefined,
});

/**
 * Public/demo assumptions only.
 * Detailed internal financing, salary and transaction assumptions from the finance workbook
 * are intentionally not committed to this public repository.
 *
 * Population basis:
 * - EU27: Eurostat demographic balance, population on 1 January 2026.
 * - Canada/Mexico: World Bank latest population observations, with planning growth assumptions.
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
      launchYearByIndication: launches(2032, 2034),
      surgeryEligibility: { gbm: 0.73, brainMetastasis: 0.25, opbt: 0.33 },
      accessiblePopulationPct: 100,
      accessRoute: 'commercial',
    },
    CAN: {
      id: 'CAN',
      name: 'Canada',
      geoName: 'Canada',
      region: 'North America',
      populationBaseYear: 2024,
      populationBase: 41_288_599,
      populationGrowthPct: 1.0,
      enabled: true,
      priceUsd: 70_000,
      peakSharePct: 25,
      loeYear: 2040,
      launchYearByIndication: launches(2032, 2034),
      surgeryEligibility: { gbm: 0.73, brainMetastasis: 0.25, opbt: 0.33 },
      accessiblePopulationPct: 100,
      accessRoute: 'commercial',
      assumptionStatus: 'proxy',
      assumptionNote: 'Population is sourced from the World Bank; pricing, penetration and launch timing are planning assumptions pending Canada-specific validation.',
    },
    MEX: {
      id: 'MEX',
      name: 'Mexico',
      geoName: 'Mexico',
      region: 'North America',
      populationBaseYear: 2025,
      populationBase: 131_946_900,
      populationGrowthPct: 0.8,
      enabled: true,
      priceUsd: 45_000,
      peakSharePct: 15,
      loeYear: 2040,
      launchYearByIndication: launches(2033, 2035),
      surgeryEligibility: { gbm: 0.60, brainMetastasis: 0.20, opbt: 0.30 },
      accessiblePopulationPct: 60,
      accessRoute: 'commercial',
      assumptionStatus: 'proxy',
      assumptionNote: 'Population is sourced from the World Bank; epidemiology, pricing, accessible population and launch timing are planning proxies pending Mexico-specific validation.',
    },

    // European Union, all selected by default. Existing EU5 assumptions remain the configured core;
    // additional member states inherit the same regional commercial assumptions as explicit proxies.
    BEL: euCountry('BEL', 'Belgium', 'Belgium', 11_955_300, 0.60),
    BGR: euCountry('BGR', 'Bulgaria', 'Bulgaria', 6_423_200, -0.22),
    CZE: euCountry('CZE', 'Czechia', 'Czech Republic', 10_915_800, 0.06),
    DNK: euCountry('DNK', 'Denmark', 'Denmark', 6_025_600, 0.55),
    DEU: euCountry('DEU', 'Germany', 'Germany', 83_467_100, -0.13, 'configured'),
    EST: euCountry('EST', 'Estonia', 'Estonia', 1_360_700, -0.68),
    IRL: euCountry('IRL', 'Ireland', 'Ireland', 5_510_600, 1.29),
    GRC: euCountry('GRC', 'Greece', 'Greece', 10_366_600, -0.06),
    ESP: euCountry('ESP', 'Spain', 'Spain', 49_590_100, 0.94, 'configured'),
    FRA: euCountry('FRA', 'France', 'France', 69_112_300, 0.33, 'configured'),
    HRV: euCountry('HRV', 'Croatia', 'Croatia', 3_876_000, 0.04),
    ITA: euCountry('ITA', 'Italy', 'Italy', 58_942_800, 0.00, 'configured'),
    CYP: euCountry('CYP', 'Cyprus', 'Cyprus', 996_600, 1.38),
    LVA: euCountry('LVA', 'Latvia', 'Latvia', 1_845_100, -0.83),
    LTU: euCountry('LTU', 'Lithuania', 'Lithuania', 2_887_600, -0.11),
    LUX: euCountry('LUX', 'Luxembourg', 'Luxembourg', 691_000, 1.32),
    HUN: euCountry('HUN', 'Hungary', 'Hungary', 9_488_400, -0.54),
    MLT: euCountry('MLT', 'Malta', 'Malta', 588_300, 2.44),
    NLD: euCountry('NLD', 'Netherlands', 'Netherlands', 18_130_200, 0.48),
    AUT: euCountry('AUT', 'Austria', 'Austria', 9_216_000, 0.20),
    POL: euCountry('POL', 'Poland', 'Poland', 36_332_800, -0.45),
    PRT: euCountry('PRT', 'Portugal', 'Portugal', 11_424_000, 0.32),
    ROU: euCountry('ROU', 'Romania', 'Romania', 19_041_300, -0.01),
    SVN: euCountry('SVN', 'Slovenia', 'Slovenia', 2_135_100, 0.20),
    SVK: euCountry('SVK', 'Slovakia', 'Slovakia', 5_409_400, -0.18),
    FIN: euCountry('FIN', 'Finland', 'Finland', 5_652_900, 0.30),
    SWE: euCountry('SWE', 'Sweden', 'Sweden', 10_605_500, 0.17),

    GBR: {
      ...euCountry('GBR', 'United Kingdom', 'United Kingdom', 69_000_000, 0.45, 'configured'),
      populationBaseYear: 2026,
      assumptionNote: undefined,
    },
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
      launchYearByIndication: launches(2034, 2036),
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
      launchYearByIndication: launches(2034, 2036),
      surgeryEligibility: { gbm: 0.50, brainMetastasis: 0.15, opbt: 0.33 },
      accessiblePopulationPct: 25,
      accessRoute: 'commercial',
      assumptionStatus: 'proxy',
      assumptionNote: 'Commercial timing, accessible population and pricing are scenario assumptions requiring country-specific validation.',
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
      launchYearByIndication: launches(2034, 2036),
      surgeryEligibility: { gbm: 0.55, brainMetastasis: 0.18, opbt: 0.33 },
      accessiblePopulationPct: 30,
      accessRoute: 'commercial',
      assumptionStatus: 'proxy',
      assumptionNote: 'Commercial timing, accessible population and pricing are scenario assumptions requiring country-specific validation.',
    },
  },
  developmentStages: [
    { id: 'gbm-p1', indication: 'gbm', phase: 'Phase I', startDate: '2027-06-01', endDate: '2029-05-31', publicCostUsd: 4_400_000, successProbabilityPct: 100 },
    { id: 'gbm-p2', indication: 'gbm', phase: 'Phase II', startDate: '2030-01-01', endDate: '2031-08-31', publicCostUsd: 24_700_000, successProbabilityPct: 70 },
    { id: 'gbm-p3', indication: 'gbm', phase: 'Confirmatory Phase III', startDate: '2031-12-01', endDate: '2033-11-30', publicCostUsd: 45_000_000, successProbabilityPct: 65 },
    { id: 'bm-p2', indication: 'brainMetastasis', phase: 'Bridging Phase II', startDate: '2032-03-01', endDate: '2033-05-31', publicCostUsd: 9_700_000, successProbabilityPct: 70 },
    { id: 'bm-p3', indication: 'brainMetastasis', phase: 'Confirmatory Phase III', startDate: '2033-11-01', endDate: '2035-10-31', publicCostUsd: 44_700_000, successProbabilityPct: 65 },
    { id: 'opbt-p2', indication: 'opbt', phase: 'Bridging Phase II', startDate: '2032-03-01', endDate: '2033-05-31', publicCostUsd: 9_700_000, successProbabilityPct: 70 },
    { id: 'opbt-p3', indication: 'opbt', phase: 'Confirmatory Phase III', startDate: '2033-11-01', endDate: '2035-10-31', publicCostUsd: 44_700_000, successProbabilityPct: 65 },
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
