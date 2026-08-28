import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { CountryGlobe } from './CountryGlobe';
import { cloneScenario } from '../model/assumptions';
import { EU27_IDS, MARKET_GROUPS } from '../model/marketGroups';
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

const formatPopulation = (value: number) => value >= 1_000_000_000
  ? `${(value / 1_000_000_000).toFixed(2)}B`
  : `${(value / 1_000_000).toFixed(1)}M`;

export function GlobalOpportunityTab({ scenario, result, setScenario }: Props) {
  const [selectedCountryId, setSelectedCountryId] = useState<CountryId>('USA');
  const [mapYear, setMapYear] = useState(scenario.startYear);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setMapYear((current) => {
        if (current >= scenario.endYear) {
          setIsPlaying(false);
          return scenario.endYear;
        }
        return current + 1;
      });
    }, 950);
    return () => window.clearInterval(timer);
  }, [isPlaying, scenario.endYear]);

  useEffect(() => {
    setMapYear((current) => Math.min(Math.max(current, scenario.startYear), scenario.endYear));
  }, [scenario.startYear, scenario.endYear]);

  const selectedCountry = scenario.countries[selectedCountryId];
  const selectedCountryYear = result.countryYears.find(
    (row) => row.countryId === selectedCountryId && row.year === mapYear,
  );
  const currentYearResult = result.years.find((row) => row.year === mapYear);
  const cumulativeRevenue = result.years
    .filter((row) => row.year <= mapYear)
    .reduce((sum, row) => sum + row.grossRevenueUsd, 0);
  const cumulativePatients = result.years
    .filter((row) => row.year <= mapYear)
    .reduce((sum, row) => sum + row.treatedPatients, 0);

  const mapMetricByCountry = useMemo(() => {
    const metric: Partial<Record<CountryId, number>> = {};
    Object.values(scenario.countries).forEach((country) => { metric[country.id] = 0; });
    result.countryYears
      .filter((row) => row.year === mapYear)
      .forEach((row) => { metric[row.countryId] = row.grossRevenueUsd; });
    return metric;
  }, [result.countryYears, scenario.countries, mapYear]);

  const activeMarkets = Object.values(scenario.countries).filter(
    (country) => country.enabled && (mapMetricByCountry[country.id] ?? 0) > 0,
  );

  const rolloutRows = useMemo(() => {
    const rows = new Map<number, string[]>();
    MARKET_GROUPS.forEach((group) => {
      const activeCountries = group.countryIds
        .map((id) => scenario.countries[id])
        .filter((country) => country?.enabled && country.accessRoute === 'commercial');
      if (!activeCountries.length) return;

      if (group.id === 'eu27') {
        const years = new Set(activeCountries.map((country) => country.launchYearByIndication.gbm));
        years.forEach((year) => {
          const labels = rows.get(year) ?? [];
          labels.push(`European Union (${activeCountries.length}/${EU27_IDS.length})`);
          rows.set(year, labels);
        });
        return;
      }

      activeCountries.forEach((country) => {
        const year = country.launchYearByIndication.gbm;
        const labels = rows.get(year) ?? [];
        labels.push(country.name);
        rows.set(year, labels);
      });
    });
    return Array.from(rows.entries()).sort((a, b) => a[0] - b[0]);
  }, [scenario.countries]);

  const toggleCountry = (countryId: CountryId, enabled: boolean) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      if (next.countries[countryId]) next.countries[countryId].enabled = enabled;
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
          <div className="map-key"><i className="key-commercial" /> Revenue active <i className="key-selected" /> Selected market</div>
        </div>
        <CountryGlobe
          countries={Object.values(scenario.countries)}
          selectedCountryId={selectedCountryId}
          onSelectCountry={setSelectedCountryId}
          onInspectCountry={(selection) => { if (selection.configured) setSelectedCountryId(selection.id); }}
          metricByCountry={mapMetricByCountry}
          autoRotate={isPlaying}
        />
        <div className="playback-row">
          <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={togglePlay} aria-label={isPlaying ? 'Pause global rollout' : 'Play global rollout'}>
            <span>{isPlaying ? 'Ⅱ' : '▶'}</span>{isPlaying ? 'Pause' : 'Play'}
          </button>
          <label className="year-slider">Model year <b>{mapYear}</b>
            <input type="range" min={scenario.startYear} max={scenario.endYear} value={mapYear} onChange={(event) => { setIsPlaying(false); setMapYear(+event.target.value); }} />
          </label>
        </div>
        <p className="model-note">Markets brighten only when modeled commercial revenue begins, so the globe follows the same launch-year logic as the revenue engine.</p>

        <div className="rollout-schedule">
          <div className="rollout-schedule-heading"><span>Base GBM rollout</span><small>Visible cross-check of animation timing</small></div>
          <div className="rollout-schedule-grid">
            {rolloutRows.map(([year, labels]) => (
              <div className="rollout-year" key={year}><strong>{year}</strong><span>{labels.join(' · ')}</span></div>
            ))}
          </div>
        </div>
      </div>

      <aside className="global-story-aside">
        <section className="panel cumulative-income-card">
          <span className="section-kicker">Through {mapYear}</span>
          <h3>Cumulative revenue</h3>
          <strong className="cumulative-income-number">{formatUsd(cumulativeRevenue)}</strong>
          <div className="cumulative-progress"><i style={{ width: `${Math.max(0, Math.min(100, (mapYear - scenario.startYear) / Math.max(1, scenario.endYear - scenario.startYear) * 100))}%` }} /></div>
          <div className="story-metrics">
            <div><span>Revenue in {mapYear}</span><b>{formatUsd(currentYearResult?.grossRevenueUsd ?? 0)}</b></div>
            <div><span>Revenue-active markets</span><b>{activeMarkets.length}</b></div>
            <div><span>Treated in {mapYear}</span><b>{Math.round(currentYearResult?.treatedPatients ?? 0).toLocaleString()}</b></div>
            <div><span>Cumulative treated</span><b>{Math.round(cumulativePatients).toLocaleString()}</b></div>
          </div>
        </section>

        <section className="panel country-detail compact-country-detail">
          {selectedCountry ? (
            <>
              <div className="country-detail-heading">
                <div><span className="section-kicker">Selected market</span><h3>{selectedCountry.name}</h3></div>
                <label className="switch-label"><input type="checkbox" checked={selectedCountry.enabled} onChange={(event) => toggleCountry(selectedCountry.id, event.target.checked)} /> In model</label>
              </div>
              {selectedCountry.assumptionStatus === 'proxy' && <span className="privacy-chip">PLANNING PROXY</span>}
              <div className="country-stat"><span>Population</span><strong>{formatPopulation(selectedCountryYear?.population ?? selectedCountry.populationBase)}</strong></div>
              <div className="country-stat"><span>GBM launch</span><strong>{selectedCountry.launchYearByIndication.gbm}</strong></div>
              <div className="country-stat"><span>Eligible cases</span><strong>{Math.round(selectedCountryYear?.eligiblePatients ?? 0).toLocaleString()}</strong></div>
              <div className="country-stat"><span>Treated patients</span><strong>{Math.round(selectedCountryYear?.treatedPatients ?? 0).toLocaleString()}</strong></div>
              <div className="country-stat"><span>Revenue</span><strong>{formatUsd(selectedCountryYear?.grossRevenueUsd ?? 0)}</strong></div>
              <div className="patient-funnel">
                <div><span>Population accessible</span><b>{selectedCountry.accessiblePopulationPct}%</b></div>
                <div><span>GBM incidence /100k</span><b>{scenario.indications.gbm.incidencePer100kByRegion[selectedCountry.region].toFixed(2)}</b></div>
                <div><span>Surgery eligible</span><b>{(selectedCountry.surgeryEligibility.gbm * 100).toFixed(1)}%</b></div>
                <div><span>Peak share</span><b>{selectedCountry.peakSharePct}%</b></div>
              </div>
              {selectedCountry.assumptionNote && <p className="model-note warning">{selectedCountry.assumptionNote}</p>}
            </>
          ) : <p className="model-note">Select a configured market on the globe.</p>}
        </section>
      </aside>
    </section>
  );
}
