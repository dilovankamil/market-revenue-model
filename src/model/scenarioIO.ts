import type { Scenario } from './types';
import { scenarioErrors } from './validation';

export const MODEL_FILE_VERSION = 1;

interface ScenarioFile {
  model: 'si053-strategic-model';
  version: number;
  exportedAt: string;
  scenario: Scenario;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const serializeScenario = (scenario: Scenario) => JSON.stringify({
  model: 'si053-strategic-model',
  version: MODEL_FILE_VERSION,
  exportedAt: new Date().toISOString(),
  scenario,
} satisfies ScenarioFile, null, 2);

export const parseScenario = (text: string): Scenario => {
  const parsed: unknown = JSON.parse(text);
  if (!isObject(parsed) || parsed.model !== 'si053-strategic-model' || parsed.version !== MODEL_FILE_VERSION) {
    throw new Error('This is not a compatible SI-053 scenario file.');
  }
  if (!isObject(parsed.scenario)) throw new Error('Scenario payload is missing.');

  const scenario = parsed.scenario as unknown as Scenario;
  if (
    typeof scenario.name !== 'string' ||
    typeof scenario.startYear !== 'number' ||
    typeof scenario.endYear !== 'number' ||
    !isObject(scenario.countries) ||
    !isObject(scenario.indications) ||
    !Array.isArray(scenario.developmentStages) ||
    !Array.isArray(scenario.corporateCosts) ||
    !Array.isArray(scenario.financingEvents) ||
    !isObject(scenario.financial)
  ) {
    throw new Error('Scenario file is incomplete or malformed.');
  }

  const cloned = structuredClone(scenario);
  const errors = scenarioErrors(cloned);
  if (errors.length) {
    const first = errors[0];
    throw new Error(`Scenario validation failed: ${first.message}${errors.length > 1 ? ` (+${errors.length - 1} more)` : ''}`);
  }

  return cloned;
};
