import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { CountryGlobe, type GlobeCountrySelection } from './CountryGlobe';
import { cloneScenario } from '../model/assumptions';
import { createProxyMarket, type ProxyMarketOptions } from '../model/proxyMarket';
import { subnationalDatasets } from '../model/subnational';
import type { CountryAssumption, CountryId, ModelResult, RegionId, Scenario } from '../model/types';
import { fetchExternalCountryProfile, type ExternalCountryProfile } from '../model/worldBank';

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

const accessLabel = (route: CountryAssumption['accessRoute']) => ({
  commercial: 'Commercial',
  'named-patient': 'Named-patient',
  'clinical-trial': 'Clinical trial',
  none: 'Not available',
}[route]);

const erosionFactor = (scenario: Scenario, country: CountryAssumption, year: number) => {
  const loe = country.loeYear + scenario.patentExtensionYears;
  return year <= loe ? 1 : Math.pow(1 - scenario.erosionPct / 100, year - loe);
};

export function GlobalOpportunityTab({ scenario, result, setScenario }: Props) {
  const [selectedCountryId, setSelectedCountryId] = useState<CountryId>('USA');
  const [mapYear, setMapYear] = useState(2035);
  const [externalProfile, setExternalProfile] = useState<ExternalCountryProfile | null>(null);
  const [externalName, setExternalName] = useState<string | null>(null);
  const [loadingExternal, setLoadingExternal] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [proxy, setProxy] = useState<ProxyMarketOptions>({
    region: 'Europe',
    priceUsd: 50_000,
    peakSharePct: 20,
    accessiblePopulationPct: 75,
    launchYear: 2032,
    loeYear: 2040,
  });

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

  const subnational = selectedCountryId === 'IND' || selectedCountryId === 'CHN'
    ? subnationalDatasets[selectedCountryId]
    : null;

  const subnationalRows = useMemo(() => {
    if (!subnational || !selectedCountry) return [];
    const incidence = scenario.indications.gbm.incidencePer100kByRegion[selectedCountry.region];
    const launch = selectedCountry.launchYearByIndication.gbm;
    const ramp = scenario.indications.gbm.defaultRampYears;
    const share = selectedCountry.accessRoute === 'commercial' && mapYear >= launch
      ? (selectedCountry.peakSharePct / 100) * Math.min(1, (mapYear - launch + 1) / ramp)
      : 0;

    return subnational.regions.map((region) => {
      const population = region.populationBase * Math.pow(
        1 + selectedCountry.populationGrowthPct / 100,
        mapYear - region.populationBaseYear,
      );
      const eligible = population * incidence / 100_000
        * (selectedCountry.accessiblePopulationPct / 100)
        * selectedCountry.surgeryEligibility.gbm;
      const treated = eligible * share;
      const revenue = treated * selectedCountry.priceUsd * erosionFactor(scenario, selectedCountry, mapYear);
      return { ...region, population, eligible, treated, revenue };
    });
  }, [subnational, selectedCountry, scenario, mapYear]);

  const maxSubnationalEligible = Math.max(1, ...subnationalRows.map((row) => row.eligible));

  const inspectCountry = async (selection: GlobeCountrySelection) => {
    if (selection.configured) {
      setSelectedCountryId(selection.id);
      setExternalProfile(null);
      setExternalName(null);
      setExternalError(null);
      return;
    }

    setExternalName(selection.name);
    setExternalProfile(null);
    setExternalError(null);
    setLoadingExternal(true);
    try {
      setExternalProfile(await fetchExternalCountryProfile(selection.id, selection.name));
    } catch (error) {
      setExternalError(error instanceof Error ? error.message : 'Could not load population data.');
    } finally {
      setLoadingExternal(false);
    }
  };

  const addProxyMarket = () => {
    if (!externalProfile) return;
    const market = createProxyMarket(externalProfile, proxy);
    setScenario((current) => {
      const next = cloneScenario(current);
      next.countries[market.id] = market;
      return next;
    });
    setSelectedCountryId(market.id);
    setExternalProfile(null);
    setExternalName(null);
  };

  const removeProxyMarket = () => {
    if (!selectedCountry || selectedCountry.assumptionStatus !== 'proxy') return;
    const fallback = Object.values(scenario.countries).find(
      (country) => country.id !== selectedCountry.id && country.assumptionStatus !== 'proxy',
    )?.id ?? Object.keys(scenario.countries).find((id) => id !== selectedCountry.id) ?? 'USA';

    setScenario((current) => {
      const next = cloneScenario(current);
      delete next.countries[selectedCountry.id];
      return next;
    });
    setSelectedCountryId(fallback);
  };

  return (
    <>
      <section className="global-layout">
        <div className="panel globe-large-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">Year {mapYear}</span><h3>Global patient opportunity</h3></div>
            <div className="map-key"><i className="key-commercial" /> Configured <i className="key-access" /> Named-patient</div>
          </div>
          <CountryGlobe
            countries={Object.values(scenario.countries)}
            selectedCountryId={selectedCountryId}
            onSelectCountry={setSelectedCountryId}
            onInspectCountry={inspectCountry}
            metricByCountry={mapMetricByCountry}
          />
          <label className="year-slider">Model year <b>{mapYear}</b>
            <input type="range" min={scenario.startYear} max={scenario.endYear} value={mapYear} onChange={(event) => setMapYear(+event.target.value)} />
          </label>
          <p className="model-note">Click any country. Preconfigured markets show model outputs; other countries load population from the World Bank and stay outside the financial model until explicitly added.</p>
        </div>

        <aside className="panel country-detail">
          {externalName ? (
            <>
              <span className="section-kicker">Unconfigured country</span><h3>{externalName}</h3>
              {loadingExternal && <p className="model-note">Loading World Bank population…</p>}
              {externalError && <p className="model-note warning">{externalError}</p>}
              {externalProfile && (
                <>
                  <div className="country-stat"><span>Population</span><strong>{formatPopulation(externalProfile.population)}</strong></div>
                  <div className="country-stat"><span>Population year</span><strong>{externalProfile.populationYear}</strong></div>
                  <div className="country-stat"><span>Source</span><strong>World Bank</strong></div>
                  <div className="proxy-market-box">
                    <span className="section-kicker">Add with explicit proxy assumptions</span>
                    <label className="select-label">Epidemiology proxy
                      <select value={proxy.region} onChange={(event) => setProxy((current) => ({ ...current, region: event.target.value as RegionId }))}>
                        <option value="North America">North America</option>
                        <option value="Europe">Europe</option>
                        <option value="Asia-Pacific">Asia-Pacific</option>
                      </select>
                    </label>
                    <label>Price <b>{formatUsd(proxy.priceUsd)}</b><input type="range" min="5000" max="150000" step="5000" value={proxy.priceUsd} onChange={(event) => setProxy((current) => ({ ...current, priceUsd: +event.target.value }))} /></label>
                    <label>Peak share <b>{proxy.peakSharePct}%</b><input type="range" min="1" max="60" value={proxy.peakSharePct} onChange={(event) => setProxy((current) => ({ ...current, peakSharePct: +event.target.value }))} /></label>
                    <label>Accessible population <b>{proxy.accessiblePopulationPct}%</b><input type="range" min="1" max="100" value={proxy.accessiblePopulationPct} onChange={(event) => setProxy((current) => ({ ...current, accessiblePopulationPct: +event.target.value }))} /></label>
                    <div className="proxy-year-grid">
                      <label>GBM launch<input type="number" value={proxy.launchYear} onChange={(event) => setProxy((current) => ({ ...current, launchYear: +event.target.value }))} /></label>
                      <label>LoE<input type="number" value={proxy.loeYear} onChange={(event) => setProxy((current) => ({ ...current, loeYear: +event.target.value }))} /></label>
                    </div>
                    <button className="primary-button" onClick={addProxyMarket}>Add proxy market</button>
                    <p className="model-note warning">Only population is externally retrieved. Epidemiology, surgical eligibility, price, launch, access and LoE remain proxy assumptions until validated for this country.</p>
                  </div>
                </>
              )}
            </>
          ) : selectedCountry ? (
            <>
              <div className="country-detail-heading">
                <div><span className="section-kicker">Selected market</span><h3>{selectedCountry.name}</h3></div>
                {selectedCountry.assumptionStatus === 'proxy' && <button className="danger-button" onClick={removeProxyMarket}>Remove proxy</button>}
              </div>
              {selectedCountry.assumptionStatus === 'proxy' && <span className="privacy-chip">PROXY MARKET</span>}
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
              {selectedCountry.assumptionNote && <p className="model-note warning">{selectedCountry.assumptionNote}</p>}
            </>
          ) : null}
        </aside>
      </section>

      {subnational && selectedCountry && (
        <section className="panel subnational-panel">
          <div className="panel-heading">
            <div><span className="section-kicker">Subnational decomposition · {mapYear}</span><h3>{subnational.title}</h3></div>
            <span className="privacy-chip">NOT ADDITIVE TO NATIONAL TOTAL</span>
          </div>
          <p className="model-note">{subnational.coverageNote}</p>
          <div className="subnational-list">
            {subnationalRows.map((row) => (
              <article className="subnational-row" key={row.id}>
                <div className="subnational-name"><strong>{row.name}</strong><small>{formatPopulation(row.population)}</small></div>
                <div className="subnational-bar"><i style={{ width: `${Math.max(2, row.eligible / maxSubnationalEligible * 100)}%` }} /></div>
                <div><span>Eligible GBM</span><b>{Math.round(row.eligible).toLocaleString()}</b></div>
                <div><span>{selectedCountry.accessRoute === 'commercial' ? 'Modelled treated' : 'Population-based treated'}</span><b>{selectedCountry.accessRoute === 'commercial' ? Math.round(row.treated).toLocaleString() : '—'}</b></div>
                <div><span>{selectedCountry.accessRoute === 'commercial' ? 'Revenue' : 'Access model'}</span><b>{selectedCountry.accessRoute === 'commercial' ? formatUsd(row.revenue) : 'Centre-based'}</b></div>
                <a href={row.sourceUrl} target="_blank" rel="noreferrer">Source</a>
              </article>
            ))}
          </div>
          {selectedCountry.accessRoute !== 'commercial' && <p className="model-note warning">For named-patient/early access, the national financial model remains centre-based. Subnational population opportunity is shown for planning only and is not converted into revenue here.</p>}
        </section>
      )}
    </>
  );
}
