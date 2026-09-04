import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CommercialValueTab } from './components/CommercialValueTab';
import { DevelopmentTab } from './components/DevelopmentTab';
import { MarketSelector } from './components/MarketSelector';
import { MethodologyTab } from './components/MethodologyTab';
import { ScenarioFileControls } from './components/ScenarioFileControls';
import { Si053StoryPage } from './components/Si053StoryPage';
import { cloneScenario } from './model/assumptions';
import { calculateModel } from './model/calculateModel';
import { createDefaultScenario } from './model/defaultScenario';
import { calculateDeal, type DealTerms, type DealType } from './model/deal';
import type { IndicationId, Scenario } from './model/types';

type TabId = 'overview' | 'commercial' | 'development' | 'deal' | 'methodology';

const tabs: { id: TabId; label: string; private?: boolean }[] = [
  { id: 'overview', label: 'SI-053' },
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

export default function App() {
  const [scenario, setScenario] = useState<Scenario>(() => createDefaultScenario());
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const mobileControlsButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileControlsCloseRef = useRef<HTMLButtonElement | null>(null);
  const mobileControlsSheetRef = useRef<HTMLElement | null>(null);
  const [dealTerms, setDealTerms] = useState<DealTerms>({
    type: 'self-commercialize', upfrontUsd: 100_000_000, royaltyPct: 18,
    retainedCommercialPct: 0, partnerDevelopmentFundingPct: 100, milestonesUsd: 250_000_000,
  });

  const result = useMemo(() => calculateModel(scenario), [scenario]);
  const dealResult = useMemo(() => calculateDeal(result, dealTerms), [result, dealTerms]);
  const privateConfigLoaded = scenario.corporateCosts.length > 0 || scenario.financingEvents.length > 0;
  const scopeControlsVisible = activeTab === 'commercial' || activeTab === 'development';

  useEffect(() => {
    if (!mobileControlsOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileControlsOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(mobileControlsSheetRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const frame = window.requestAnimationFrame(() => mobileControlsCloseRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previous;
      mobileControlsButtonRef.current?.focus();
    };
  }, [mobileControlsOpen]);

  // A story page can be several viewport-heights tall. Reset after React commits
  // the next section so a dashboard never inherits the story's scroll position.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeTab]);

  const changeTab = (tab: TabId) => {
    if (tab === activeTab) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setActiveTab(tab);
    setMobileControlsOpen(false);
  };

  const updateIndication = (id: IndicationId, enabled: boolean) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      next.indications[id].enabled = enabled;
      return next;
    });
  };

  const resetBaseCase = () => setScenario(createDefaultScenario());

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
      <button type="button" className="secondary-button" onClick={resetBaseCase}>Reset base case</button>
    </>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar desktop-sidebar">
        <div className="brand-block">
          <div className="brand-logo-frame"><img className="brand-logo" src={`${import.meta.env.BASE_URL}DBP_Logo_New.png`} alt="Double Bond Pharmaceutical" /></div>
          <div className="brand-product"><div className="eyebrow">STRATEGIC MODEL</div><div className="brand-title">SI-053 Strategic Model</div></div>
        </div>
        <nav className="nav-list" aria-label="Model sections">
          {visibleTabs.map((tab) => <button type="button" key={tab.id} className={`nav-button ${activeTab === tab.id ? 'active' : ''}`} aria-current={activeTab === tab.id ? 'page' : undefined} onClick={() => changeTab(tab.id)}><span>{tab.label}</span>{tab.private && <small>PRIVATE</small>}</button>)}
        </nav>
        {scopeControlsVisible && <div className="desktop-scope-controls">{scopeControls}</div>}
      </aside>

      <main className={`workspace app-workspace ${activeTab === 'overview' ? 'story-workspace' : ''}`}>
        <h1 className="sr-only">SI-053 Strategic Model</h1>
        <nav className="mobile-command-bar" aria-label="Mobile model navigation">
          <label className="mobile-section-select">
            <span>Section</span>
            <select value={activeTab} onChange={(event) => changeTab(event.target.value as TabId)}>
              {visibleTabs.map((tab) => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
            </select>
          </label>
          {scopeControlsVisible && <button ref={mobileControlsButtonRef} type="button" className="mobile-controls-button" aria-haspopup="dialog" aria-expanded={mobileControlsOpen} onClick={() => setMobileControlsOpen(true)}>Markets & indications</button>}
        </nav>

        {activeTab !== 'overview' && (
          <header className="topbar app-topbar">
            <div><div className="eyebrow">INTERACTIVE COMMERCIAL, DEVELOPMENT & VALUE MODEL</div><h2>{visibleTabs.find((tab) => tab.id === activeTab)?.label ?? 'SI-053 Strategic Model'}</h2></div>
            <div className="topbar-actions"><div className="scenario-pill"><span className={`scenario-status ${privateConfigLoaded ? 'private-loaded' : ''}`} />{scenario.name}</div></div>
          </header>
        )}

        {showPrivateModules && activeTab !== 'overview' && <ScenarioFileControls scenario={scenario} setScenario={setScenario} />}

        {activeTab === 'overview' && (
          <>
            {privateConfigLoaded && <div className="private-model-banner">Private local configuration loaded · {scenario.corporateCosts.length} corporate cost lines · {scenario.financingEvents.length} financing events.</div>}
            <Si053StoryPage onOpenCommercial={() => changeTab('commercial')} onOpenDevelopment={() => changeTab('development')} />
          </>
        )}

        {activeTab === 'commercial' && <CommercialValueTab scenario={scenario} result={result} setScenario={setScenario} />}
        {activeTab === 'development' && <DevelopmentTab scenario={scenario} result={result} setScenario={setScenario} />}
        {activeTab === 'methodology' && <div className="methodology-page"><MethodologyTab /></div>}

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
          <button type="button" className="mobile-controls-backdrop" aria-label="Close model controls" onClick={() => setMobileControlsOpen(false)} />
          <section ref={mobileControlsSheetRef} className="mobile-controls-sheet">
            <div className="mobile-controls-sheet-head"><div><span className="section-kicker">Model scope</span><h3>Markets & indications</h3></div><button ref={mobileControlsCloseRef} type="button" className="mobile-sheet-close" onClick={() => setMobileControlsOpen(false)}>Done</button></div>
            <div className="mobile-controls-scroll">{scopeControls}</div>
          </section>
        </div>
      )}
    </div>
  );
}
