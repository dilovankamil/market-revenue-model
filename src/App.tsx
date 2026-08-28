import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { CommercialModelTab } from './components/CommercialModelTab';
import { CountryGlobe } from './components/CountryGlobe';
import { DevelopmentTab } from './components/DevelopmentTab';
import { GlobalOpportunityTab } from './components/GlobalOpportunityTab';
import { MarketSelector } from './components/MarketSelector';
import { RevenueChart } from './components/RevenueChart';
import { ScenarioLabTab } from './components/ScenarioLabTab';
import { ValuationTab } from './components/ValuationTab';
import { baseScenario, cloneScenario } from './model/assumptions';
import { calculateModel } from './model/calculateModel';
import { calculateDeal, type DealTerms, type DealType } from './model/deal';
import { parseScenario, serializeScenario } from './model/scenarioIO';
import { methodologySources } from './model/sources';
import type { CountryId, IndicationId, Scenario } from './model/types';

type TabId = 'overview' | 'global' | 'commercial' | 'development' | 'scenario' | 'valuation' | 'deal' | 'methodology';

const tabs: { id: TabId; label: string; private?: boolean }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'global', label: 'Global opportunity' },
  { id: 'commercial', label: 'Commercial model' },
  { id: 'development', label: 'Development & cash' },
  { id: 'scenario', label: 'Scenario lab' },
  { id: 'valuation', label: 'Valuation' },
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

const sourceStatusLabel = (status: 'literature' | 'workbook' | 'scenario') => ({
  literature: 'Literature',
  workbook: 'Finance workbook',
  scenario: 'Scenario input',
}[status]);

function App() {
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
    ? Math.min(...selectedCountries.filter((country) => country.accessRoute === 'commercial').map((country) => country.launchYearByIndication.gbm))
    : null;

  const overviewMetric = useMemo(() => {
    const metric: Partial<Record<CountryId, number>> = {};
    result.countryYears.filter((row) => row.year === 2035).forEach((row) => { metric[row.countryId] = row.grossRevenueUsd; });
    return metric;
  }, [result.countryYears]);

  const updateIndication = (id: IndicationId, enabled: boolean) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      next.indications[id].enabled = enabled;
      return next;
    });
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

        <MarketSelector scenario={scenario} setScenario={setScenario} />
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
            <section className="hero-grid hero-grid-v5">
              <div className="map-panel panel overview-globe-panel">
                <div className="panel-heading"><div><span className="section-kicker">Global opportunity</span><h3>Commercial footprint</h3></div><button className="text-button" onClick={() => setActiveTab('global')}>Explore rollout →</button></div>
                <CountryGlobe
                  countries={Object.values(scenario.countries)}
                  selectedCountryId={overviewCountryId}
                  onSelectCountry={setOverviewCountryId}
                  onInspectCountry={(selection) => { if (selection.configured) setOverviewCountryId(selection.id); }}
                  metricByCountry={overviewMetric}
                />
              </div>
              <div className="summary-panel panel">
                <span className="section-kicker">Model snapshot</span><h3>From patients to value</h3>
                <p className="summary-copy">{selectedIndications.map((item) => item.name).join(', ')} across {selectedCountries.length} active country markets. Clinical development, commercial timing and market economics feed one scenario engine.</p>
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
            <section className="chart-panel panel">
              <div className="panel-heading"><div><span className="section-kicker">Forecast</span><h3>Global gross revenue</h3></div><span className="chart-context-note">Animated stacked revenue</span></div>
              <RevenueChart data={result.years} countryYears={result.countryYears} scenario={scenario} />
            </section>
          </>
        )}

        {activeTab === 'global' && <GlobalOpportunityTab scenario={scenario} result={result} setScenario={setScenario} />}
        {activeTab === 'commercial' && <CommercialModelTab scenario={scenario} result={result} setScenario={setScenario} />}
        {activeTab === 'development' && <DevelopmentTab scenario={scenario} result={result} setScenario={setScenario} />}
        {activeTab === 'scenario' && <ScenarioLabTab scenario={scenario} setScenario={setScenario} />}
        {activeTab === 'valuation' && <ValuationTab scenario={scenario} result={result} setScenario={setScenario} />}

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
            <div className="panel methodology-intro"><span className="section-kicker">Model governance</span><h3>Assumptions are data, not facts</h3><p>The model separates literature/workbook lineage from scenario choices. Country-specific pricing, access, incidence and timing assumptions marked as proxies require validation before external quantitative use.</p><div className="method-principles"><div><strong>One engine</strong><span>Patient, revenue, cash and valuation views use the same scenario object.</span></div><div><strong>Finite horizon</strong><span>No perpetual pharmaceutical terminal value.</span></div><div><strong>Local private config</strong><span>Confidential company cost and financing assumptions can stay out of this public repo.</span></div></div></div>
            {sourceCategories.map((category) => <section className="panel source-section" key={category}><div className="panel-heading"><div><span className="section-kicker">Source lineage</span><h3>{category}</h3></div></div><div className="source-list">{methodologySources.filter((source) => source.category === category).map((source) => <article className="source-row" key={source.id}><div><span className={`source-status ${source.status}`}>{sourceStatusLabel(source.status)}</span><strong>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.label}</a> : source.label}</strong><small>{source.appliesTo}</small></div><p>{source.note}</p></article>)}</div></section>)}
          </section>
        )}

        <footer className="public-disclaimer">
          <strong>Modelling disclaimer.</strong> Outputs are scenario estimates for strategic planning. They are not clinical claims, regulatory conclusions, commercial forecasts or investment advice. Source and assumption review is required before external quantitative use.
        </footer>
      </main>
    </div>
  );
}

export default App;
