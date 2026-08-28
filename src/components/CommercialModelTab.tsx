import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { RevenueChart } from './RevenueChart';
import { cloneScenario } from '../model/assumptions';
import { REGION_ORDER } from '../model/marketRegions';
import { buildScenarioPresets, type ScenarioPresetId } from '../model/scenarios';
import type { CountryAssumption, ModelResult, RegionId, Scenario } from '../model/types';

interface Props {
  scenario: Scenario;
  result: ModelResult;
  setScenario: Dispatch<SetStateAction<Scenario>>;
}

const formatUsd = (value: number) => {
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value).toLocaleString()}`;
};

const accessLabel = (route: CountryAssumption['accessRoute']) => ({ commercial: 'Commercial', 'clinical-trial': 'Clinical trial', none: 'Not available' }[route]);
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
const PRESET_IDS: ScenarioPresetId[] = ['conservative', 'base', 'expansion'];
const PRESET_LABELS: Record<ScenarioPresetId, string> = { conservative: 'Conservative', base: 'Base', expansion: 'Expansion' };
const PRESET_NOTES: Record<ScenarioPresetId, string> = {
  conservative: 'Lower price/share · +2 year launch delay · higher erosion/discounting',
  base: 'Core North America + Europe + Japan · GBM launch after Phase II',
  expansion: 'Global market footprint · BM + OPBT · higher penetration · +2 years exclusivity',
};

export function CommercialModelTab({ scenario, result, setScenario }: Props) {
  const [advanced, setAdvanced] = useState(false);
  const [presetIndex, setPresetIndex] = useState(() => scenario.name === 'Conservative' ? 0 : scenario.name === 'Expansion' ? 2 : 1);
  const advancedRef = useRef<HTMLElement | null>(null);
  const presets = useMemo(() => buildScenarioPresets(), []);

  useEffect(() => {
    if (scenario.name === 'Conservative') setPresetIndex(0);
    else if (scenario.name === 'Expansion') setPresetIndex(2);
    else if (scenario.name === 'Base case') setPresetIndex(1);
  }, [scenario.name]);

  const applyPreset = (index: number) => {
    const bounded = Math.max(0, Math.min(2, index));
    setPresetIndex(bounded);
    setScenario(cloneScenario(presets[PRESET_IDS[bounded]]));
  };

  const updateCountry = <K extends keyof CountryAssumption>(countryId: string, key: K, value: CountryAssumption[K]) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      if (!next.countries[countryId]) return current;
      next.countries[countryId][key] = value;
      return next;
    });
  };

  const updateFinancial = <K extends keyof Scenario['financial']>(key: K, value: Scenario['financial'][K]) => {
    setScenario((current) => ({ ...current, financial: { ...current.financial, [key]: value } }));
  };

  const regionCards = useMemo(() => REGION_ORDER.map((region) => {
    const countries = Object.values(scenario.countries).filter((country) => country.enabled && country.region === region && country.accessRoute === 'commercial');
    const ids = new Set(countries.map((country) => country.id));
    const yearRevenue = result.years.map((year) => result.countryYears.filter((row) => row.year === year.year && ids.has(row.countryId)).reduce((sum, row) => sum + row.grossRevenueUsd, 0));
    return {
      region,
      countries,
      price: average(countries.map((country) => country.priceUsd)),
      share: average(countries.map((country) => country.peakSharePct)),
      launch: countries.length ? Math.min(...countries.map((country) => country.launchYearByIndication.gbm)) : null,
      peakRevenue: Math.max(0, ...yearRevenue),
    };
  }), [scenario.countries, result.countryYears, result.years]);

  const updateRegion = (region: RegionId, key: 'priceUsd' | 'peakSharePct', value: number) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      Object.values(next.countries).filter((country) => country.enabled && country.region === region && country.accessRoute === 'commercial').forEach((country) => { country[key] = value; });
      return next;
    });
  };

  const toggleAdvanced = () => {
    if (advanced) { setAdvanced(false); return; }
    setAdvanced(true);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => advancedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })));
  };

  const activePreset = PRESET_IDS[presetIndex];

  return (
    <>
      <section className="panel commercial-preset-panel">
        <div className="commercial-preset-copy">
          <span className="section-kicker">Commercial case</span>
          <h3>{PRESET_LABELS[activePreset]}</h3>
          <p>{PRESET_NOTES[activePreset]}</p>
        </div>
        <div className="preset-slider-shell">
          <input aria-label="Commercial planning case" type="range" min="0" max="2" step="1" value={presetIndex} onChange={(event) => applyPreset(+event.target.value)} />
          <div className="preset-slider-labels">
            {PRESET_IDS.map((id, index) => <button key={id} className={index === presetIndex ? 'active' : ''} onClick={() => applyPreset(index)}>{PRESET_LABELS[id]}</button>)}
          </div>
        </div>
      </section>

      <section className="panel commercial-simple-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">Commercial assumptions</span>
            <h3>Set the big levers first</h3>
            <p className="panel-subcopy">The simple view groups active commercial markets by region. Changes apply to every active market in that region.</p>
          </div>
          <button className="advanced-toggle" onClick={toggleAdvanced}><span>{advanced ? '−' : '+'}</span>{advanced ? 'Hide advanced' : 'Advanced controls ↓'}</button>
        </div>

        <div className="commercial-region-grid">
          {regionCards.filter((card) => card.countries.length > 0).map((card) => (
            <article className="commercial-region-card" key={card.region}>
              <div className="region-card-heading">
                <div><span>{card.region}</span><strong>{card.countries.length} active market{card.countries.length === 1 ? '' : 's'}</strong></div>
                {card.launch && <small>First modeled GBM launch {card.launch}</small>}
              </div>
              <div className="region-kpi"><span>Peak regional revenue</span><b>{formatUsd(card.peakRevenue)}</b></div>
              <label>Treatment price <b>{formatUsd(card.price)}</b><input type="range" min="5000" max="150000" step="5000" value={card.price} onChange={(event) => updateRegion(card.region, 'priceUsd', +event.target.value)} /></label>
              <label>Peak market share <b>{card.share.toFixed(0)}%</b><input type="range" min="1" max="60" step="1" value={card.share} onChange={(event) => updateRegion(card.region, 'peakSharePct', +event.target.value)} /></label>
            </article>
          ))}
        </div>
        <p className="model-note">The base case first commercial year is 2032, after the modeled Phase II ends in August 2031. This assumes a successful accelerated/conditional regulatory strategy; orphan designation provides incentives and exclusivity but does not itself authorize sale after Phase II.</p>
      </section>

      <section className="panel chart-panel commercial-forecast-panel">
        <div className="panel-heading"><div><span className="section-kicker">Forecast</span><h3>Global gross revenue</h3></div><span className="chart-context-note">Totals shown above each stacked bar</span></div>
        <RevenueChart data={result.years} countryYears={result.countryYears} scenario={scenario} />
      </section>

      {advanced && (
        <section className="advanced-commercial-shell" ref={advancedRef}>
          <div className="advanced-section-heading"><span>Advanced commercial model</span><small>Country-level assumptions and portfolio economics</small></div>
          <div className="two-column-layout">
            <div className="panel controls-panel">
              <div className="panel-heading"><div><span className="section-kicker">Country markets</span><h3>Pricing & penetration</h3></div></div>
              {Object.values(scenario.countries).filter((country) => country.enabled).map((country) => (
                <div className="market-control" key={country.id}>
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
            </div>
          </div>
        </section>
      )}
    </>
  );
}
