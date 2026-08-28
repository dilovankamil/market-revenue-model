import { useMemo, useState } from 'react';
import { RevenueChart } from './components/RevenueChart';
import { baseScenario, cloneScenario } from './model/assumptions';
import { calculateModel } from './model/calculateModel';
import type { IndicationId, MarketId, Scenario } from './model/types';

type TabId = 'overview' | 'commercial' | 'development' | 'scenario';

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'commercial', label: 'Commercial model' },
  { id: 'development', label: 'Development' },
  { id: 'scenario', label: 'Scenario lab' },
];

const marketAccent: Record<MarketId, string> = {
  US: '#65d6ff',
  EU4UK: '#a6b9ff',
  Japan: '#f6c567',
  India: '#ff8a7a',
};

const formatUsd = (value: number) => {
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${Math.round(value).toLocaleString()}`;
};

const formatPopulation = (value: number) => `${(value / 1_000_000).toFixed(0)}M`;

function App() {
  const [scenario, setScenario] = useState<Scenario>(() => cloneScenario(baseScenario));
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const result = useMemo(() => calculateModel(scenario), [scenario]);

  const updateMarket = <K extends keyof Scenario['markets'][MarketId]>(
    marketId: MarketId,
    key: K,
    value: Scenario['markets'][MarketId][K],
  ) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      next.markets[marketId][key] = value;
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

  const updateScenarioNumber = (key: 'erosionPct' | 'operatingCostPct' | 'patentExtensionYears', value: number) => {
    setScenario((current) => ({ ...current, [key]: value }));
  };

  const resetScenario = () => setScenario(cloneScenario(baseScenario));

  const selectedMarkets = Object.values(scenario.markets).filter((market) => market.enabled);
  const selectedIndications = Object.values(scenario.indications).filter((indication) => indication.enabled);

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
              {tab.label}
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

        <div className="sidebar-section">
          <div className="section-kicker">Markets</div>
          {Object.values(scenario.markets).map((market) => (
            <label className="toggle-row" key={market.id}>
              <input
                type="checkbox"
                checked={market.enabled}
                onChange={(event) => updateMarket(market.id, 'enabled', event.target.checked)}
              />
              <span className="market-dot" style={{ background: marketAccent[market.id] }} />
              <span>{market.name}</span>
            </label>
          ))}
        </div>

        <button className="secondary-button" onClick={resetScenario}>Reset base case</button>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <div className="eyebrow">INTERACTIVE COMMERCIAL & DEVELOPMENT MODEL</div>
            <h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
          </div>
          <div className="scenario-pill">
            <span className="scenario-status" />
            Base case
          </div>
        </header>

        {activeTab === 'overview' && (
          <>
            <section className="hero-grid">
              <div className="map-panel panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-kicker">Global opportunity</span>
                    <h3>Markets in scope</h3>
                  </div>
                  <span className="muted-label">Country map layer next</span>
                </div>

                <div className="market-orbit" aria-label="Selected geographic markets">
                  <div className="globe-ring ring-one" />
                  <div className="globe-ring ring-two" />
                  <div className="globe-core">SI-053</div>
                  {Object.values(scenario.markets).map((market, index) => (
                    <button
                      key={market.id}
                      className={`market-node node-${index + 1} ${market.enabled ? 'enabled' : 'disabled'}`}
                      style={{ '--market-color': marketAccent[market.id] } as React.CSSProperties}
                      onClick={() => updateMarket(market.id, 'enabled', !market.enabled)}
                    >
                      <strong>{market.name}</strong>
                      <span>{formatPopulation(market.population)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="summary-panel panel">
                <span className="section-kicker">Base case</span>
                <h3>Commercial snapshot</h3>
                <p className="summary-copy">
                  {selectedIndications.map((item) => item.name).join(', ')} across {selectedMarkets.length} selected markets.
                  Assumptions update the model immediately.
                </p>

                <div className="summary-list">
                  <div><span>Launch anchor</span><strong>2030</strong></div>
                  <div><span>Operating cost rate</span><strong>{scenario.operatingCostPct.toFixed(1)}%</strong></div>
                  <div><span>Post-LoE erosion</span><strong>{scenario.erosionPct.toFixed(1)}%</strong></div>
                  <div><span>Patent extension</span><strong>+{scenario.patentExtensionYears} yrs</strong></div>
                </div>
              </div>
            </section>

            <section className="kpi-grid">
              <article className="kpi-card">
                <span>Peak revenue</span>
                <strong>{formatUsd(result.peakRevenueUsd)}</strong>
                <small>{result.peakRevenueYear}</small>
              </article>
              <article className="kpi-card">
                <span>Cumulative revenue</span>
                <strong>{formatUsd(result.cumulativeRevenueUsd)}</strong>
                <small>{scenario.startYear}–{scenario.endYear}</small>
              </article>
              <article className="kpi-card">
                <span>Peak treated patients</span>
                <strong>{Math.round(result.peakTreatedPatients).toLocaleString()}</strong>
                <small>annual</small>
              </article>
              <article className="kpi-card">
                <span>Cumulative cash flow</span>
                <strong>{formatUsd(result.cumulativeCashFlowUsd)}</strong>
                <small>prototype scope</small>
              </article>
            </section>

            <section className="chart-panel panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">Forecast</span>
                  <h3>Global gross revenue</h3>
                </div>
                <div className="legend-inline"><span className="legend-bar" /> Revenue <span className="legend-cost" /> Development event</div>
              </div>
              <RevenueChart data={result.years} />
            </section>
          </>
        )}

        {activeTab === 'commercial' && (
          <section className="two-column-layout">
            <div className="panel controls-panel">
              <div className="panel-heading"><div><span className="section-kicker">Markets</span><h3>Commercial assumptions</h3></div></div>
              {Object.values(scenario.markets).map((market) => (
                <div className={`market-control ${market.enabled ? '' : 'control-disabled'}`} key={market.id}>
                  <div className="market-control-title">
                    <div><span className="market-dot" style={{ background: marketAccent[market.id] }} /><strong>{market.name}</strong></div>
                    <span>{formatPopulation(market.population)}</span>
                  </div>
                  <label>Peak share <b>{market.peakSharePct}%</b>
                    <input type="range" min="5" max="60" step="1" value={market.peakSharePct} onChange={(e) => updateMarket(market.id, 'peakSharePct', +e.target.value)} />
                  </label>
                  <label>Price <b>{formatUsd(market.priceUsd)}</b>
                    <input type="range" min="5000" max="150000" step="5000" value={market.priceUsd} onChange={(e) => updateMarket(market.id, 'priceUsd', +e.target.value)} />
                  </label>
                </div>
              ))}
            </div>

            <div className="panel controls-panel">
              <div className="panel-heading"><div><span className="section-kicker">Portfolio</span><h3>Global assumptions</h3></div></div>
              <div className="global-control">
                <label>Operating cost rate <b>{scenario.operatingCostPct.toFixed(1)}%</b>
                  <input type="range" min="0" max="30" step="0.5" value={scenario.operatingCostPct} onChange={(e) => updateScenarioNumber('operatingCostPct', +e.target.value)} />
                </label>
                <label>Post-LoE erosion <b>{scenario.erosionPct.toFixed(1)}%</b>
                  <input type="range" min="0" max="40" step="0.5" value={scenario.erosionPct} onChange={(e) => updateScenarioNumber('erosionPct', +e.target.value)} />
                </label>
                <label>Patent extension <b>+{scenario.patentExtensionYears} years</b>
                  <input type="range" min="0" max="10" step="1" value={scenario.patentExtensionYears} onChange={(e) => updateScenarioNumber('patentExtensionYears', +e.target.value)} />
                </label>
              </div>
              <div className="mini-chart"><RevenueChart data={result.years} /></div>
            </div>
          </section>
        )}

        {activeTab === 'development' && (
          <section className="panel development-panel">
            <span className="section-kicker">Development programme</span>
            <h3>Clinical and indication expansion events</h3>
            <div className="timeline-list">
              {scenario.developmentCosts
                .filter((cost) => !cost.indication || scenario.indications[cost.indication].enabled)
                .map((cost) => (
                  <div className="timeline-row" key={cost.id}>
                    <span className="timeline-year">{cost.year}</span>
                    <span className="timeline-line" />
                    <div><strong>{cost.label}</strong><small>{formatUsd(cost.amountUsd)} modelled cost</small></div>
                  </div>
                ))}
            </div>
            <p className="model-note">This first branch preserves the prototype development-cost structure. The uploaded finance workbook will replace these coarse annual events with the detailed programme schedule in the next pass.</p>
          </section>
        )}

        {activeTab === 'scenario' && (
          <section className="scenario-grid">
            {['Conservative', 'Base case', 'Expansion'].map((name, index) => (
              <article className={`scenario-card ${index === 1 ? 'selected' : ''}`} key={name}>
                <span className="section-kicker">Scenario {index + 1}</span>
                <h3>{name}</h3>
                <p>{index === 1 ? 'Current interactive assumptions.' : 'Preset scenario framework ready for dedicated bear/bull assumptions.'}</p>
                <strong>{index === 1 ? formatUsd(result.peakRevenueUsd) : '—'}</strong>
                <small>peak revenue</small>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
