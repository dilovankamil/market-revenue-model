import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { CountryGlobe } from './CountryGlobe';
import { cloneScenario } from '../model/assumptions';
import { MARKET_GROUPS } from '../model/marketGroups';
import { REGION_COLORS, REGION_ORDER } from '../model/marketRegions';
import type { CountryId, ModelResult, Scenario } from '../model/types';

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
const formatPopulation = (value: number) => value >= 1_000_000_000 ? `${(value / 1_000_000_000).toFixed(2)}B` : `${(value / 1_000_000).toFixed(1)}M`;

export function GlobalOpportunityTab({ scenario, result, setScenario }: Props) {
  const [selectedCountryId, setSelectedCountryId] = useState<CountryId>('USA');
  const [mapYear, setMapYear] = useState(scenario.startYear);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setMapYear((current) => {
        if (current >= scenario.endYear) { setIsPlaying(false); return scenario.endYear; }
        return current + 1;
      });
    }, 950);
    return () => window.clearInterval(timer);
  }, [isPlaying, scenario.endYear]);

  useEffect(() => { setMapYear((current) => Math.min(Math.max(current, scenario.startYear), scenario.endYear)); }, [scenario.startYear, scenario.endYear]);

  const currentYearResult = result.years.find((row) => row.year === mapYear);
  const currentCountryRows = result.countryYears.filter((row) => row.year === mapYear);
  const cumulativeRevenue = result.years.filter((row) => row.year <= mapYear).reduce((sum, row) => sum + row.grossRevenueUsd, 0);
  const cumulativePatients = result.years.filter((row) => row.year <= mapYear).reduce((sum, row) => sum + row.treatedPatients, 0);
  const enabledPopulation = currentCountryRows.reduce((sum, row) => sum + row.population, 0);

  const mapMetricByCountry = useMemo(() => {
    const metric: Partial<Record<CountryId, number>> = {};
    Object.values(scenario.countries).forEach((country) => { metric[country.id] = 0; });
    result.countryYears.filter((row) => row.year === mapYear).forEach((row) => { metric[row.countryId] = row.grossRevenueUsd; });
    return metric;
  }, [result.countryYears, scenario.countries, mapYear]);

  const activeMarkets = Object.values(scenario.countries).filter((country) => country.enabled && (mapMetricByCountry[country.id] ?? 0) > 0);
  const enabledMarkets = Object.values(scenario.countries).filter((country) => country.enabled);

  const rolloutRows = useMemo(() => {
    const rows = new Map<number, string[]>();
    MARKET_GROUPS.forEach((group) => {
      const activeCountries = group.countryIds.map((id) => scenario.countries[id]).filter((country) => country?.enabled && country.accessRoute === 'commercial');
      const byYear = new Map<number, number>();
      activeCountries.forEach((country) => byYear.set(country.launchYearByIndication.gbm, (byYear.get(country.launchYearByIndication.gbm) ?? 0) + 1));
      byYear.forEach((count, year) => {
        const labels = rows.get(year) ?? [];
        labels.push(`${group.label}${activeCountries.length > 1 ? ` (${count})` : ''}`);
        rows.set(year, labels);
      });
    });
    return Array.from(rows.entries()).sort((a, b) => a[0] - b[0]);
  }, [scenario.countries]);

  const selectAndEnableCountry = (countryId: CountryId) => {
    setSelectedCountryId(countryId);
    setScenario((current) => {
      if (current.countries[countryId]?.enabled) return current;
      const next = cloneScenario(current);
      if (next.countries[countryId]) next.countries[countryId].enabled = true;
      return next;
    });
  };

  const togglePlay = () => {
    if (!isPlaying && mapYear >= scenario.endYear) setMapYear(scenario.startYear);
    setIsPlaying((current) => !current);
  };

  return (
    <section className="global-layout global-story-layout">
      <div className="panel globe-large-panel">
        <div className="panel-heading">
          <div><span className="section-kicker">Global rollout · {mapYear}</span><h3>Watch commercial markets come online</h3></div>
          <div className="map-key"><i className="key-commercial" /> Revenue active <i className="key-selected" /> Last selected</div>
        </div>
        <div className="map-region-legend">
          {REGION_ORDER.map((region) => <span key={region}><i style={{ background: REGION_COLORS[region] }} />{region}</span>)}
        </div>
        <CountryGlobe
          countries={Object.values(scenario.countries)}
          selectedCountryId={selectedCountryId}
          onSelectCountry={selectAndEnableCountry}
          metricByCountry={mapMetricByCountry}
          autoRotate={isPlaying}
        />
        <div className="playback-row">
          <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={togglePlay} aria-label={isPlaying ? 'Pause global rollout' : 'Play global rollout'}><span>{isPlaying ? 'Ⅱ' : '▶'}</span>{isPlaying ? 'Pause' : 'Play'}</button>
          <label className="year-slider">Model year <b>{mapYear}</b><input type="range" min={scenario.startYear} max={scenario.endYear} value={mapYear} onChange={(event) => { setIsPlaying(false); setMapYear(+event.target.value); }} /></label>
        </div>
        <p className="model-note">Tap a modeled country to add it to the active market list. Markets use the same regional colors as the revenue chart and brighten when modeled commercial revenue begins.</p>

        <div className="rollout-schedule">
          <div className="rollout-schedule-heading"><span>GBM commercial rollout</span><small>Cross-check of animation timing</small></div>
          <div className="rollout-schedule-grid">
            {rolloutRows.map(([year, labels]) => <div className="rollout-year" key={year}><strong>{year}</strong><span>{labels.join(' · ')}</span></div>)}
          </div>
        </div>
      </div>

      <aside className="global-story-aside">
        <section className="panel cumulative-income-card">
          <span className="section-kicker">Through {mapYear}</span><h3>Cumulative revenue</h3>
          <strong className="cumulative-income-number">{formatUsd(cumulativeRevenue)}</strong>
          <div className="cumulative-progress"><i style={{ width: `${Math.max(0, Math.min(100, (mapYear - scenario.startYear) / Math.max(1, scenario.endYear - scenario.startYear) * 100))}%` }} /></div>
          <div className="story-metrics">
            <div><span>Revenue in {mapYear}</span><b>{formatUsd(currentYearResult?.grossRevenueUsd ?? 0)}</b></div>
            <div><span>Revenue-active markets</span><b>{activeMarkets.length}</b></div>
            <div><span>Treated in {mapYear}</span><b>{Math.round(currentYearResult?.treatedPatients ?? 0).toLocaleString()}</b></div>
            <div><span>Cumulative treated</span><b>{Math.round(cumulativePatients).toLocaleString()}</b></div>
          </div>
        </section>

        <section className="panel global-summary-card">
          <span className="section-kicker">Global market</span><h3>Selected footprint in {mapYear}</h3>
          <div className="global-summary-grid">
            <div><span>Markets in model</span><strong>{enabledMarkets.length}</strong></div>
            <div><span>Population represented</span><strong>{formatPopulation(enabledPopulation)}</strong></div>
            <div><span>Surgically eligible patients</span><strong>{Math.round(currentYearResult?.eligiblePatients ?? 0).toLocaleString()}</strong></div>
            <div><span>Treated patients</span><strong>{Math.round(currentYearResult?.treatedPatients ?? 0).toLocaleString()}</strong></div>
            <div><span>Commercial revenue</span><strong>{formatUsd(currentYearResult?.grossRevenueUsd ?? 0)}</strong></div>
            <div><span>Peak treated in model</span><strong>{Math.round(result.peakTreatedPatients).toLocaleString()}</strong></div>
          </div>
          <p className="model-note">Eligible patients and treated patients are intentionally separate: treated volume reflects the selected peak-share and adoption assumptions rather than the full surgical opportunity.</p>
        </section>
      </aside>
    </section>
  );
}
