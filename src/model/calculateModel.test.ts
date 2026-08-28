import { describe, expect, it } from 'vitest';
import { baseScenario, cloneScenario } from './assumptions';
import { calculateModel } from './calculateModel';
import { parseScenario, serializeScenario } from './scenarioIO';

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

  it('keeps financing separate from asset NPV while adding it to cash balance', () => {
    const scenario = cloneScenario(baseScenario);
    const baseline = calculateModel(scenario);
    scenario.financingEvents.push({ id: 'test-funding', label: 'Test funding', year: 2028, amountUsd: 50_000_000, type: 'equity' });
    const funded = calculateModel(scenario);
    expect(funded.valuation.npvUsd).toBe(baseline.valuation.npvUsd);
    expect(approx(funded.endingCashBalanceUsd - baseline.endingCashBalanceUsd, 50_000_000)).toBe(true);
  });

  it('includes private corporate costs in cash flow and valuation when loaded', () => {
    const scenario = cloneScenario(baseScenario);
    const baseline = calculateModel(scenario);
    scenario.corporateCosts.push({ id: 'private-opex', label: 'Private OpEx', startYear: 2028, endYear: 2028, annualCostUsd: 10_000_000, annualGrowthPct: 0 });
    const withCost = calculateModel(scenario);
    expect(withCost.years.find((row) => row.year === 2028)?.corporateCostsUsd).toBe(10_000_000);
    expect(withCost.valuation.npvUsd).toBeLessThan(baseline.valuation.npvUsd);
  });

  it('round-trips scenario export/import files', () => {
    const scenario = cloneScenario(baseScenario);
    const parsed = parseScenario(serializeScenario(scenario));
    expect(parsed.name).toBe(scenario.name);
    expect(parsed.countries.USA.priceUsd).toBe(scenario.countries.USA.priceUsd);
  });
});
