import type { CountryAssumption, IndicationId, RegionId } from './types';
import type { ExternalCountryProfile } from './worldBank';

const surgeryEligibilityByRegion: Record<RegionId, Record<IndicationId, number>> = {
  'North America': { gbm: 0.73, brainMetastasis: 0.20, opbt: 0.33 },
  Europe: { gbm: 0.70, brainMetastasis: 0.20, opbt: 0.33 },
  'Asia-Pacific': { gbm: 0.60, brainMetastasis: 0.18, opbt: 0.30 },
};

export interface ProxyMarketOptions {
  region: RegionId;
  priceUsd: number;
  peakSharePct: number;
  accessiblePopulationPct: number;
  launchYear: number;
  loeYear: number;
}

export function createProxyMarket(
  profile: ExternalCountryProfile,
  options: ProxyMarketOptions,
): CountryAssumption {
  return {
    id: profile.id,
    name: profile.name,
    geoName: profile.name,
    region: options.region,
    populationBaseYear: profile.populationYear,
    populationBase: profile.population,
    populationGrowthPct: 0,
    enabled: true,
    priceUsd: options.priceUsd,
    peakSharePct: options.peakSharePct,
    loeYear: options.loeYear,
    launchYearByIndication: {
      gbm: options.launchYear,
      brainMetastasis: options.launchYear + 3,
      opbt: options.launchYear + 5,
    },
    surgeryEligibility: surgeryEligibilityByRegion[options.region],
    accessiblePopulationPct: options.accessiblePopulationPct,
    accessRoute: 'commercial',
    assumptionStatus: 'proxy',
    assumptionNote: `Population from World Bank (${profile.populationYear}); epidemiology, surgery eligibility, pricing, access, launch and LoE are user-selected/proxy assumptions and require country-specific validation.`,
  };
}
