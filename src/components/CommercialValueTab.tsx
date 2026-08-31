import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { CountryGlobe } from './CountryGlobe';
import { cloneScenario } from '../model/assumptions';
import { REGION_COLORS, REGION_ORDER } from '../model/marketRegions';
import type { CountryAssumption, CountryId, ModelResult, RegionId, Scenario } from '../model/types';

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
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${Math.round(abs).toLocaleString()}`;
};

const formatPopulation = (value: number) => value >= 1_000_000_000
  ? `${(value / 1_000_000_000).toFixed(2)}B`
  : `${(value / 1_000_000).toFixed(1)}M`;

const formatLaunchMonth = (month: number, year: number) =>
  `${new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2020, month - 1, 1)))} ${year}`;

const average = (values: number[]) => values.length
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : 0;

export function CommercialValueTab({ scenario, result, setScenario }: Props) {
  const [mapYear, setMapYear] = useState(2035);

  const commercialCountries = useMemo(
    () => Object.values(scenario.countries).filter((country) => country.accessRoute === 'commercial'),
    [scenario.countries],
  );
  const activeCountries = useMemo(
    () => commercialCountries.filter((country) => country.enabled),
    [commercialCountries],
  );
  const activeIds = useMemo(() => new Set(activeCountries.map((country) => country.id)), [activeCountries]);

  const fallbackPrice = average(activeCountries.map((country) => country.priceUsd));
  const fallbackShare = average(activeCountries.map((country) => country.peakSharePct));
  const referencePrice = scenario.countries.USA?.priceUsd ?? (fallbackPrice || 75_000);
  const referenceShare = scenario.countries.USA?.peakSharePct ?? (fallbackShare || 30);

  const firstLaunch = activeCountries.length
    ? activeCountries.reduce((earliest, country) => {
      const year = country.launchYearByIndication.gbm;
      const month = country.launchMonthByIndication?.gbm ?? 1;
      const index = year * 12 + month - 1;
      return index < earliest.index ? { year, month, index } : earliest;
    }, { year: scenario.endYear + 1, month: 1, index: (scenario.endYear + 1) * 12 })
    : null;

  const scaleCommercialPortfolio = (key: 'priceUsd' | 'peakSharePct', targetReference: number) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      const countries = Object.values(next.countries).filter((country) => country.accessRoute === 'commercial');
      const referenceCountry = next.countries.USA;
      const currentReference = referenceCountry?.[key] ?? average(countries.map((country) => country[key]));
      const ratio = currentReference > 0 ? targetReference / currentReference : 1;
      countries.forEach((country) => {
        if (key === 'priceUsd') country.priceUsd = Math.max(5_000, Math.min(150_000, Math.round(country.priceUsd * ratio / 1000) * 1000));
        else country.peakSharePct = Math.max(1, Math.min(100, Math.round(country.peakSharePct * ratio)));
      });
      return next;
    });
  };

  const updateFinancial = <K extends keyof Scenario['financial']>(key: K, value: Scenario['financial'][K]) => {
    setScenario((current) => ({ ...current, financial: { ...current.financial, [key]: value } }));
  };

  const updateRegion = (region: RegionId, key: 'priceUsd' | 'peakSharePct', value: number) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      Object.values(next.countries)
        .filter((country) => country.region === region && country.accessRoute === 'commercial')
        .forEach((country) => { country[key] = value; });
      return next;
    });
  };

  const updateCountry = <K extends keyof CountryAssumption>(countryId: CountryId, key: K, value: CountryAssumption[K]) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      if (next.countries[countryId]) next.countries[countryId][key] = value;
      return next;
    });
  };

  const toggleCountry = (countryId: CountryId) => {
    setScenario((current) => {
      const country = current.countries[countryId];
      if (!country || country.accessRoute !== 'commercial') return current;
      const next = cloneScenario(current);
      next.countries[countryId].enabled = !country.enabled;
      return next;
    });
  };

  const yearResult = result.years.find((row) => row.year === mapYear);
  const yearCountryRows = result.countryYears.filter((row) => row.year === mapYear && activeIds.has(row.countryId));
  const representedPopulation = yearCountryRows.reduce((sum, row) => sum + row.population, 0);

  const regionCards = useMemo(() => REGION_ORDER.map((region) => {
    const countries = commercialCountries.filter((country) => country.region === region);
    const active = countries.filter((country) => country.enabled);
    const activeRegionIds = new Set(active.map((country) => country.id));
    const peakRevenue = active.length
      ? Math.max(0, ...result.years.map((year) => result.countryYears
        .filter((row) => row.year === year.year && activeRegionIds.has(row.countryId))
        .reduce((sum, row) => sum + row.grossRevenueUsd, 0)))
      : 0;
    return {
      region,
      countries,
      activeCount: active.length,
      price: average(countries.map((country) => country.priceUsd)),
      share: average(countries.map((country) => country.peakSharePct)),
      peakRevenue,
    };
  }).filter((card) => card.countries.length > 0), [commercialCountries, result.countryYears, result.years]);

  return (
    <div className="commercial-value-page">
      <section className="cv-kpi-strip">
        <article><span>Active markets</span><strong>{activeCountries.length}</strong></article>
        <article><span>First modeled GBM launch</span><strong>{firstLaunch ? formatLaunchMonth(firstLaunch.month, firstLaunch.year) : '—'}</strong></article>
        <article><span>Peak eligible surgical patients</span><strong>{Math.round(result.peakEligiblePatients).toLocaleString()}</strong></article>
        <article><span>Peak treated patients</span><strong>{Math.round(result.peakTreatedPatients).toLocaleString()}</strong></article>
        <article><span>Peak revenue</span><strong>{formatUsd(result.peakRevenueUsd)}</strong></article>
        <article className="cv-value-kpi"><span>Stage-adjusted rNPV</span><strong>{formatUsd(result.valuation.riskAdjustedNpvUsd)}</strong></article>
      </section>

      <section className="panel cv-levers-panel">
        <div className="panel-heading">
          <div><span className="section-kicker">Core assumptions</span><h3>Commercial & valuation levers</h3></div>
          <span className="chart-context-note">Market selection is controlled from Markets & indications or directly on the globe</span>
        </div>
        <div className="cv-lever-grid">
          <label>Treatment price <b>{formatUsd(referencePrice)}</b><input type="range" min={25_000} max={150_000} step={1_000} value={Math.round(referencePrice / 1000) * 1000} onChange={(event) => scaleCommercialPortfolio('priceUsd', +event.target.value)} /><small>Core-market reference price. It stays stable when markets are added or removed and scales the regional price structure proportionally.</small></label>
          <label>Peak market share <b>{referenceShare.toFixed(0)}%</b><input type="range" min={1} max={100} step={1} value={Math.round(referenceShare)} onChange={(event) => scaleCommercialPortfolio('peakSharePct', +event.target.value)} /><small>Core-market reference penetration. Regional and country-specific overrides remain available below.</small></label>
          <label>Discount rate <b>{scenario.financial.discountRatePct.toFixed(2)}%</b><input type="range" min={5} max={20} step={0.25} value={scenario.financial.discountRatePct} onChange={(event) => updateFinancial('discountRatePct', +event.target.value)} /></label>
          <label>Additional risk sensitivity <b>{scenario.financial.riskAdjustmentPct.toFixed(0)}%</b><input type="range" min={20} max={100} step={1} value={scenario.financial.riskAdjustmentPct} onChange={(event) => updateFinancial('riskAdjustmentPct', +event.target.value)} /></label>
          <label>Corporate tax <b>{scenario.financial.corporateTaxPct.toFixed(0)}%</b><input type="range" min={0} max={35} step={1} value={scenario.financial.corporateTaxPct} onChange={(event) => updateFinancial('corporateTaxPct', +event.target.value)} /></label>
        </div>
      </section>

      <section className="cv-market-grid">
        <div className="panel globe-large-panel cv-globe-panel">
          <div className="panel-heading"><div><span className="section-kicker">Market footprint · {mapYear}</span><h3>Global commercial opportunity</h3></div></div>
          <div className="map-region-legend cv-region-legend">
            {REGION_ORDER.map((region) => <span key={region}><i style={{ background: REGION_COLORS[region] }} />{region}</span>)}
          </div>
          <CountryGlobe countries={Object.values(scenario.countries)} selectedCountryId={null} onSelectCountry={toggleCountry} />
          <label className="year-slider cv-year-slider">Model year <b>{mapYear}</b><input type="range" min={scenario.startYear} max={scenario.endYear} value={mapYear} onChange={(event) => setMapYear(+event.target.value)} /></label>
          <p className="model-note">Dark grey markets are available but off. Tap a grey market to add it; tap a coloured market to remove it. Drag to rotate.</p>
        </div>

        <aside className="panel cv-market-summary">
          <span className="section-kicker">Selected footprint</span><h3>{mapYear} snapshot</h3>
          <div className="global-summary-grid cv-summary-grid">
            <div><span>Population represented</span><strong>{formatPopulation(representedPopulation)}</strong></div>
            <div><span>Surgically eligible</span><strong>{Math.round(yearResult?.eligiblePatients ?? 0).toLocaleString()}</strong></div>
            <div><span>Treated patients</span><strong>{Math.round(yearResult?.treatedPatients ?? 0).toLocaleString()}</strong></div>
            <div><span>Revenue</span><strong>{formatUsd(yearResult?.grossRevenueUsd ?? 0)}</strong></div>
          </div>
        </aside>
      </section>

      <details className="panel cv-advanced-panel">
        <summary>Advanced assumptions</summary>
        <div className="cv-advanced-content">
          <section>
            <div className="advanced-section-heading"><span>Regional treatment price & peak share</span><small>Pre-set a region before switching its countries on, or fine-tune an active region after selection.</small></div>
            <div className="commercial-region-grid">
              {regionCards.map((card) => (
                <article className="commercial-region-card" key={card.region}>
                  <div className="region-card-heading"><div><span>{card.region}</span><strong>{card.activeCount}/{card.countries.length} active</strong></div><small>{card.activeCount ? `${formatUsd(card.peakRevenue)} peak revenue` : 'Not in current footprint'}</small></div>
                  <label>Region treatment price <b>{formatUsd(card.price)}</b><input type="range" min={5_000} max={150_000} step={5_000} value={Math.round(card.price / 5000) * 5000} onChange={(event) => updateRegion(card.region, 'priceUsd', +event.target.value)} /></label>
                  <label>Region peak share <b>{card.share.toFixed(0)}%</b><input type="range" min={1} max={100} step={1} value={Math.round(card.share)} onChange={(event) => updateRegion(card.region, 'peakSharePct', +event.target.value)} /></label>
                </article>
              ))}
            </div>
          </section>

          <section className="cv-economics-grid">
            <div className="controls-panel">
              <div className="advanced-section-heading"><span>Portfolio economics</span><small>Lower-frequency assumptions</small></div>
              <div className="global-control">
                <label>COGS / treatment <b>{formatUsd(scenario.financial.cogsPerTreatmentUsd)}</b><input type="range" min={100} max={10_000} step={100} value={scenario.financial.cogsPerTreatmentUsd} onChange={(event) => updateFinancial('cogsPerTreatmentUsd', +event.target.value)} /></label>
                <label>Commercial OpEx <b>{scenario.financial.commercialOpexPct.toFixed(1)}%</b><input type="range" min={0} max={30} step={0.5} value={scenario.financial.commercialOpexPct} onChange={(event) => updateFinancial('commercialOpexPct', +event.target.value)} /></label>
                <label>Post-LoE erosion <b>{scenario.erosionPct.toFixed(0)}%</b><input type="range" min={0} max={60} step={1} value={scenario.erosionPct} onChange={(event) => setScenario((current) => ({ ...current, erosionPct: +event.target.value }))} /></label>
                <label>Patent extension <b>+{scenario.patentExtensionYears} years</b><input type="range" min={0} max={10} step={1} value={scenario.patentExtensionYears} onChange={(event) => setScenario((current) => ({ ...current, patentExtensionYears: +event.target.value }))} /></label>
              </div>
            </div>
            <div className="controls-panel cv-country-detail-list">
              <div className="advanced-section-heading"><span>Country overrides</span><small>Only active markets are shown</small></div>
              {activeCountries.map((country) => (
                <details className="cv-country-row" key={country.id}>
                  <summary><span>{country.name}</span><small>{country.region}{country.assumptionStatus === 'proxy' ? ' · proxy' : ''}</small></summary>
                  <div>
                    <label>Price <b>{formatUsd(country.priceUsd)}</b><input type="range" min={5_000} max={150_000} step={5_000} value={country.priceUsd} onChange={(event) => updateCountry(country.id, 'priceUsd', +event.target.value)} /></label>
                    <label>Peak share <b>{country.peakSharePct}%</b><input type="range" min={1} max={100} step={1} value={country.peakSharePct} onChange={(event) => updateCountry(country.id, 'peakSharePct', +event.target.value)} /></label>
                  </div>
                </details>
              ))}
            </div>
          </section>
        </div>
      </details>

      <p className="model-note cv-regulatory-note">Core US/Europe GBM launch is modeled for November 2031, after Phase II ends on 31 August 2031. The first two commercial months are prorated in the 2031 annual forecast. Orphan designation does not itself authorize sale; the model assumes a successful applicable accelerated/conditional regulatory pathway.</p>
    </div>
  );
}
