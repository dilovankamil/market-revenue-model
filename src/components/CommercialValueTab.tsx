import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { CountryGlobe } from './CountryGlobe';
import { RevenueChart } from './RevenueChart';
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

const average = (values: number[]) => values.length
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : 0;

export function CommercialValueTab({ scenario, result, setScenario }: Props) {
  const [mapYear, setMapYear] = useState(2035);
  const [selectedCountryId, setSelectedCountryId] = useState<CountryId>('USA');

  const activeCountries = useMemo(
    () => Object.values(scenario.countries).filter((country) => country.enabled && country.accessRoute === 'commercial'),
    [scenario.countries],
  );
  const activeIds = useMemo(() => new Set(activeCountries.map((country) => country.id)), [activeCountries]);
  const averagePrice = average(activeCountries.map((country) => country.priceUsd));
  const averageShare = average(activeCountries.map((country) => country.peakSharePct));

  const scaleActiveCountries = (key: 'priceUsd' | 'peakSharePct', targetAverage: number) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      const countries = Object.values(next.countries).filter((country) => country.enabled && country.accessRoute === 'commercial');
      const currentAverage = average(countries.map((country) => country[key]));
      const ratio = currentAverage > 0 ? targetAverage / currentAverage : 1;
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
        .filter((country) => country.enabled && country.region === region && country.accessRoute === 'commercial')
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

  const selectAndEnableCountry = (countryId: CountryId) => {
    setSelectedCountryId(countryId);
    setScenario((current) => {
      if (current.countries[countryId]?.enabled) return current;
      const next = cloneScenario(current);
      if (next.countries[countryId]) next.countries[countryId].enabled = true;
      return next;
    });
  };

  const yearResult = result.years.find((row) => row.year === mapYear);
  const yearCountryRows = result.countryYears.filter((row) => row.year === mapYear && activeIds.has(row.countryId));
  const representedPopulation = yearCountryRows.reduce((sum, row) => sum + row.population, 0);

  const mapMetricByCountry = useMemo(() => {
    const metric: Partial<Record<CountryId, number>> = {};
    Object.values(scenario.countries).forEach((country) => { metric[country.id] = 0; });
    result.countryYears.filter((row) => row.year === mapYear).forEach((row) => { metric[row.countryId] = row.grossRevenueUsd; });
    return metric;
  }, [result.countryYears, scenario.countries, mapYear]);

  const regionCards = useMemo(() => REGION_ORDER.map((region) => {
    const countries = activeCountries.filter((country) => country.region === region);
    const ids = new Set(countries.map((country) => country.id));
    const peakRevenue = Math.max(0, ...result.years.map((year) => result.countryYears
      .filter((row) => row.year === year.year && ids.has(row.countryId))
      .reduce((sum, row) => sum + row.grossRevenueUsd, 0)));
    return {
      region,
      countries,
      price: average(countries.map((country) => country.priceUsd)),
      share: average(countries.map((country) => country.peakSharePct)),
      peakRevenue,
    };
  }).filter((card) => card.countries.length > 0), [activeCountries, result.countryYears, result.years]);

  return (
    <div className="commercial-value-page">
      <section className="cv-kpi-strip">
        <article><span>Active markets</span><strong>{activeCountries.length}</strong></article>
        <article><span>Peak treated patients</span><strong>{Math.round(result.peakTreatedPatients).toLocaleString()}</strong></article>
        <article><span>Peak revenue</span><strong>{formatUsd(result.peakRevenueUsd)}</strong></article>
        <article className="cv-value-kpi"><span>Stage-adjusted rNPV</span><strong>{formatUsd(result.valuation.riskAdjustedNpvUsd)}</strong></article>
      </section>

      <section className="panel cv-levers-panel">
        <div className="panel-heading">
          <div><span className="section-kicker">Core assumptions</span><h3>Commercial & valuation levers</h3></div>
          <span className="chart-context-note">Market selection is controlled from Markets & indications</span>
        </div>
        <div className="cv-lever-grid">
          <label>Treatment price <b>{formatUsd(averagePrice)}</b><input type="range" min={25_000} max={150_000} step={1_000} value={Math.round(averagePrice / 1000) * 1000} onChange={(event) => scaleActiveCountries('priceUsd', +event.target.value)} /><small>Default selected-market average is $75k; moving this scales active-country prices proportionally.</small></label>
          <label>Peak market share <b>{averageShare.toFixed(0)}%</b><input type="range" min={1} max={100} step={1} value={Math.round(averageShare)} onChange={(event) => scaleActiveCountries('peakSharePct', +event.target.value)} /><small>Portfolio penetration sensitivity; individual markets can still be overridden below.</small></label>
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
          <CountryGlobe countries={Object.values(scenario.countries)} selectedCountryId={selectedCountryId} onSelectCountry={selectAndEnableCountry} metricByCountry={mapMetricByCountry} />
          <label className="year-slider cv-year-slider">Model year <b>{mapYear}</b><input type="range" min={scenario.startYear} max={scenario.endYear} value={mapYear} onChange={(event) => setMapYear(+event.target.value)} /></label>
          <p className="model-note">Tap a modeled country to add it to the active footprint. Drag the globe to rotate.</p>
        </div>

        <aside className="panel cv-market-summary">
          <div className="cv-value-block">
            <span>Current asset value</span>
            <strong>{formatUsd(result.valuation.riskAdjustedNpvUsd)}</strong>
            <small>Stage-adjusted rNPV through {scenario.endYear}; no perpetual terminal value.</small>
          </div>
          <span className="section-kicker">Selected footprint</span><h3>{mapYear} snapshot</h3>
          <div className="global-summary-grid cv-summary-grid">
            <div><span>Population represented</span><strong>{formatPopulation(representedPopulation)}</strong></div>
            <div><span>Surgically eligible</span><strong>{Math.round(yearResult?.eligiblePatients ?? 0).toLocaleString()}</strong></div>
            <div><span>Treated patients</span><strong>{Math.round(yearResult?.treatedPatients ?? 0).toLocaleString()}</strong></div>
            <div><span>Revenue</span><strong>{formatUsd(yearResult?.grossRevenueUsd ?? 0)}</strong></div>
          </div>
        </aside>
      </section>

      <section className="panel chart-panel cv-revenue-panel">
        <div className="panel-heading"><div><span className="section-kicker">Forecast</span><h3>Global gross revenue</h3></div><span className="chart-context-note">Totals above each stacked bar</span></div>
        <RevenueChart data={result.years} countryYears={result.countryYears} scenario={scenario} />
      </section>

      <details className="panel cv-advanced-panel">
        <summary>Advanced assumptions</summary>
        <div className="cv-advanced-content">
          <section>
            <div className="advanced-section-heading"><span>Regional assumptions</span><small>Fine-tune active markets without editing every country</small></div>
            <div className="commercial-region-grid">
              {regionCards.map((card) => (
                <article className="commercial-region-card" key={card.region}>
                  <div className="region-card-heading"><div><span>{card.region}</span><strong>{card.countries.length} market{card.countries.length === 1 ? '' : 's'}</strong></div><small>{formatUsd(card.peakRevenue)} peak revenue</small></div>
                  <label>Treatment price <b>{formatUsd(card.price)}</b><input type="range" min={5_000} max={150_000} step={5_000} value={Math.round(card.price / 5000) * 5000} onChange={(event) => updateRegion(card.region, 'priceUsd', +event.target.value)} /></label>
                  <label>Peak share <b>{card.share.toFixed(0)}%</b><input type="range" min={1} max={100} step={1} value={Math.round(card.share)} onChange={(event) => updateRegion(card.region, 'peakSharePct', +event.target.value)} /></label>
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
