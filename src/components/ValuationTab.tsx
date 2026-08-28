import type { Dispatch, SetStateAction } from 'react';
import type { IndicationId, ModelResult, Scenario } from '../model/types';

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
  return years.length ? Math.min(...years) : null;
};

const commercializationGate = (scenario: Scenario, indication: IndicationId) => {
  const launch = earliestLaunch(scenario, indication);
  if (!launch) return null;
  const stages = scenario.developmentStages
    .filter((stage) => stage.indication === indication && Number(stage.endDate.slice(0, 4)) < launch)
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
  return stages.at(-1) ?? null;
};

export function ValuationTab({ scenario, result, setScenario }: Props) {
  const selectedIndications = Object.values(scenario.indications).filter((indication) => indication.enabled);

  const updateFinancial = <K extends keyof Scenario['financial']>(key: K, value: Scenario['financial'][K]) => {
    setScenario((current) => ({ ...current, financial: { ...current.financial, [key]: value } }));
  };

  return (
    <section className="two-column-layout valuation-v5-layout">
      <div className="panel valuation-hero">
        <span className="section-kicker">Explicit forecast to {scenario.endYear}</span><h3>Asset value</h3>
        <div className="valuation-number"><span>Stage-adjusted rNPV</span><strong>{formatUsd(result.valuation.riskAdjustedNpvUsd)}</strong></div>
        <div className="valuation-number secondary"><span>Unrisked NPV</span><strong>{formatUsd(result.valuation.npvUsd)}</strong></div>

        <div className="commercial-gate-section">
          <div className="commercial-gate-heading"><span>How launch risk is treated</span><small>Commercialization after the pre-launch programme</small></div>
          <div className="commercial-gate-grid">
            {selectedIndications.map((indication) => {
              const gate = commercializationGate(scenario, indication.id);
              const launch = earliestLaunch(scenario, indication.id);
              return (
                <article key={indication.id}>
                  <span>{indication.name}</span>
                  <strong>{gate?.phase ?? 'No pre-launch stage configured'}</strong>
                  <small>{launch ? `First modeled commercial launch ${launch}` : 'No commercial launch configured'}</small>
                </article>
              );
            })}
          </div>
        </div>

        <p className="model-note">
          The valuation no longer treats confirmatory Phase III as an additional barrier to initial sales when the model already launches after Phase II. Revenue is risk-adjusted through the configured pre-launch gate; later confirmatory studies remain in the development cost path.
        </p>
      </div>
      <div className="panel controls-panel">
        <div className="panel-heading"><div><span className="section-kicker">Valuation assumptions</span><h3>Risk & discounting</h3></div></div>
        <div className="global-control">
          <label>Discount rate <b>{scenario.financial.discountRatePct.toFixed(2)}%</b><input type="range" min="5" max="20" step="0.25" value={scenario.financial.discountRatePct} onChange={(event) => updateFinancial('discountRatePct', +event.target.value)} /></label>
          <label>Additional risk sensitivity <b>{scenario.financial.riskAdjustmentPct.toFixed(0)}%</b><input type="range" min="20" max="100" step="1" value={scenario.financial.riskAdjustmentPct} onChange={(event) => updateFinancial('riskAdjustmentPct', +event.target.value)} /></label>
          <label>Corporate tax <b>{scenario.financial.corporateTaxPct.toFixed(0)}%</b><input type="range" min="0" max="35" step="1" value={scenario.financial.corporateTaxPct} onChange={(event) => updateFinancial('corporateTaxPct', +event.target.value)} /></label>
        </div>
        <p className="model-note">Detailed stage probabilities remain editable under Development → Advanced risk assumptions, but they are no longer presented as a headline “chance of success” metric.</p>
      </div>
    </section>
  );
}
