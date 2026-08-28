import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { cloneScenario } from '../model/assumptions';
import { MARKET_GROUPS } from '../model/marketGroups';
import type { CountryId, Scenario } from '../model/types';

interface Props {
  scenario: Scenario;
  setScenario: Dispatch<SetStateAction<Scenario>>;
}

function GroupCheckbox({ checked, mixed, onChange, label }: { checked: boolean; mixed: boolean; onChange: (checked: boolean) => void; label: string }) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = mixed; }, [mixed]);
  return <input ref={ref} type="checkbox" checked={checked} aria-label={label} onChange={(event) => onChange(event.target.checked)} />;
}

export function MarketSelector({ scenario, setScenario }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'north-america': false,
    eu27: false,
    uk: false,
    'asia-pacific': false,
  });

  const setCountriesEnabled = (ids: CountryId[], enabled: boolean) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      ids.forEach((id) => { if (next.countries[id]) next.countries[id].enabled = enabled; });
      return next;
    });
  };

  const setCountryEnabled = (id: CountryId, enabled: boolean) => {
    setScenario((current) => {
      const next = cloneScenario(current);
      if (next.countries[id]) next.countries[id].enabled = enabled;
      return next;
    });
  };

  return (
    <div className="sidebar-section market-group-section">
      <div className="section-kicker">Markets</div>
      <div className="market-group-list">
        {MARKET_GROUPS.map((group) => {
          const countries = group.countryIds.map((id) => scenario.countries[id]).filter(Boolean);
          const enabledCount = countries.filter((country) => country.enabled).length;
          const allEnabled = countries.length > 0 && enabledCount === countries.length;
          const mixed = enabledCount > 0 && !allEnabled;
          const isExpanded = expanded[group.id] ?? false;
          return (
            <div className={`market-group ${isExpanded ? 'expanded' : ''}`} key={group.id}>
              <div className="market-group-row">
                <GroupCheckbox
                  checked={allEnabled}
                  mixed={mixed}
                  label={`${allEnabled ? 'Disable' : 'Enable'} ${group.label}`}
                  onChange={(checked) => setCountriesEnabled(group.countryIds, checked)}
                />
                <button className="market-group-expand" type="button" onClick={() => setExpanded((current) => ({ ...current, [group.id]: !isExpanded }))} aria-expanded={isExpanded}>
                  <span>{group.label}</span>
                  <small>{enabledCount}/{countries.length}</small>
                  <b>{isExpanded ? '▾' : '›'}</b>
                </button>
              </div>
              {isExpanded && (
                <div className="market-group-children">
                  {countries.map((country) => (
                    <label className="toggle-row market-child-row" key={country.id} title={country.assumptionNote}>
                      <input type="checkbox" checked={country.enabled} onChange={(event) => setCountryEnabled(country.id, event.target.checked)} />
                      <span>{country.name}{country.assumptionStatus === 'proxy' ? ' *' : ''}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <small className="market-selector-note">* planning proxy; country-specific commercial assumptions require validation.</small>
    </div>
  );
}
