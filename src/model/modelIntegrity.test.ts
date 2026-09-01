import { describe, expect, it } from 'vitest';
import { calculateModel } from './calculateModel';
import { createDefaultScenario } from './defaultScenario';

const close = (left: number, right: number) =>
  Math.abs(left - right) <= Math.max(0.000001, Math.abs(right) * 0.000001);

describe('public model integrity', () => {
  it('counts each enabled development budget once', () => {
    const scenario = createDefaultScenario();
    const result = calculateModel(scenario);
    const configured = scenario.developmentStages
      .filter((stage) => scenario.indications[stage.indication].enabled)
      .reduce((sum, stage) => sum + stage.publicCostUsd, 0);
    const modeled = result.years.reduce((sum, year) => sum + year.developmentCostsUsd, 0);
    expect(close(modeled, configured)).toBe(true);
  });

  it('keeps treated volume within the eligible funnel and revenue at zero before launch', () => {
    const scenario = createDefaultScenario();
    const result = calculateModel(scenario);
    result.countryYears.forEach((row) => {
      const country = scenario.countries[row.countryId];
      expect(row.treatedPatients).toBeLessThanOrEqual(row.eligiblePatients + 0.000001);
      expect(close(row.cogsUsd, row.treatedPatients * scenario.financial.cogsPerTreatmentUsd)).toBe(true);
      if (row.year < country.launchYearByIndication.gbm) {
        expect(row.treatedPatients).toBe(0);
        expect(row.grossRevenueUsd).toBe(0);
      }
    });
  });

  it('converges from peak share to eligible patients after the adoption ramp', () => {
    const scenario = createDefaultScenario();
    Object.values(scenario.countries).forEach((country) => { country.enabled = country.id === 'USA'; });
    scenario.countries.USA.peakSharePct = 100;
    scenario.countries.USA.launchYearByIndication.gbm = scenario.startYear;
    scenario.countries.USA.launchMonthByIndication = { ...scenario.countries.USA.launchMonthByIndication, gbm: 1 };
    const matureYear = scenario.startYear + scenario.indications.gbm.defaultRampYears - 1;
    const row = calculateModel(scenario).countryYears.find((item) => item.countryId === 'USA' && item.year === matureYear);
    expect(row).toBeDefined();
    expect(close(row?.accessibleCases ?? 0, row?.incidentCases ?? 0)).toBe(true);
    expect(close(row?.treatedPatients ?? 0, row?.eligiblePatients ?? 0)).toBe(true);
  });

  it('does not let a disabled market change the commercialization gate', () => {
    const baselineScenario = createDefaultScenario();
    const baseline = calculateModel(baselineScenario).valuation.commercializationSuccessPctByIndication.gbm;
    baselineScenario.countries.JPN.enabled = false;
    baselineScenario.countries.JPN.launchYearByIndication.gbm = baselineScenario.startYear;
    const changed = calculateModel(baselineScenario).valuation.commercializationSuccessPctByIndication.gbm;
    expect(changed).toBe(baseline);
  });
});
