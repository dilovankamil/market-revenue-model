import { useEffect, useState, type ComponentType } from 'react';
import type { CountryAssumption, CountryId } from '../model/types';

export interface GlobeCountrySelection {
  id: string;
  name: string;
  configured: boolean;
}

interface CountryGlobeProps {
  countries: CountryAssumption[];
  selectedCountryId: CountryId | null;
  onSelectCountry: (countryId: CountryId) => void;
  onInspectCountry?: (selection: GlobeCountrySelection) => void;
  metricByCountry?: Partial<Record<CountryId, number>>;
  autoRotate?: boolean;
}

type GlobeComponent = ComponentType<CountryGlobeProps>;

export function CountryGlobe(props: CountryGlobeProps) {
  const [LoadedGlobe, setLoadedGlobe] = useState<GlobeComponent | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    import('./MapLibreCountryGlobe')
      .then((module) => {
        if (active) setLoadedGlobe(() => module.CountryGlobe as GlobeComponent);
      })
      .catch((error) => {
        console.error('Could not load interactive globe module', error);
        if (active) setLoadError(true);
      });
    return () => { active = false; };
  }, []);

  if (LoadedGlobe) return <LoadedGlobe {...props} />;

  const activeCountries = props.countries.filter((country) => country.enabled);
  return (
    <div className="country-globe globe-safe-fallback" aria-label="SI-053 global market view">
      <div className="globe-fallback" role="status">
        <strong>{loadError ? 'Interactive globe unavailable' : 'Loading global opportunity…'}</strong>
        <span>{loadError ? 'The commercial model remains fully available. Select a market below.' : 'Preparing the interactive map.'}</span>
        {loadError && (
          <div className="globe-fallback-markets">
            {activeCountries.map((country) => (
              <button
                key={country.id}
                type="button"
                className={country.id === props.selectedCountryId ? 'active' : ''}
                onClick={() => {
                  props.onSelectCountry(country.id);
                  props.onInspectCountry?.({ id: country.id, name: country.name, configured: true });
                }}
              >
                {country.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
