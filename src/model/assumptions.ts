import type { Scenario } from './types';

export const baseScenario: Scenario = {
  name: 'Base case',
  startYear: 2028,
  endYear: 2047,
  erosionPct: 2.5,
  operatingCostPct: 5,
  patentExtensionYears: 0,
  indications: {
    gbm: {
      id: 'gbm',
      name: 'Glioblastoma',
      incidencePer100k: 3,
      launchYear: 2030,
      rampYears: 6,
      enabled: true,
    },
    brainMetastasis: {
      id: 'brainMetastasis',
      name: 'Brain Metastasis',
      incidencePer100k: 20,
      launchYear: 2033,
      rampYears: 4,
      enabled: false,
    },
    opbt: {
      id: 'opbt',
      name: 'Other Primary Brain Tumors',
      incidencePer100k: 3,
      launchYear: 2036,
      rampYears: 4,
      enabled: false,
    },
  },
  markets: {
    EU4UK: {
      id: 'EU4UK',
      name: 'EU4 + UK',
      population: 325_000_000,
      enabled: true,
      priceUsd: 70_000,
      peakSharePct: 30,
      loeYear: 2040,
      surgeryEligibility: {
        gbm: 0.7,
        brainMetastasis: 0.2,
        opbt: 0.33,
      },
    },
    US: {
      id: 'US',
      name: 'United States',
      population: 340_000_000,
      enabled: true,
      priceUsd: 70_000,
      peakSharePct: 30,
      loeYear: 2037,
      surgeryEligibility: {
        gbm: 0.73,
        brainMetastasis: 0.2,
        opbt: 0.33,
      },
    },
    Japan: {
      id: 'Japan',
      name: 'Japan',
      population: 125_000_000,
      enabled: true,
      priceUsd: 70_000,
      peakSharePct: 30,
      loeYear: 2040,
      surgeryEligibility: {
        gbm: 0.7,
        brainMetastasis: 0.2,
        opbt: 0.33,
      },
    },
    India: {
      id: 'India',
      name: 'India',
      population: 300_000_000,
      enabled: false,
      priceUsd: 25_000,
      peakSharePct: 30,
      loeYear: 2040,
      surgeryEligibility: {
        gbm: 0.5,
        brainMetastasis: 0.15,
        opbt: 0.33,
      },
    },
  },
  developmentCosts: [
    { id: 'phase2', label: 'Phase II programme', year: 2028, amountUsd: 30_000_000, indication: 'gbm' },
    { id: 'bm-bridge', label: 'Brain Metastasis bridging study', year: 2030, amountUsd: 25_000_000, indication: 'brainMetastasis' },
    { id: 'opbt-bridge', label: 'OPBT bridging study', year: 2033, amountUsd: 25_000_000, indication: 'opbt' },
  ],
};

export const cloneScenario = (scenario: Scenario): Scenario =>
  structuredClone(scenario);
