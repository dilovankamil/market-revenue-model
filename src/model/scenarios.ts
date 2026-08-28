import { baseScenario, cloneScenario } from './assumptions';
import type { Scenario } from './types';

const mapCountries = (scenario: Scenario, fn: (country: Scenario['countries'][keyof Scenario['countries']]) => void) => {
  Object.values(scenario.countries).forEach(fn);
};

export const buildScenarioPresets = (): Record<'conservative' | 'base' | 'expansion', Scenario> => {
  const conservative = cloneScenario(baseScenario);
  conservative.name = 'Conservative';
  conservative.erosionPct = 25;
  conservative.financial.discountRatePct = 12.5;
  // Stage PoS is already applied. This is an extra sensitivity haircut, not a second clinical PoS.
  conservative.financial.riskAdjustmentPct = 85;
  mapCountries(conservative, (country) => {
    country.peakSharePct = Math.max(10, country.peakSharePct * 0.6);
    country.priceUsd *= 0.8;
    country.launchYearByIndication.gbm += 2;
    country.launchYearByIndication.brainMetastasis += 2;
    country.launchYearByIndication.opbt += 2;
  });

  const base = cloneScenario(baseScenario);

  const expansion = cloneScenario(baseScenario);
  expansion.name = 'Expansion';
  expansion.indications.brainMetastasis.enabled = true;
  expansion.indications.opbt.enabled = true;
  expansion.countries.IND.enabled = true;
  expansion.countries.CHN.enabled = true;
  expansion.countries.CHN.accessRoute = 'commercial';
  expansion.patentExtensionYears = 2;
  expansion.financial.riskAdjustmentPct = 100;
  mapCountries(expansion, (country) => {
    if (country.accessRoute === 'commercial') country.peakSharePct = Math.min(45, country.peakSharePct + 10);
  });

  return { conservative, base, expansion };
};
