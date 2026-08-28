import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { CashFlowChart } from './components/CashFlowChart';
import { CountryGlobe } from './components/CountryGlobe';
import { RevenueChart } from './components/RevenueChart';
import { baseScenario, cloneScenario } from './model/assumptions';
import { calculateModel } from './model/calculateModel';
import { calculateDeal, type DealTerms, type DealType } from './model/deal';
import { parseScenario, serializeScenario } from './model/scenarioIO';
import { buildScenarioPresets } from './model/scenarios';
import { methodologySources } from './model/sources';
import type { CountryAssumption, CountryId, IndicationId, Scenario } from './model/types';

type TabId =
  | 'overview'
  | 'global'
  | 'commercial'
  | 'development'
  | 'scenario'
  | 'valuation'
  | 'access'
  | 'deal'
  | 'methodology';

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

const formatUsd = (value: number) => {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
};

const formatPopulation = (value: number) => value >= 1_000_000_000
  ? `${(value / 1_000_000_000).toFixed(2)}B`
  : `${(value / 1_000_000).toFixed(1)}M`;

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
  const [selectedCountryId, setSelectedCountryId] = useState<CountryId>('USA');
  const [mapYear, setMapYear] = useState(2035);
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

  const updateCountry = <K extends keyof CountryAssumption>(
    countryId: CountryId,
    key: K,
    value: CountryAssumption[K],
  ) => {
    setScenario((current) => {
      const next = cloneScenario(current);
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

  const updateFinancial = <K extends keyof Scenario['financial']>(
    key: K,
    value: Scenario['financial'][K],
  ) => setScenario((current) => ({
    ...current,
    financial: { ...current.financial, [key]: value },
  }));

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
      if (!imported.countries[selectedCountryId]) setSelectedCountryId('USA');
    } catch (error) {
      setScenarioFileError(error instanceof Error ? error.message : 'Could not import scenario.');
    } finally {
      event.target.value = '';
    }
  };

  const changeDealType = (type: DealType) => {
    setDealTerms((current) => ({
      ...current,
      type,
      retainedCommercialPct: type === 'regional-license' ? 50 : 0,
      partnerDevelopmentFundingPct: type === 'self-commercialize' ? 0 : 100,
    }));
  };

  const selectedCountry = scenario.countries[selectedCountryId];
  const selectedCountryYear = result.countryYears.find(
    (row) => row.countryId === selectedCountryId && row.year === mapYear,
  );
  const mapMetricByCountry = useMemo(() => {
    const metric: Partial<Record<CountryId, number>> = {};
    result.countryYears
      .filter((row) => row.year === mapYear)
      .forEach((row) => { metric[row.countryId] = row.grossRevenueUsd; });
    return metric;
  }, [result.countryYears, mapYear]);

  const selectedCountries = Object.values(scenario.countries).filter((country) => country.enabled);
  const selectedIndications = Object.values(scenario.indications).filter((indication) => indication.enabled);
  const firstCommercialLaunch = selectedCountries.length
    ? Math.min(...selectedCountries.map((country) => country.launchYearByIndication.gbm))
    : null;
  const privateConfigLoaded = scenario.corporateCosts.length > 0 || scenario.financingEvents.length > 0;

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
          <div>
            <div className="eyebrow">DOUBLE BOND PHARMACEUTICAL</div>
            <h1>SI-053 Strategic Model</h1>
          </div>
        </div>

        <nav className="nav-list" aria-label="Model sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>{tab.private && <small>PRIVATE</small>}
            </button>
          ))}
        </nav>

        <div className="sidebar-section">
          <div className="section-kicker">Indications</div>
          {Object.values(scenario.indications).map((indication) => (
            <label className="toggle-row" key={indication.id}>
              <input
                type="checkbox"
                checked={indication.enabled}
                disabled={indication.id === 'gbm'}
                onChange={(event) => updateIndication(indication.id, event.target.checked)}
              />
              <span>{indication.name}</span>
            </label>
          ))}
        </div>

        <div className="sidebar-section compact-market-list">
          <div className="section-kicker">Markets</div>
          {Object.values(scenario.countries).map((country) => (
            <label className="toggle-row" key={country.id}>
              <input
                type="checkbox"
                checked={country.enabled}
                onChange={(event) => updateCountry(country.id, 'enabled', event.target.checked)}
              />
              <span>{country.name}</span>
            </label>
          ))}
        </div>

        <button className="secondary-button" onClick={() => setScenario(cloneScenario(baseScenario))}>
          Reset base case
        </button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <div className="eyebrow">INTERACTIVE COMMERCIAL, DEVELOPMENT & VALUE MODEL</div>
            <h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
          </div>
          <div className="topbar-actions">
            {scenarioFileError && <span className="import-error" title={scenarioFileError}>Import error</span>}
            <input
              ref={fileInputRef}
              className="hidden-file-input"
              type="file"
              accept="application/json,.json"
              onChange={importScenarioFile}
            />
            <button className="toolbar-button" onClick={() => fileInputRef.current?.click()}>Import</button>
            <button className="toolbar-button" onClick={exportScenarioFile}>Export</button>
            <div className="scenario-pill">
              <span className={`scenario-status ${privateConfigLoaded ? 'private-loaded' : ''}`} />
              {scenario.name}
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <>
            {privateConfigLoaded && (
              <div className="private-model-banner">
                Private local configuration loaded · {scenario.corporateCosts.length} corporate cost lines · {scenario.financingEvents.length} financing events. Nothing is uploaded by the import control.
              </div>
            )}
            <section className="hero-grid">
              <div className="map-panel panel">
                <div className="panel-heading">
                  <div><span className="section-kicker">Global opportunity</span><h3>Commercial footprint</h3></div>
                  <button className="text-button" onClick={() => setActiveTab('global')}>Explore map →</button>
                </div>
                <CountryGlobe
                  countries={Object.values(scenario.countries)}
                  selectedCountryId={selectedCountryId}
                  onSelectCountry={setSelectedCountryId}
                  metricByCountry={mapMetricByCountry}
                />
              </div>
              <div className="summary-panel panel">
                <span className="section-kicker">Model snapshot</span><h3>From patients to value</h3>
                <p className="summary-copy">
                  {selectedIndications.map((item) => item.name).join(', ')} across {selectedCountries.length} active country markets. Development timing, patient access and commercial assumptions flow into one model.
                </p>
                <div className="summary-list">
                  <div><span>First commercial launch</span><strong>{firstCommercialLaunch ?? '—'}</strong></div>
                  <div><span>Peak funding requirement</span><strong>{formatUsd(result.peakFundingRequirementUsd)}</strong></div>
                  <div><span>Break-even</span><strong>{result.breakEvenYear ?? 'Beyond horizon'}</strong></div>
                  <div><span>Risk-adjusted NPV</span><strong>{formatUsd(result.valuation.riskAdjustedNpvUsd)}</strong></div>
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
              <div className="panel-heading">
                <div><span className="section-kicker">Forecast</span><h3>Global gross revenue</h3></div>
                <div className="legend-inline"><span className="legend-bar" /> Revenue <span className="legend-cost" /> Development spend</div>
              </div>
              <RevenueChart data={result.years} />
            </section>
          </>
        )}

        {activeTab === 'global' && (
          <section className="global-layout">
            <div className="panel globe-large-panel">
              <div className="panel-heading">
                <div><span className="section-kicker">Year {mapYear}</span><h3>Global patient opportunity</h3></div>
                <div className="map-key"><i className="key-commercial" /> Commercial <i className="key-access" /> Named-patient</div>
              </div>
              <CountryGlobe
                countries={Object.values(scenario.countries)}
                selectedCountryId={selectedCountryId}
                onSelectCountry={setSelectedCountryId}
                metricByCountry={mapMetricByCountry}
              />
              <label className="year-slider">Model year <b>{mapYear}</b>
                <input type="range" min={scenario.startYear} max={scenario.endYear} value={mapYear} onChange={(event) => setMapYear(+event.target.value)} />
              </label>
            </div>
            <aside className="panel country-detail">
              <span className="section-kicker">Selected market</span><h3>{selectedCountry.name}</h3>
              <div className="country-stat"><span>Population</span><strong>{formatPopulation(selectedCountryYear?.population ?? selectedCountry.populationBase)}</strong></div>
              <div className="country-stat"><span>Access route</span><strong>{accessLabel(selectedCountry.accessRoute)}</strong></div>
              <div className="country-stat"><span>Eligible cases</span><strong>{Math.round(selectedCountryYear?.eligiblePatients ?? 0).toLocaleString()}</strong></div>
              <div className="country-stat"><span>Treated patients</span><strong>{Math.round(selectedCountryYear?.treatedPatients ?? 0).toLocaleString()}</strong></div>
              <div className="country-stat"><span>Revenue</span><strong>{formatUsd(selectedCountryYear?.grossRevenueUsd ?? 0)}</strong></div>
              <div className="patient-funnel">
                <div><span>Population accessible</span><b>{selectedCountry.accessiblePopulationPct}%</b></div>
                <div><span>GBM incidence /100k</span><b>{scenario.indications.gbm.incidencePer100kByRegion[selectedCountry.region].toFixed(2)}</b></div>
                <div><span>Surgery eligible</span><b>{(selectedCountry.surgeryEligibility.gbm * 100).toFixed(1)}%</b></div>
                <div><span>Peak share</span><b>{selectedCountry.peakSharePct}%</b></div>
              </div>
            </aside>
          </section>
        )}

        {activeTab === 'commercial' && (
          <section className="two-column-layout">
            <div className="panel controls-panel">
              <div className="panel-heading"><div><span className="section-kicker">Country markets</span><h3>Pricing & penetration</h3></div></div>
              {Object.values(scenario.countries).map((country) => (
                <div className={`market-control ${country.enabled ? '' : 'control-disabled'}`} key={country.id}>
                  <div className="market-control-title"><div><strong>{country.name}</strong><small>{country.region}</small></div><span>{accessLabel(country.accessRoute)}</span></div>
                  <label>Peak share <b>{country.peakSharePct}%</b>
                    <input type="range" min="1" max="60" step="1" value={country.peakSharePct} onChange={(event) => updateCountry(country.id, 'peakSharePct', +event.target.value)} />
                  </label>
                  <label>Price <b>{formatUsd(country.priceUsd)}</b>
                    <input type="range" min="5000" max="150000" step="5000" value={country.priceUsd} onChange={(event) => updateCountry(country.id, 'priceUsd', +event.target.value)} />
                  </label>
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

        {activeTab === 'development' && (
          <>
            <section className="panel development-panel">
              <div className="panel-heading">
                <div><span className="section-kicker">Development programme</span><h3>Clinical timeline</h3></div>
                <span className="privacy-chip">{privateConfigLoaded ? 'PRIVATE CONFIG ACTIVE' : 'PUBLIC / DEMO COST LAYER'}</span>
              </div>
              <div className="stage-table">
                <div className="stage-row stage-head"><span>Indication</span><span>Stage</span><span>Start</span><span>End</span><span>Modelled cost</span></div>
                {scenario.developmentStages
                  .filter((stage) => scenario.indications[stage.indication].enabled)
                  .map((stage) => (
                    <div className="stage-row" key={stage.id}>
                      <span>{scenario.indications[stage.indication].name}</span><strong>{stage.phase}</strong><span>{stage.startDate}</span><span>{stage.endDate}</span><span>{formatUsd(stage.publicCostUsd)}</span>
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
        )}

        {activeTab === 'scenario' && (
          <section className="scenario-grid">
            {scenarioCards.map(({ id, scenario: preset, result: presetResult }) => (
              <article className={`scenario-card ${scenario.name === preset.name ? 'selected' : ''}`} key={id}>
                <span className="section-kicker">{id}</span><h3>{preset.name}</h3>
                <div className="scenario-metrics">
                  <div><span>Peak sales</span><b>{formatUsd(presetResult.peakRevenueUsd)}</b></div>
                  <div><span>rNPV</span><b>{formatUsd(presetResult.valuation.riskAdjustedNpvUsd)}</b></div>
                  <div><span>Funding</span><b>{formatUsd(presetResult.peakFundingRequirementUsd)}</b></div>
                </div>
                <button className="primary-button" onClick={() => setScenario(cloneScenario(preset))}>Load scenario</button>
              </article>
            ))}
          </section>
        )}

        {activeTab === 'valuation' && (
          <section className="two-column-layout">
            <div className="panel valuation-hero">
              <span className="section-kicker">Explicit forecast to {scenario.endYear}</span><h3>Asset value</h3>
              <div className="valuation-number"><span>Risk-adjusted NPV</span><strong>{formatUsd(result.valuation.riskAdjustedNpvUsd)}</strong></div>
              <div className="valuation-number secondary"><span>Unrisked NPV</span><strong>{formatUsd(result.valuation.npvUsd)}</strong></div>
              <p className="model-note">No perpetual terminal value is used. This avoids treating finite pharmaceutical exclusivity as a business growing forever.</p>
            </div>
            <div className="panel controls-panel">
              <div className="panel-heading"><div><span className="section-kicker">Valuation assumptions</span><h3>Risk & discounting</h3></div></div>
              <div className="global-control">
                <label>Discount rate <b>{scenario.financial.discountRatePct.toFixed(2)}%</b><input type="range" min="5" max="20" step="0.25" value={scenario.financial.discountRatePct} onChange={(event) => updateFinancial('discountRatePct', +event.target.value)} /></label>
                <label>Risk adjustment <b>{scenario.financial.riskAdjustmentPct.toFixed(0)}%</b><input type="range" min="20" max="100" step="1" value={scenario.financial.riskAdjustmentPct} onChange={(event) => updateFinancial('riskAdjustmentPct', +event.target.value)} /></label>
                <label>Corporate tax <b>{scenario.financial.corporateTaxPct.toFixed(0)}%</b><input type="range" min="0" max="35" step="1" value={scenario.financial.corporateTaxPct} onChange={(event) => updateFinancial('corporateTaxPct', +event.target.value)} /></label>
              </div>
              <p className="model-note warning">The current public rNPV deliberately uses an aggregate risk factor. Stage-conditional probabilities should be validated before formal valuation use.</p>
            </div>
          </section>
        )}

        {activeTab === 'access' && (
          <section className="two-column-layout">
            {(['IND', 'CHN'] as CountryId[]).map((id) => {
              const country = scenario.countries[id];
              return (
                <div className="panel controls-panel" key={id}>
                  <div className="panel-heading">
                    <div><span className="section-kicker">Early / alternative access</span><h3>{country.name}</h3></div>
                    <label className="switch-label"><input type="checkbox" checked={country.enabled} onChange={(event) => updateCountry(id, 'enabled', event.target.checked)} /> In model</label>
                  </div>
                  <label className="select-label">Access route
                    <select value={country.accessRoute} onChange={(event) => updateCountry(id, 'accessRoute', event.target.value as CountryAssumption['accessRoute'])}>
                      <option value="none">Not available</option><option value="clinical-trial">Clinical trial only</option><option value="named-patient">Named-patient / early access</option><option value="commercial">Commercial</option>
                    </select>
                  </label>
                  <label>Accessible population <b>{country.accessiblePopulationPct}%</b><input type="range" min="1" max="100" value={country.accessiblePopulationPct} onChange={(event) => updateCountry(id, 'accessiblePopulationPct', +event.target.value)} /></label>
                  {country.accessRoute === 'named-patient' && country.namedPatient && (
                    <div className="named-patient-grid">
                      <label>Start year<input type="number" value={country.namedPatient.startYear} onChange={(event) => updateCountry(id, 'namedPatient', { ...country.namedPatient!, startYear: +event.target.value })} /></label>
                      <label>Starting centres<input type="number" value={country.namedPatient.centres} onChange={(event) => updateCountry(id, 'namedPatient', { ...country.namedPatient!, centres: +event.target.value })} /></label>
                      <label>Eligible / centre / yr<input type="number" value={country.namedPatient.eligiblePatientsPerCentre} onChange={(event) => updateCountry(id, 'namedPatient', { ...country.namedPatient!, eligiblePatientsPerCentre: +event.target.value })} /></label>
                      <label>Conversion %<input type="number" value={country.namedPatient.conversionPct} onChange={(event) => updateCountry(id, 'namedPatient', { ...country.namedPatient!, conversionPct: +event.target.value })} /></label>
                    </div>
                  )}
                  <p className="model-note">Country-specific legal/regulatory availability is not inferred by the calculator and must be verified separately.</p>
                </div>
              );
            })}
          </section>
        )}

        {activeTab === 'deal' && (
          <section className="two-column-layout">
            <div className="panel controls-panel">
              <div className="panel-heading">
                <div><span className="section-kicker">Private module architecture</span><h3>Transaction structure</h3></div>
                <span className="privacy-chip">DEMO TERMS</span>
              </div>
              <p className="model-note warning">This repository is public. No internal DBP transaction expectations are stored here; these are user-editable illustrative terms only.</p>
              <label className="select-label">Strategy
                <select value={dealTerms.type} onChange={(event) => changeDealType(event.target.value as DealType)}>
                  <option value="self-commercialize">Self-commercialize</option><option value="regional-license">Regional license</option><option value="global-license">Global license</option><option value="acquisition">Acquisition</option>
                </select>
              </label>
              {dealTerms.type !== 'self-commercialize' && <>
                <label>Upfront <b>{formatUsd(dealTerms.upfrontUsd)}</b><input type="range" min="0" max="1000000000" step="10000000" value={dealTerms.upfrontUsd} onChange={(event) => setDealTerms((current) => ({ ...current, upfrontUsd: +event.target.value }))} /></label>
                <label>Milestones <b>{formatUsd(dealTerms.milestonesUsd)}</b><input type="range" min="0" max="2000000000" step="25000000" value={dealTerms.milestonesUsd} onChange={(event) => setDealTerms((current) => ({ ...current, milestonesUsd: +event.target.value }))} /></label>
                {dealTerms.type !== 'acquisition' && <>
                  <label>Royalty <b>{dealTerms.royaltyPct}%</b><input type="range" min="0" max="35" value={dealTerms.royaltyPct} onChange={(event) => setDealTerms((current) => ({ ...current, royaltyPct: +event.target.value }))} /></label>
                  <label>Partner development funding <b>{dealTerms.partnerDevelopmentFundingPct}%</b><input type="range" min="0" max="100" value={dealTerms.partnerDevelopmentFundingPct} onChange={(event) => setDealTerms((current) => ({ ...current, partnerDevelopmentFundingPct: +event.target.value }))} /></label>
                  {dealTerms.type === 'regional-license' && <label>Commercial economics retained <b>{dealTerms.retainedCommercialPct}%</b><input type="range" min="0" max="100" value={dealTerms.retainedCommercialPct} onChange={(event) => setDealTerms((current) => ({ ...current, retainedCommercialPct: +event.target.value }))} /></label>}
                </>}
              </>}
            </div>
            <div className="panel deal-output">
              <span className="section-kicker">Indicative comparison</span><h3>{dealTerms.type.replace('-', ' ')}</h3>
              <div className="valuation-number"><span>Indicative model value</span><strong>{formatUsd(dealResult.indicativeValueUsd)}</strong></div>
              <div className="valuation-number secondary"><span>Remaining funding burden</span><strong>{formatUsd(dealResult.fundingBurdenUsd)}</strong></div>
              {dealTerms.type !== 'self-commercialize' && dealTerms.type !== 'acquisition' && (
                <div className="deal-breakdown">
                  <div><span>Upfront</span><b>{formatUsd(dealResult.upfrontValueUsd)}</b></div>
                  <div><span>Risk-adjusted milestones</span><b>{formatUsd(dealResult.riskAdjustedMilestonesUsd)}</b></div>
                  <div><span>Royalty NPV</span><b>{formatUsd(dealResult.royaltyNpvUsd)}</b></div>
                  <div><span>Retained rNPV</span><b>{formatUsd(dealResult.retainedValueUsd)}</b></div>
                </div>
              )}
              <p className="model-note">Royalties are discounted and risk-adjusted in this comparison. This remains a strategic framework, not a fairness opinion or transaction valuation.</p>
            </div>
          </section>
        )}

        {activeTab === 'methodology' && (
          <section className="methodology-layout">
            <div className="panel methodology-intro">
              <span className="section-kicker">Model lineage</span><h3>What is data, what is a scenario?</h3>
              <div className="model-pipeline">
                <span>Population</span><i>→</i><span>Incidence</span><i>→</i><span>Surgery eligibility</span><i>→</i><span>Access</span><i>→</i><span>Adoption</span><i>→</i><span>Revenue</span><i>→</i><span>Cash flow</span><i>→</i><span>NPV / rNPV</span>
              </div>
              <p className="model-note">The public model deliberately distinguishes literature/workbook inputs from strategic scenario assumptions. India/China accessibility, price, penetration and transaction terms are not presented as observed facts.</p>
            </div>
            {sourceCategories.map((category) => (
              <div className="methodology-section" key={category}>
                <div className="section-kicker">{category}</div>
                <div className="source-grid">
                  {methodologySources.filter((source) => source.category === category).map((source) => (
                    <article className="source-card panel" key={source.id}>
                      <div className="source-meta"><span className={`source-status ${source.status}`}>{sourceStatusLabel(source.status)}</span><span>{source.appliesTo}</span></div>
                      <h3>{source.label}</h3>
                      <p>{source.note}</p>
                      {source.url && <a href={source.url} target="_blank" rel="noreferrer">Open source ↗</a>}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
