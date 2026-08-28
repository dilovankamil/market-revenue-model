import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { CountryGlobe } from './components/CountryGlobe';
import { DevelopmentTab } from './components/DevelopmentTab';
import { GlobalOpportunityTab } from './components/GlobalOpportunityTab';
import { RevenueChart } from './components/RevenueChart';
import { baseScenario, cloneScenario } from './model/assumptions';
import { calculateModel } from './model/calculateModel';
import { calculateDeal, type DealTerms, type DealType } from './model/deal';
import { parseScenario, serializeScenario } from './model/scenarioIO';
import { buildScenarioPresets } from './model/scenarios';
import { methodologySources } from './model/sources';
import type { CountryAssumption, CountryId, IndicationId, Scenario } from './model/types';

type TabId = 'overview' | 'global' | 'commercial' | 'development' | 'scenario' | 'valuation' | 'access' | 'deal' | 'methodology';

const tabs: { id: TabId; label: string; private?: boolean }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'global', label: 'Global opportunity' },
  { id: 'commercial', label: 'Commercial model' },
  { id: 'development', label: 'Development & cash' },
  { id: 'scenario', label: 'Scenario lab' },
  { id: 'valuation', label: 'Valuation' },
  { id: 'access', label: 'Access strategy' },
  { id: 'deal', label: 'Deal explorer', private: true },
  { id: 'methodology', label: 'Methodology' },
];

const showPrivateModules = import.meta.env.VITE_SHOW_PRIVATE_MODULES === 'true';
const visibleTabs = tabs.filter((tab) => !tab.private || showPrivateModules);

const formatUsd = (value: number) => {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
};

const accessLabel = (route: CountryAssumption['accessRoute']) => ({
  commercial: 'Commercial',
  'named-patient': 'Named-patient',
  'clinical-trial': 'Clinical trial',
  none: 'Not available',
}[route]);

const sourceStatusLabel = (status: 'literature' | 'workbook' | 'scenario') => ({
  literature: 'Literature',
  workbook: 'Finance workbook',
  scenario: 'Scenario input',
}[status]);

function App() {
  const presets = useMemo(() => buildScenarioPresets(), []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [scenario, setScenario] = useState<Scenario>(() => cloneScenario(baseScenario));
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [overviewCountryId, setOverviewCountryId] = useState<CountryId>('USA');
  const [scenarioFileError, setScenarioFileError] = useState<string | null>(null);
  const [dealTerms, setDealTerms] = useState<DealTerms>({
    type: 'self-commercialize',
    upfrontUsd: 100_000_000,
    royaltyPct: 18,
    retainedCommercialPct: 0,
    partnerDevelopmentFundingPct: 100,
    milestonesUsd: 250_000_000,
  });

  const result = useMemo(() => calculateModel(scenario), [scenario]);
  const dealResult = useMemo(() => calculateDeal(result, dealTerms), [result, dealTerms]);
  const selectedCountries = Object.values(scenario.countries).filter((country) => country.enabled);
  const selectedIndications = Object.values(scenario.indications).filter((indication) => indication.enabled);
  const privateConfigLoaded = scenario.corporateCosts.length > 0 || scenario.financingEvents.length > 0;
  const firstCommercialLaunch = selectedCountries.length
    ? Math.min(...selectedCountries.map((country) => country.launchYearByIndication.gbm))
    : null;

  const overviewMetric = useMemo(() => {
    const metric: Partial<Record<CountryId, number>> = {};
    result.countryYears.filter((row) => row.year === 2035).forEach((row) => { metric[row.countryId] = row.grossRevenueUsd; });
    return metric;
  }, [result.countryYears]);

  const updateCountry = <K extends keyof CountryAssumption>(countryId: CountryId, key: K, value: CountryAssumption[K]) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      if (!next.countries[countryId]) return current;
      next.countries[countryId][key] = value;
      return next;
    });
  };

  const updateIndication = (id: IndicationId, enabled: boolean) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      next.indications[id].enabled = enabled;
      return next;
    });
  };

  const updateFinancial = <K extends keyof Scenario['financial']>(key: K, value: Scenario['financial'][K]) => {
    setScenario((current) => ({ ...current, financial: { ...current.financial, [key]: value } }));
  };

  const exportScenarioFile = () => {
    const blob = new Blob([serializeScenario(scenario)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'scenario';
    link.href = url;
    link.download = `si053-${safeName}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const importScenarioFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseScenario(await file.text());
      setScenario(imported);
      setScenarioFileError(null);
      if (!imported.countries[overviewCountryId]) setOverviewCountryId(Object.keys(imported.countries)[0] ?? 'USA');
    } catch (error) {
      setScenarioFileError(error instanceof Error ? error.message : 'Could not import scenario.');
    } finally {
      event.target.value = '';
    }
  };

  const resetBaseCase = () => {
    setScenario(cloneScenario(baseScenario));
    setOverviewCountryId('USA');
  };

  const changeDealType = (type: DealType) => setDealTerms((current) => ({
    ...current,
    type,
    retainedCommercialPct: type === 'regional-license' ? 50 : 0,
    partnerDevelopmentFundingPct: type === 'self-commercialize' ? 0 : 100,
  }));

  const scenarioCards = (Object.entries(presets) as [keyof typeof presets, Scenario][]).map(([id, preset]) => ({
    id,
    scenario: preset,
    result: calculateModel(preset),
  }));
  const sourceCategories = Array.from(new Set(methodologySources.map((source) => source.category)));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">SI</div>
          <div><div className="eyebrow">DOUBLE BOND PHARMACEUTICAL</div><h1>SI-053 Strategic Model</h1></div>
        </div>

        <nav className="nav-list" aria-label="Model sections">
          {visibleTabs.map((tab) => (
            <button key={tab.id} className={`nav-button ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <span>{tab.label}</span>{tab.private && <small>PRIVATE</small>}
            </button>
          ))}
        </nav>

        <div className="sidebar-section">
          <div className="section-kicker">Indications</div>
          {Object.values(scenario.indications).map((indication) => (
            <label className="toggle-row" key={indication.id}>
              <input type="checkbox" checked={indication.enabled} disabled={indication.id === 'gbm'} onChange={(event) => updateIndication(indication.id, event.target.checked)} />
              <span>{indication.name}</span>
            </label>
          ))}
        </div>

        <div className="sidebar-section compact-market-list">
          <div className="section-kicker">Markets</div>
          {Object.values(scenario.countries).map((country) => (
            <label className="toggle-row" key={country.id} title={country.assumptionStatus === 'proxy' ? 'Proxy assumptions require validation' : undefined}>
              <input type="checkbox" checked={country.enabled} onChange={(event) => updateCountry(country.id, 'enabled', event.target.checked)} />
              <span>{country.name}{country.assumptionStatus === 'proxy' ? ' *' : ''}</span>
            </label>
          ))}
        </div>

        <button className="secondary-button" onClick={resetBaseCase}>Reset base case</button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div><div className="eyebrow">INTERACTIVE COMMERCIAL, DEVELOPMENT & VALUE MODEL</div><h2>{visibleTabs.find((tab) => tab.id === activeTab)?.label ?? 'SI-053 Strategic Model'}</h2></div>
          <div className="topbar-actions">
            {scenarioFileError && <span className="import-error" title={scenarioFileError}>Import error</span>}
            <input ref={fileInputRef} className="hidden-file-input" type="file" accept="application/json,.json" onChange={importScenarioFile} />
            <button className="toolbar-button" onClick={() => fileInputRef.current?.click()}>Import</button>
            <button className="toolbar-button" onClick={exportScenarioFile}>Export</button>
            <div className="scenario-pill"><span className={`scenario-status ${privateConfigLoaded ? 'private-loaded' : ''}`} />{scenario.name}</div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <>
            {privateConfigLoaded && <div className="private-model-banner">Private local configuration loaded · {scenario.corporateCosts.length} corporate cost lines · {scenario.financingEvents.length} financing events. Imported data remains local to the browser.</div>}
            <section className="hero-grid">
              <div className="map-panel panel">
                <div className="panel-heading"><div><span className="section-kicker">Global opportunity</span><h3>Commercial footprint</h3></div><button className="text-button" onClick={() => setActiveTab('global')}>Explore every country →</button></div>
                <CountryGlobe countries={Object.values(scenario.countries)} selectedCountryId={overviewCountryId} onSelectCountry={setOverviewCountryId} metricByCountry={overviewMetric} />
              </div>
              <div className="summary-panel panel">
                <span className="section-kicker">Model snapshot</span><h3>From patients to value</h3>
                <p className="summary-copy">{selectedIndications.map((item) => item.name).join(', ')} across {selectedCountries.length} active markets. Clinical development, patient access and commercial economics feed one scenario engine.</p>
                <div className="summary-list">
                  <div><span>First commercial launch</span><strong>{firstCommercialLaunch ?? '—'}</strong></div>
                  <div><span>Peak funding requirement</span><strong>{formatUsd(result.peakFundingRequirementUsd)}</strong></div>
                  <div><span>Break-even</span><strong>{result.breakEvenYear ?? 'Beyond horizon'}</strong></div>
                  <div><span>Stage-adjusted rNPV</span><strong>{formatUsd(result.valuation.riskAdjustedNpvUsd)}</strong></div>
                </div>
              </div>
            </section>
            <section className="kpi-grid">
              <article className="kpi-card"><span>Peak revenue</span><strong>{formatUsd(result.peakRevenueUsd)}</strong><small>{result.peakRevenueYear}</small></article>
              <article className="kpi-card"><span>Cumulative revenue</span><strong>{formatUsd(result.cumulativeRevenueUsd)}</strong><small>{scenario.startYear}–{scenario.endYear}</small></article>
              <article className="kpi-card"><span>Peak treated patients</span><strong>{Math.round(result.peakTreatedPatients).toLocaleString()}</strong><small>annual</small></article>
              <article className="kpi-card"><span>Unrisked NPV</span><strong>{formatUsd(result.valuation.npvUsd)}</strong><small>{scenario.financial.discountRatePct.toFixed(1)}% discount rate</small></article>
            </section>
            <section className="chart-panel panel"><div className="panel-heading"><div><span className="section-kicker">Forecast</span><h3>Global gross revenue</h3></div><div className="legend-inline"><span className="legend-bar" /> Revenue <span className="legend-cost" /> Development spend</div></div><RevenueChart data={result.years} /></section>
          </>
        )}

        {activeTab === 'global' && <GlobalOpportunityTab scenario={scenario} result={result} setScenario={setScenario} />}

        {activeTab === 'commercial' && (
          <section className="two-column-layout">
            <div className="panel controls-panel">
              <div className="panel-heading"><div><span className="section-kicker">Country markets</span><h3>Pricing & penetration</h3></div></div>
              {Object.values(scenario.countries).map((country) => (
                <div className={`market-control ${country.enabled ? '' : 'control-disabled'}`} key={country.id}>
                  <div className="market-control-title"><div><strong>{country.name}</strong><small>{country.region}{country.assumptionStatus === 'proxy' ? ' · proxy' : ''}</small></div><span>{accessLabel(country.accessRoute)}</span></div>
                  <label>Peak share <b>{country.peakSharePct}%</b><input type="range" min="1" max="60" step="1" value={country.peakSharePct} onChange={(event) => updateCountry(country.id, 'peakSharePct', +event.target.value)} /></label>
                  <label>Price <b>{formatUsd(country.priceUsd)}</b><input type="range" min="5000" max="150000" step="5000" value={country.priceUsd} onChange={(event) => updateCountry(country.id, 'priceUsd', +event.target.value)} /></label>
                  {country.assumptionNote && <p className="model-note warning">{country.assumptionNote}</p>}
                </div>
              ))}
            </div>
            <div className="panel controls-panel sticky-panel">
              <div className="panel-heading"><div><span className="section-kicker">Portfolio</span><h3>Commercial economics</h3></div></div>
              <div className="global-control">
                <label>COGS / treatment <b>{formatUsd(scenario.financial.cogsPerTreatmentUsd)}</b><input type="range" min="100" max="10000" step="100" value={scenario.financial.cogsPerTreatmentUsd} onChange={(event) => updateFinancial('cogsPerTreatmentUsd', +event.target.value)} /></label>
                <label>Commercial OpEx <b>{scenario.financial.commercialOpexPct.toFixed(1)}%</b><input type="range" min="0" max="30" step="0.5" value={scenario.financial.commercialOpexPct} onChange={(event) => updateFinancial('commercialOpexPct', +event.target.value)} /></label>
                <label>Post-LoE erosion <b>{scenario.erosionPct.toFixed(1)}%</b><input type="range" min="0" max="60" step="1" value={scenario.erosionPct} onChange={(event) => setScenario((current) => ({ ...current, erosionPct: +event.target.value }))} /></label>
                <label>Patent extension <b>+{scenario.patentExtensionYears} years</b><input type="range" min="0" max="10" step="1" value={scenario.patentExtensionYears} onChange={(event) => setScenario((current) => ({ ...current, patentExtensionYears: +event.target.value }))} /></label>
              </div>
              <RevenueChart data={result.years} />
            </div>
          </section>
        )}

        {activeTab === 'development' && <DevelopmentTab scenario={scenario} result={result} setScenario={setScenario} />}

        {activeTab === 'scenario' && (
          <section className="scenario-grid">
            {scenarioCards.map(({ id, scenario: preset, result: presetResult }) => (
              <article className={`scenario-card ${scenario.name === preset.name ? 'selected' : ''}`} key={id}>
                <span className="section-kicker">{id}</span><h3>{preset.name}</h3>
                <div className="scenario-metrics"><div><span>Peak sales</span><b>{formatUsd(presetResult.peakRevenueUsd)}</b></div><div><span>Stage rNPV</span><b>{formatUsd(presetResult.valuation.riskAdjustedNpvUsd)}</b></div><div><span>Funding</span><b>{formatUsd(presetResult.peakFundingRequirementUsd)}</b></div></div>
                <button className="primary-button" onClick={() => setScenario(cloneScenario(preset))}>Load scenario</button>
              </article>
            ))}
          </section>
        )}

        {activeTab === 'valuation' && (
          <section className="two-column-layout">
            <div className="panel valuation-hero">
              <span className="section-kicker">Explicit forecast to {scenario.endYear}</span><h3>Asset value</h3>
              <div className="valuation-number"><span>Stage-adjusted rNPV</span><strong>{formatUsd(result.valuation.riskAdjustedNpvUsd)}</strong></div>
              <div className="valuation-number secondary"><span>Unrisked NPV</span><strong>{formatUsd(result.valuation.npvUsd)}</strong></div>
              <div className="clinical-probability-grid">
                {selectedIndications.map((indication) => <div key={indication.id}><span>{indication.name}</span><strong>{result.valuation.clinicalSuccessPctByIndication[indication.id].toFixed(1)}%</strong><small>cumulative configured clinical success</small></div>)}
              </div>
              <p className="model-note">No perpetual terminal value is used. Clinical revenue is weighted by the product of configured stage probabilities; later-stage spend is weighted by probability of reaching that stage.</p>
            </div>
            <div className="panel controls-panel">
              <div className="panel-heading"><div><span className="section-kicker">Valuation assumptions</span><h3>Risk & discounting</h3></div></div>
              <div className="global-control">
                <label>Discount rate <b>{scenario.financial.discountRatePct.toFixed(2)}%</b><input type="range" min="5" max="20" step="0.25" value={scenario.financial.discountRatePct} onChange={(event) => updateFinancial('discountRatePct', +event.target.value)} /></label>
                <label>Additional risk multiplier <b>{scenario.financial.riskAdjustmentPct.toFixed(0)}%</b><input type="range" min="20" max="100" step="1" value={scenario.financial.riskAdjustmentPct} onChange={(event) => updateFinancial('riskAdjustmentPct', +event.target.value)} /></label>
                <label>Corporate tax <b>{scenario.financial.corporateTaxPct.toFixed(0)}%</b><input type="range" min="0" max="35" step="1" value={scenario.financial.corporateTaxPct} onChange={(event) => updateFinancial('corporateTaxPct', +event.target.value)} /></label>
              </div>
              <p className="model-note warning">Stage probabilities are scenario assumptions, not validated industry benchmarks. They must be reviewed before formal valuation use.</p>
            </div>
          </section>
        )}

        {activeTab === 'access' && (
          <section className="two-column-layout">
            {(['IND', 'CHN'] as CountryId[]).map((id) => {
              const country = scenario.countries[id];
              if (!country) return null;
              return <div className="panel controls-panel" key={id}>
                <div className="panel-heading"><div><span className="section-kicker">Early / alternative access</span><h3>{country.name}</h3></div><label className="switch-label"><input type="checkbox" checked={country.enabled} onChange={(event) => updateCountry(id, 'enabled', event.target.checked)} /> In model</label></div>
                <label className="select-label">Access route<select value={country.accessRoute} onChange={(event) => updateCountry(id, 'accessRoute', event.target.value as CountryAssumption['accessRoute'])}><option value="none">Not available</option><option value="clinical-trial">Clinical trial only</option><option value="named-patient">Named-patient / early access</option><option value="commercial">Commercial</option></select></label>
                <label>Accessible population <b>{country.accessiblePopulationPct}%</b><input type="range" min="1" max="100" value={country.accessiblePopulationPct} onChange={(event) => updateCountry(id, 'accessiblePopulationPct', +event.target.value)} /></label>
                {country.accessRoute === 'named-patient' && country.namedPatient && <div className="named-patient-grid"><label>Start year<input type="number" value={country.namedPatient.startYear} onChange={(event) => updateCountry(id, 'namedPatient', { ...country.namedPatient!, startYear: +event.target.value })} /></label><label>Starting centres<input type="number" value={country.namedPatient.centres} onChange={(event) => updateCountry(id, 'namedPatient', { ...country.namedPatient!, centres: +event.target.value })} /></label><label>Eligible / centre / yr<input type="number" value={country.namedPatient.eligiblePatientsPerCentre} onChange={(event) => updateCountry(id, 'namedPatient', { ...country.namedPatient!, eligiblePatientsPerCentre: +event.target.value })} /></label><label>Conversion %<input type="number" value={country.namedPatient.conversionPct} onChange={(event) => updateCountry(id, 'namedPatient', { ...country.namedPatient!, conversionPct: +event.target.value })} /></label></div>}
                <p className="model-note">Country-specific legal/regulatory availability is not inferred by the calculator and must be verified separately.</p>
              </div>;
            })}
          </section>
        )}

        {showPrivateModules && activeTab === 'deal' && (
          <section className="two-column-layout">
            <div className="panel controls-panel">
              <div className="panel-heading"><div><span className="section-kicker">Private module architecture</span><h3>Transaction structure</h3></div><span className="privacy-chip">DEMO TERMS</span></div>
              <p className="model-note warning">This repository is public. No internal DBP transaction expectations are stored here; these are user-editable illustrative terms.</p>
              <label className="select-label">Strategy<select value={dealTerms.type} onChange={(event) => changeDealType(event.target.value as DealType)}><option value="self-commercialize">Self-commercialize</option><option value="regional-license">Regional license</option><option value="global-license">Global license</option><option value="acquisition">Acquisition</option></select></label>
              {dealTerms.type !== 'self-commercialize' && <><label>Upfront <b>{formatUsd(dealTerms.upfrontUsd)}</b><input type="range" min="0" max="1000000000" step="10000000" value={dealTerms.upfrontUsd} onChange={(event) => setDealTerms((current) => ({ ...current, upfrontUsd: +event.target.value }))} /></label><label>Milestones <b>{formatUsd(dealTerms.milestonesUsd)}</b><input type="range" min="0" max="2000000000" step="25000000" value={dealTerms.milestonesUsd} onChange={(event) => setDealTerms((current) => ({ ...current, milestonesUsd: +event.target.value }))} /></label>{dealTerms.type !== 'acquisition' && <><label>Royalty <b>{dealTerms.royaltyPct}%</b><input type="range" min="0" max="35" value={dealTerms.royaltyPct} onChange={(event) => setDealTerms((current) => ({ ...current, royaltyPct: +event.target.value }))} /></label><label>Partner development funding <b>{dealTerms.partnerDevelopmentFundingPct}%</b><input type="range" min="0" max="100" value={dealTerms.partnerDevelopmentFundingPct} onChange={(event) => setDealTerms((current) => ({ ...current, partnerDevelopmentFundingPct: +event.target.value }))} /></label></>}</>}
            </div>
            <div className="panel deal-output">
              <span className="section-kicker">Indicative comparison</span><h3>{dealTerms.type.replace('-', ' ')}</h3>
              <div className="valuation-number"><span>Indicative model value</span><strong>{formatUsd(dealResult.indicativeValueUsd)}</strong></div>
              <div className="valuation-number secondary"><span>Remaining funding burden</span><strong>{formatUsd(dealResult.fundingBurdenUsd)}</strong></div>
              <div className="deal-breakdown"><div><span>Upfront</span><b>{formatUsd(dealResult.upfrontValueUsd)}</b></div><div><span>Risk-adjusted milestones</span><b>{formatUsd(dealResult.riskAdjustedMilestonesUsd)}</b></div><div><span>Royalty NPV</span><b>{formatUsd(dealResult.royaltyNpvUsd)}</b></div><div><span>Retained asset value</span><b>{formatUsd(dealResult.retainedValueUsd)}</b></div></div>
              <p className="model-note">This is a strategic comparison framework, not a fairness opinion or transaction valuation.</p>
            </div>
          </section>
        )}

        {activeTab === 'methodology' && (
          <section className="methodology-layout">
            <div className="panel methodology-intro"><span className="section-kicker">Model governance</span><h3>Assumptions are data, not facts</h3><p>The model separates literature/workbook lineage from scenario choices. Any globe-added country is explicitly marked as a proxy until country-specific epidemiology, access, price and timing are validated.</p><div className="method-principles"><div><strong>One engine</strong><span>Patient, revenue, cash and valuation views use the same scenario object.</span></div><div><strong>Finite horizon</strong><span>No perpetual pharmaceutical terminal value.</span></div><div><strong>Local private config</strong><span>Confidential company cost and financing assumptions can stay out of this public repo.</span></div></div></div>
            {sourceCategories.map((category) => <section className="panel source-section" key={category}><div className="panel-heading"><div><span className="section-kicker">Source lineage</span><h3>{category}</h3></div></div><div className="source-list">{methodologySources.filter((source) => source.category === category).map((source) => <article className="source-row" key={source.id}><div><span className={`source-status ${source.status}`}>{sourceStatusLabel(source.status)}</span><strong>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a> : source.label}</strong><small>{source.appliesTo}</small></div><p>{source.note}</p></article>)}</div></section>)}
          </section>
        )}

        <footer className="public-disclaimer">
          <strong>Modelling disclaimer.</strong> Outputs are scenario estimates for strategic planning. They are not clinical claims, regulatory conclusions, commercial forecasts, investment advice, or evidence that a named-patient/early-access route is legally available in any jurisdiction. Source and assumption review is required before external quantitative use.
        </footer>
      </main>
    </div>
  );
}

export default App;
