import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { CommercialValueTab } from './components/CommercialValueTab';
import { CountryGlobe } from './components/CountryGlobe';
import { DevelopmentTab } from './components/DevelopmentTab';
import { MarketSelector } from './components/MarketSelector';
import { MethodologyTab } from './components/MethodologyTab';
import { RevenueChart } from './components/RevenueChart';
import { baseScenario, cloneScenario } from './model/assumptions';
import { calculateModel } from './model/calculateModel';
import { calculateDeal, type DealTerms, type DealType } from './model/deal';
import { ensureV8Markets } from './model/marketExtensions';
import { parseScenario, serializeScenario } from './model/scenarioIO';
import type { CountryId, IndicationId, Scenario } from './model/types';

type TabId = 'overview' | 'commercial' | 'development' | 'deal' | 'methodology';

const tabs: { id: TabId; label: string; private?: boolean }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'commercial', label: 'Commercial & valuation' },
  { id: 'development', label: 'Development & cash' },
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

export default function AppV9() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [scenario, setScenario] = useState<Scenario>(() => ensureV8Markets(cloneScenario(baseScenario)));
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [overviewCountryId, setOverviewCountryId] = useState<CountryId>('USA');
  const [scenarioFileError, setScenarioFileError] = useState<string | null>(null);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const [dealTerms, setDealTerms] = useState<DealTerms>({
    type: 'self-commercialize', upfrontUsd: 100_000_000, royaltyPct: 18,
    retainedCommercialPct: 0, partnerDevelopmentFundingPct: 100, milestonesUsd: 250_000_000,
  });

  const result = useMemo(() => calculateModel(scenario), [scenario]);
  const dealResult = useMemo(() => calculateDeal(result, dealTerms), [result, dealTerms]);
  const selectedCountries = Object.values(scenario.countries).filter((country) => country.enabled);
  const selectedIndications = Object.values(scenario.indications).filter((indication) => indication.enabled);
  const privateConfigLoaded = scenario.corporateCosts.length > 0 || scenario.financingEvents.length > 0;
  const commercialCountries = selectedCountries.filter((country) => country.accessRoute === 'commercial');
  const firstCommercialLaunch = commercialCountries.length
    ? Math.min(...commercialCountries.map((country) => country.launchYearByIndication.gbm))
    : null;
  const scopeControlsVisible = activeTab === 'commercial';

  useEffect(() => {
    if (!mobileControlsOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [mobileControlsOpen]);

  const changeTab = (tab: TabId) => {
    setActiveTab(tab);
    setMobileControlsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const resetBaseCase = () => {
    setScenario(ensureV8Markets(cloneScenario(baseScenario)));
    setOverviewCountryId('USA');
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
      const imported = ensureV8Markets(parseScenario(await file.text()));
      setScenario(imported);
      setScenarioFileError(null);
    } catch (error) {
      setScenarioFileError(error instanceof Error ? error.message : 'Could not import scenario.');
    } finally {
      event.target.value = '';
    }
  };

  const changeDealType = (type: DealType) => setDealTerms((current) => ({
    ...current,
    type,
    retainedCommercialPct: type === 'regional-license' ? 50 : 0,
    partnerDevelopmentFundingPct: type === 'self-commercialize' ? 0 : 100,
  }));

  const scopeControls = (
    <>
      <div className="scope-control-section">
        <div className="section-kicker">Indications</div>
        <div className="scope-indications">
          {Object.values(scenario.indications).map((indication) => (
            <label className="toggle-row" key={indication.id}>
              <input type="checkbox" checked={indication.enabled} disabled={indication.id === 'gbm'} onChange={(event) => updateIndication(indication.id, event.target.checked)} />
              <span>{indication.name}</span>
            </label>
          ))}
        </div>
      </div>
      <MarketSelector scenario={scenario} setScenario={setScenario} />
      <button className="secondary-button" onClick={resetBaseCase}>Reset base case</button>
    </>
  );

  return (
    <div className="app-shell app-shell-v8 app-shell-v9">
      <aside className="sidebar desktop-sidebar-v8">
        <div className="brand-block"><div className="brand-mark">SI</div><div><div className="eyebrow">DOUBLE BOND PHARMACEUTICAL</div><h1>SI-053 Strategic Model</h1></div></div>
        <nav className="nav-list" aria-label="Model sections">
          {visibleTabs.map((tab) => <button key={tab.id} className={`nav-button ${activeTab === tab.id ? 'active' : ''}`} onClick={() => changeTab(tab.id)}><span>{tab.label}</span>{tab.private && <small>PRIVATE</small>}</button>)}
        </nav>
        {scopeControlsVisible && <div className="desktop-scope-controls">{scopeControls}</div>}
      </aside>

      <main className="workspace workspace-v8 workspace-v9">
        <div className="mobile-command-bar" aria-label="Mobile model navigation">
          <label className="mobile-section-select">
            <span>Section</span>
            <select value={activeTab} onChange={(event) => changeTab(event.target.value as TabId)}>
              {visibleTabs.map((tab) => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
            </select>
          </label>
          {scopeControlsVisible && <button className="mobile-controls-button" onClick={() => setMobileControlsOpen(true)}>Markets & indications</button>}
        </div>

        <header className="topbar topbar-v8 topbar-v9">
          <div><div className="eyebrow">INTERACTIVE COMMERCIAL, DEVELOPMENT & VALUE MODEL</div><h2>{visibleTabs.find((tab) => tab.id === activeTab)?.label ?? 'SI-053 Strategic Model'}</h2></div>
          <div className="topbar-actions topbar-actions-v8"><div className="scenario-pill"><span className={`scenario-status ${privateConfigLoaded ? 'private-loaded' : ''}`} />{scenario.name}</div></div>
        </header>

        {activeTab === 'overview' && (
          <>
            {privateConfigLoaded && <div className="private-model-banner">Private local configuration loaded · {scenario.corporateCosts.length} corporate cost lines · {scenario.financingEvents.length} financing events.</div>}
            <section className="hero-grid hero-grid-v5">
              <div className="map-panel panel overview-globe-panel">
                <div className="panel-heading"><div><span className="section-kicker">Global opportunity</span><h3>Commercial footprint</h3></div><button className="text-button" onClick={() => changeTab('commercial')}>Open commercial model →</button></div>
                <CountryGlobe countries={Object.values(scenario.countries)} selectedCountryId={overviewCountryId} onSelectCountry={setOverviewCountryId} metricByCountry={overviewMetric} />
                <p className="model-note">Tap to highlight a modeled country. Market selection and assumptions are edited in Commercial & valuation.</p>
              </div>
              <div className="summary-panel panel">
                <span className="section-kicker">Model snapshot</span><h3>From patients to value</h3>
                <p className="summary-copy">{selectedIndications.map((item) => item.name).join(', ')} across {selectedCountries.length} active country markets.</p>
                <div className="summary-list">
                  <div><span>First modeled GBM launch</span><strong>{firstCommercialLaunch ?? '—'}</strong></div>
                  <div><span>Peak funding requirement</span><strong>{formatUsd(result.peakFundingRequirementUsd)}</strong></div>
                  <div><span>Break-even</span><strong>{result.breakEvenYear ?? 'Beyond horizon'}</strong></div>
                  <div><span>Stage-adjusted rNPV</span><strong>{formatUsd(result.valuation.riskAdjustedNpvUsd)}</strong></div>
                </div>
              </div>
            </section>
            <section className="kpi-grid kpi-grid-v7 overview-kpis-v9">
              <article className="kpi-card"><span>Peak revenue</span><strong>{formatUsd(result.peakRevenueUsd)}</strong><small>{result.peakRevenueYear}</small></article>
              <article className="kpi-card"><span>Cumulative revenue</span><strong>{formatUsd(result.cumulativeRevenueUsd)}</strong><small>{scenario.startYear}–{scenario.endYear}</small></article>
              <article className="kpi-card"><span>Peak eligible surgical patients</span><strong>{Math.round(result.peakEligiblePatients).toLocaleString()}</strong><small>selected indications & markets</small></article>
              <article className="kpi-card"><span>Peak treated patients</span><strong>{Math.round(result.peakTreatedPatients).toLocaleString()}</strong><small>after adoption/share assumptions</small></article>
            </section>
            <section className="chart-panel panel overview-chart-v9">
              <div className="panel-heading"><div><span className="section-kicker">Forecast</span><h3>Global gross revenue</h3></div></div>
              <RevenueChart data={result.years} countryYears={result.countryYears} scenario={scenario} />
            </section>
          </>
        )}

        {activeTab === 'commercial' && <CommercialValueTab scenario={scenario} result={result} setScenario={setScenario} />}
        {activeTab === 'development' && <DevelopmentTab scenario={scenario} result={result} setScenario={setScenario} />}

        {activeTab === 'methodology' && (
          <div className="methodology-page-v9">
            <section className="panel scenario-file-panel">
              <div><span className="section-kicker">Scenario files</span><h3>Import or export assumptions</h3><p className="model-note">Optional file actions live here rather than in the main navigation.</p></div>
              <div className="scenario-file-actions">
                {scenarioFileError && <span className="import-error" title={scenarioFileError}>Import error</span>}
                <input ref={fileInputRef} className="hidden-file-input" type="file" accept="application/json,.json" onChange={importScenarioFile} />
                <button className="toolbar-button" onClick={() => fileInputRef.current?.click()}>Import scenario</button>
                <button className="toolbar-button" onClick={exportScenarioFile}>Export scenario</button>
              </div>
            </section>
            <MethodologyTab />
          </div>
        )}

        {showPrivateModules && activeTab === 'deal' && (
          <section className="two-column-layout">
            <div className="panel controls-panel">
              <div className="panel-heading"><div><span className="section-kicker">Private module architecture</span><h3>Transaction structure</h3></div><span className="privacy-chip">DEMO TERMS</span></div>
              <label className="select-label">Strategy<select value={dealTerms.type} onChange={(event) => changeDealType(event.target.value as DealType)}><option value="self-commercialize">Self-commercialize</option><option value="regional-license">Regional license</option><option value="global-license">Global license</option><option value="acquisition">Acquisition</option></select></label>
              {dealTerms.type !== 'self-commercialize' && <><label>Upfront <b>{formatUsd(dealTerms.upfrontUsd)}</b><input type="range" min="0" max="1000000000" step="10000000" value={dealTerms.upfrontUsd} onChange={(event) => setDealTerms((current) => ({ ...current, upfrontUsd: +event.target.value }))} /></label><label>Milestones <b>{formatUsd(dealTerms.milestonesUsd)}</b><input type="range" min="0" max="2000000000" step="25000000" value={dealTerms.milestonesUsd} onChange={(event) => setDealTerms((current) => ({ ...current, milestonesUsd: +event.target.value }))} /></label></>}
            </div>
            <div className="panel deal-output">
              <span className="section-kicker">Indicative comparison</span><h3>{dealTerms.type.replace('-', ' ')}</h3>
              <div className="valuation-number"><span>Indicative model value</span><strong>{formatUsd(dealResult.indicativeValueUsd)}</strong></div>
              <div className="valuation-number secondary"><span>Remaining funding burden</span><strong>{formatUsd(dealResult.fundingBurdenUsd)}</strong></div>
            </div>
          </section>
        )}
      </main>

      {mobileControlsOpen && scopeControlsVisible && (
        <div className="mobile-controls-layer" role="dialog" aria-modal="true" aria-label="Markets and indications">
          <button className="mobile-controls-backdrop" aria-label="Close model controls" onClick={() => setMobileControlsOpen(false)} />
          <section className="mobile-controls-sheet">
            <div className="mobile-controls-sheet-head"><div><span className="section-kicker">Model scope</span><h3>Markets & indications</h3></div><button className="mobile-sheet-close" onClick={() => setMobileControlsOpen(false)}>Done</button></div>
            <div className="mobile-controls-scroll">{scopeControls}</div>
          </section>
        </div>
      )}
    </div>
  );
}
