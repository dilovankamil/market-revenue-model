import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { cloneScenario } from '../model/assumptions';
import { calculateModel } from '../model/calculateModel';
import { buildScenarioPresets } from '../model/scenarios';
import type { Scenario } from '../model/types';

interface Props {
  scenario: Scenario;
  setScenario: Dispatch<SetStateAction<Scenario>>;
}

const formatUsd = (value: number) => {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
};

const descriptions = {
  conservative: {
    title: 'Downside sensitivity',
    changes: ['Lower treatment price', 'Lower peak penetration', 'Commercial launches delayed by 2 years', 'Higher discount rate and erosion'],
  },
  base: {
    title: 'Current planning case',
    changes: ['Restores the model defaults', 'EU27 + North America + UK + Japan base footprint', 'Phase-II commercialization gate', 'Current pricing, timing and penetration assumptions'],
  },
  expansion: {
    title: 'Portfolio expansion',
    changes: ['Adds brain metastases and other primary brain tumors', 'Enables India and China', 'Higher commercial penetration', 'Adds 2 years of patent extension'],
  },
} as const;

export function ScenarioLabTab({ scenario, setScenario }: Props) {
  const presets = useMemo(() => buildScenarioPresets(), []);
  const cards = (Object.entries(presets) as [keyof typeof presets, Scenario][]).map(([id, preset]) => ({
    id,
    scenario: preset,
    result: calculateModel(preset),
  }));

  return (
    <>
      <section className="panel scenario-lab-intro">
        <span className="section-kicker">Scenario lab</span>
        <h3>Compare coherent assumption sets</h3>
        <p>Applying a scenario replaces the current model assumptions with that preset. It is not an extra adjustment layered on top of whatever you changed previously. You can then edit any assumption normally.</p>
      </section>
      <section className="scenario-grid scenario-grid-explained">
        {cards.map(({ id, scenario: preset, result }) => (
          <article className={`scenario-card ${scenario.name === preset.name ? 'selected' : ''}`} key={id}>
            <span className="section-kicker">{id}</span>
            <h3>{preset.name}</h3>
            <p className="scenario-purpose">{descriptions[id].title}</p>
            <div className="scenario-change-list">
              {descriptions[id].changes.map((change) => <span key={change}>{change}</span>)}
            </div>
            <div className="scenario-metrics">
              <div><span>Peak sales</span><b>{formatUsd(result.peakRevenueUsd)}</b></div>
              <div><span>Stage-adjusted rNPV</span><b>{formatUsd(result.valuation.riskAdjustedNpvUsd)}</b></div>
              <div><span>Funding requirement</span><b>{formatUsd(result.peakFundingRequirementUsd)}</b></div>
            </div>
            <button className="primary-button" onClick={() => setScenario(cloneScenario(preset))}>
              {scenario.name === preset.name ? 'Re-apply current preset' : `Apply ${preset.name}`}
            </button>
          </article>
        ))}
      </section>
    </>
  );
}
