import type { Dispatch, SetStateAction } from 'react';
import { CashFlowChart } from './CashFlowChart';
import { cloneScenario } from '../model/assumptions';
import type { ModelResult, Scenario } from '../model/types';

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

export function DevelopmentTab({ scenario, result, setScenario }: Props) {
  const privateConfigLoaded = scenario.corporateCosts.length > 0 || scenario.financingEvents.length > 0;

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
      <section className="panel development-panel">
        <div className="panel-heading">
          <div><span className="section-kicker">Development programme</span><h3>Clinical timeline & stage probabilities</h3></div>
          <span className="privacy-chip">{privateConfigLoaded ? 'PRIVATE CONFIG ACTIVE' : 'PUBLIC / DEMO COST LAYER'}</span>
        </div>

        <p className="model-note">Stage probabilities are live scenario inputs. Changing a probability immediately updates probability-of-success, risk-adjusted development spend and rNPV.</p>

        <div className="stage-table stage-table-risk stage-table-editable">
          <div className="stage-row stage-head"><span>Indication</span><span>Stage</span><span>Start</span><span>End</span><span>Cost</span><span>P(success)</span></div>
          {scenario.developmentStages
            .filter((stage) => scenario.indications[stage.indication].enabled)
            .map((stage) => (
              <div className="stage-row" key={stage.id}>
                <span>{scenario.indications[stage.indication].name}</span>
                <strong>{stage.phase}</strong>
                <span>{stage.startDate}</span>
                <span>{stage.endDate}</span>
                <span>{formatUsd(stage.publicCostUsd)}</span>
                <label className="stage-probability-control" aria-label={`${stage.phase} success probability`}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={stage.successProbabilityPct}
                    onChange={(event) => updateProbability(stage.id, +event.target.value)}
                  />
                  <input
                    className="stage-probability-number"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={stage.successProbabilityPct}
                    onChange={(event) => updateProbability(stage.id, +event.target.value)}
                  />
                  <span>%</span>
                </label>
              </div>
            ))}
        </div>

        <div className="clinical-probability-grid">
          {Object.values(scenario.indications)
            .filter((indication) => indication.enabled)
            .map((indication) => (
              <div key={indication.id}>
                <span>{indication.name}</span>
                <strong>{result.valuation.clinicalSuccessPctByIndication[indication.id].toFixed(1)}%</strong>
                <small>Cumulative configured clinical success</small>
              </div>
            ))}
        </div>

        {privateConfigLoaded && (
          <div className="private-config-summary">
            <div><span>Corporate cost lines</span><strong>{scenario.corporateCosts.length}</strong></div>
            <div><span>Financing events</span><strong>{scenario.financingEvents.length}</strong></div>
            <div><span>External funding</span><strong>{formatUsd(result.externalFundingUsd)}</strong></div>
            <div><span>Ending cash balance</span><strong>{formatUsd(result.endingCashBalanceUsd)}</strong></div>
          </div>
        )}
      </section>

      <section className="panel chart-panel">
        <div className="panel-heading">
          <div><span className="section-kicker">Funding</span><h3>Cumulative operating cash flow</h3></div>
          <div className="funding-callout">Peak funding requirement <strong>{formatUsd(result.peakFundingRequirementUsd)}</strong></div>
        </div>
        <CashFlowChart data={result.years} />
      </section>
    </>
  );
}
