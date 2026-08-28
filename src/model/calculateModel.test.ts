import { describe, expect, it } from 'vitest';
import { baseScenario, cloneScenario } from './assumptions';
import { calculateModel } from './calculateModel';

const approx = (value: number, target: number, pct = 0.01) =>
  Math.abs(value - target) <= Math.max(1, Math.abs(target) * pct);

describe('calculateModel', () => {
  it('produces zero revenue before the first commercial launch when named-patient markets are disabled', () => {
    const scenario = cloneScenario(baseScenario);
    scenario.countries.IND.enabled = false;
    const result = calculateModel(scenario);
    expect(result.years.find((row) => row.year === 2029)?.grossRevenueUsd).toBe(0);
  });

  it('does not repeat company development costs for every country', () => {
    const scenario = cloneScenario(baseScenario);
    const oneCountry = cloneScenario(baseScenario);
    Object.values(oneCountry.countries).forEach((country) => { country.enabled = country.id === 'USA'; });
    const all = calculateModel(scenario);
    const one = calculateModel(oneCountry);
    const year = 2029;
    expect(all.years.find((row) => row.year === year)?.developmentCostsUsd)
      .toBe(one.years.find((row) => row.year === year)?.developmentCostsUsd);
  });

  it('keeps EU5 population close to the workbook regional scale', () => {
    const result = calculateModel(baseScenario);
    const euPopulation = result.countryYears
      .filter((row) => row.year === 2028 && ['DEU','FRA','ITA','ESP','GBR'].includes(row.countryId))
      .reduce((sum, row) => sum + row.population, 0);
    expect(approx(euPopulation, 328_600_000, 0.02)).toBe(true);
  });

  it('named-patient access can generate capped early revenue independently of commercial share', () => {
    const scenario = cloneScenario(baseScenario);
    scenario.countries.IND.enabled = true;
    scenario.countries.IND.accessRoute = 'named-patient';
    const result = calculateModel(scenario);
    const india2027 = result.countryYears.find((row) => row.countryId === 'IND' && row.year === 2027);
    expect(india2027?.treatedPatients ?? 0).toBeGreaterThan(0);
    expect(india2027?.grossRevenueUsd ?? 0).toBeGreaterThan(0);
  });

  it('returns finite valuation outputs without a perpetual terminal value', () => {
    const result = calculateModel(baseScenario);
    expect(Number.isFinite(result.valuation.npvUsd)).toBe(true);
    expect(Number.isFinite(result.valuation.riskAdjustedNpvUsd)).toBe(true);
  });
});
