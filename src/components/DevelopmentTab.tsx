import type { Dispatch, SetStateAction } from 'react';
import { CashFlowChart } from './CashFlowChart';
import { cloneScenario } from '../model/assumptions';
import type { DevelopmentStage, IndicationId, ModelResult, Scenario } from '../model/types';

interface Props {
  scenario: Scenario;
  result: ModelResult;
  setScenario: Dispatch<SetStateAction<Scenario>>;
}

const formatUsd = (value: number) => {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
};

const earliestLaunch = (scenario: Scenario, indication: IndicationId) => {
  const years = Object.values(scenario.countries)
    .filter((country) => country.accessRoute === 'commercial')
    .map((country) => country.launchYearByIndication[indication]);
  return years.length ? Math.min(...years) : scenario.endYear + 1;
};

const isPreLaunchStage = (scenario: Scenario, stage: DevelopmentStage) =>
  Number(stage.endDate.slice(0, 4)) < earliestLaunch(scenario, stage.indication);

export function DevelopmentTab({ scenario, result, setScenario }: Props) {
  const privateConfigLoaded = scenario.corporateCosts.length > 0 || scenario.financingEvents.length > 0;
  const activeStages = scenario.developmentStages.filter((stage) => scenario.indications[stage.indication].enabled);
  const totalDevelopmentSpend = activeStages.reduce((sum, stage) => sum + stage.publicCostUsd, 0);
  const peakDevelopmentYear = result.years.reduce(
    (best, row) => row.developmentCostsUsd > best.developmentCostsUsd ? row : best,
    result.years[0],
  );

  const updateProbability = (stageId: string, value: number) => {
    const bounded = Math.max(0, Math.min(100, value));
    setScenario((current) => {
      const next = cloneScenario(current);
      const stage = next.developmentStages.find((item) => item.id === stageId);
      if (stage) stage.successProbabilityPct = bounded;
      return next;
    });
  };

  return (
    <>
      <section className="panel development-panel development-story-panel">
        <div className="panel-heading">
          <div><span className="section-kicker">Development programme</span><h3>From Phase I to commercial launch</h3></div>
          <span className="privacy-chip">{privateConfigLoaded ? 'PRIVATE CONFIG ACTIVE' : 'PUBLIC / DEMO COST LAYER'}</span>
        </div>

        <p className="model-note development-lead-note">
          The base model treats Phase II as the commercialization gate. Confirmatory Phase III can continue after modeled launch and is therefore shown as post-launch programme spend rather than an additional barrier to initial sales.
        </p>

        <div className="programme-timeline">
          {activeStages.map((stage) => {
            const preLaunch = isPreLaunchStage(scenario, stage);
            return (
              <article className={`programme-stage-card ${preLaunch ? 'prelaunch' : 'confirmatory'}`} key={stage.id}>
                <div className="programme-stage-topline">
                  <span>{scenario.indications[stage.indication].name}</span>
                  <i>{preLaunch ? 'PRE-LAUNCH' : 'POST-LAUNCH'}</i>
                </div>
                <strong>{stage.phase}</strong>
                <div className="programme-stage-dates"><span>{stage.startDate}</span><b>→</b><span>{stage.endDate}</span></div>
                <div className="programme-stage-cost"><span>Programme cost</span><b>{formatUsd(stage.publicCostUsd)}</b></div>
              </article>
            );
          })}
        </div>

        <div className="development-cash-kpis">
          <div><span>Total enabled development spend</span><strong>{formatUsd(totalDevelopmentSpend)}</strong><small>undiscounted programme budgets</small></div>
          <div><span>Peak annual development spend</span><strong>{formatUsd(peakDevelopmentYear?.developmentCostsUsd ?? 0)}</strong><small>{peakDevelopmentYear?.year ?? '—'}</small></div>
          <div><span>Peak funding requirement</span><strong>{formatUsd(result.peakFundingRequirementUsd)}</strong><small>before external financing</small></div>
          <div><span>Operating break-even</span><strong>{result.breakEvenYear ?? 'Beyond horizon'}</strong><small>cumulative operating cash flow</small></div>
        </div>

        <details className="risk-assumption-details">
          <summary>Advanced risk assumptions</summary>
          <p className="model-note">Pre-launch stage probabilities affect modeled commercialization risk. Post-launch confirmatory probabilities affect the probability-weighted cost of reaching that study, but do not reduce the probability of initial sales.</p>
          <div className="stage-table stage-table-risk stage-table-editable compact-risk-table">
            <div className="stage-row stage-head"><span>Programme</span><span>Stage</span><span>Role</span><span>P(success)</span></div>
            {activeStages.map((stage) => (
              <div className="stage-row" key={stage.id}>
                <span>{scenario.indications[stage.indication].name}</span>
                <strong>{stage.phase}</strong>
                <span>{isPreLaunchStage(scenario, stage) ? 'Commercial gate' : 'Confirmatory'}</span>
                <label className="stage-probability-control" aria-label={`${stage.phase} success probability`}>
                  <input type="range" min="0" max="100" step="1" value={stage.successProbabilityPct} onChange={(event) => updateProbability(stage.id, +event.target.value)} />
                  <input className="stage-probability-number" type="number" min="0" max="100" step="1" value={stage.successProbabilityPct} onChange={(event) => updateProbability(stage.id, +event.target.value)} />
                  <span>%</span>
                </label>
              </div>
            ))}
          </div>
        </details>

        {privateConfigLoaded && (
          <div className="private-config-summary">
            <div><span>Corporate cost lines</span><strong>{scenario.corporateCosts.length}</strong></div>
            <div><span>Financing events</span><strong>{scenario.financingEvents.length}</strong></div>
            <div><span>External funding</span><strong>{formatUsd(result.externalFundingUsd)}</strong></div>
            <div><span>Ending cash balance</span><strong>{formatUsd(result.endingCashBalanceUsd)}</strong></div>
          </div>
        )}
      </section>

      <section className="panel chart-panel cash-story-panel">
        <div className="panel-heading">
          <div><span className="section-kicker">Funding path</span><h3>Cumulative operating cash flow</h3></div>
          <div className="funding-callout">Peak funding requirement <strong>{formatUsd(result.peakFundingRequirementUsd)}</strong></div>
        </div>
        <CashFlowChart data={result.years} />
        <div className="cash-flow-footnote">
          <span>Negative territory shows the cumulative funding gap created by development and operating costs.</span>
          <span>Commercial contribution pulls the curve back toward break-even after launch.</span>
        </div>
      </section>
    </>
  );
}
