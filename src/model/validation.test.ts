import { describe, expect, it } from 'vitest';
import { baseScenario, cloneScenario } from './assumptions';
import { parseScenario, serializeScenario } from './scenarioIO';
import { validateScenario } from './validation';

describe('scenario validation', () => {
  it('accepts the committed base scenario without fatal errors', () => {
    const errors = validateScenario(baseScenario).filter((issue) => issue.level === 'error');
    expect(errors).toHaveLength(0);
  });

  it('flags LoE before launch', () => {
    const scenario = cloneScenario(baseScenario);
    scenario.countries.USA.loeYear = 2028;
    const issues = validateScenario(scenario);
    expect(issues.some((issue) => issue.code === 'loe-before-launch' && issue.level === 'error')).toBe(true);
  });

  it('flags out-of-range patient access', () => {
    const scenario = cloneScenario(baseScenario);
    scenario.countries.USA.accessiblePopulationPct = 120;
    expect(validateScenario(scenario).some((issue) => issue.code === 'invalid-accessible-population')).toBe(true);
  });

  it('warns when commercial launch precedes the configured programme end', () => {
    const issues = validateScenario(baseScenario);
    expect(issues.some((issue) => issue.code === 'launch-before-programme-end' && issue.level === 'warning')).toBe(true);
  });

  it('rejects a structurally valid imported scenario with fatal modelling errors', () => {
    const scenario = cloneScenario(baseScenario);
    scenario.financial.corporateTaxPct = 150;
    expect(() => parseScenario(serializeScenario(scenario))).toThrow(/validation failed/i);
  });
});
