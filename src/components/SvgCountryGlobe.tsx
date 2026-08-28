import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import * as d3 from 'd3';
import { regionColor } from '../model/marketRegions';
import type { CountryAssumption, CountryId } from '../model/types';
import type { GlobeCountrySelection } from './CountryGlobe';

interface SvgCountryGlobeProps {
  countries: CountryAssumption[];
  selectedCountryId: CountryId | null;
  onSelectCountry: (countryId: CountryId) => void;
  onInspectCountry?: (selection: GlobeCountrySelection) => void;
  metricByCountry?: Partial<Record<CountryId, number>>;
  autoRotate?: boolean;
}

type WorldFeature = { type: 'Feature'; id?: string | number; properties?: { name?: string }; geometry: unknown };
type WorldData = { type: 'FeatureCollection'; features: WorldFeature[] };

const WIDTH = 760;
const HEIGHT = 760;
const defaultCountryColor = '#172938';
const worldDataUrl = `${import.meta.env.BASE_URL}world.geojson`;

export function SvgCountryGlobe({ countries, selectedCountryId, onSelectCountry, onInspectCountry, metricByCountry = {}, autoRotate = false }: SvgCountryGlobeProps) {
  const [world, setWorld] = useState<WorldData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [rotation, setRotation] = useState<[number, number]>([-12, -12]);
  const dragRef = useRef<{ x: number; y: number; rotation: [number, number] } | null>(null);

  useEffect(() => {
    let active = true;
    fetch(worldDataUrl)
      .then((response) => { if (!response.ok) throw new Error(`World map request failed (${response.status})`); return response.json() as Promise<WorldData>; })
      .then((data) => { if (active) setWorld(data); })
      .catch((error) => { console.error('Could not load bundled world geometry', error); if (active) setLoadError(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!autoRotate || dragRef.current) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setRotation(([lon, lat]) => [lon + 0.38, lat]), 70);
    return () => window.clearInterval(timer);
  }, [autoRotate]);

  const projection = useMemo(() => d3.geoOrthographic().translate([WIDTH / 2, HEIGHT / 2]).scale(342).rotate(rotation).clipAngle(90).precision(0.35), [rotation]);
  const path = useMemo(() => d3.geoPath(projection), [projection]);
  const spherePath = path({ type: 'Sphere' } as d3.GeoPermissibleObjects) ?? '';
  const graticulePath = path(d3.geoGraticule10()) ?? '';

  const countryByFeature = (feature: WorldFeature) => {
    const id = String(feature.id ?? '');
    const name = feature.properties?.name ?? '';
    return countries.find((country) => country.id === id || country.geoName === name);
  };

  const fillForFeature = (feature: WorldFeature) => {
    const country = countryByFeature(feature);
    if (!country) return defaultCountryColor;
    const hasTemporalMetric = Object.prototype.hasOwnProperty.call(metricByCountry, country.id);
    const revenueActive = !hasTemporalMetric || (metricByCountry[country.id] ?? 0) > 0;
    return regionColor(country.region, country.enabled && revenueActive);
  };

  const selectFeature = (feature: WorldFeature) => {
    const id = String(feature.id ?? '');
    const name = feature.properties?.name ?? id;
    const country = countryByFeature(feature);
    if (country) {
      onSelectCountry(country.id);
      onInspectCountry?.({ id: country.id, name: country.name, configured: true });
      return;
    }
    if (id) onInspectCountry?.({ id, name, configured: false });
  };

  const pointerDown = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, rotation };
  };
  const pointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    setRotation([drag.rotation[0] + dx * 0.28, Math.max(-70, Math.min(70, drag.rotation[1] - dy * 0.22))]);
  };
  const pointerUp = (event: PointerEvent<SVGSVGElement>) => {
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* no-op */ }
    dragRef.current = null;
  };

  if (loadError) return <div className="country-globe globe-safe-fallback"><div className="globe-fallback" role="status"><strong>World map data unavailable</strong><span>The commercial model remains available, but the bundled country geometry could not be loaded.</span></div></div>;
  if (!world) return <div className="country-globe globe-safe-fallback"><div className="globe-fallback globe-loading" role="status"><div className="globe-loading-orb" aria-hidden="true" /><strong>Loading global opportunity…</strong></div></div>;

  return (
    <div className="country-globe svg-globe-shell" aria-label="Interactive SI-053 global opportunity globe">
      <svg className="svg-country-globe" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Rotatable world globe showing SI-053 markets" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
        <defs>
          <radialGradient id="si053-ocean" cx="38%" cy="30%" r="72%"><stop offset="0%" stopColor="#173f57" /><stop offset="56%" stopColor="#0a273a" /><stop offset="100%" stopColor="#04121f" /></radialGradient>
          <filter id="si053-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="11" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path className="globe-atmosphere" d={spherePath} />
        <path className="globe-ocean" d={spherePath} />
        <path className="globe-graticule" d={graticulePath} />
        <g className="globe-countries">
          {world.features.map((feature, index) => {
            const featurePath = path(feature as unknown as d3.GeoPermissibleObjects);
            if (!featurePath) return null;
            const country = countryByFeature(feature);
            const selected = country?.id === selectedCountryId;
            return (
              <path
                key={String(feature.id ?? feature.properties?.name ?? index)}
                d={featurePath}
                className={`globe-country ${country ? 'configured' : ''} ${selected ? 'selected' : ''}`}
                fill={fillForFeature(feature)}
                onPointerDown={country ? (event) => { event.stopPropagation(); selectFeature(feature); } : undefined}
                onClick={!country ? (event) => { event.stopPropagation(); selectFeature(feature); } : undefined}
              ><title>{country?.name ?? feature.properties?.name ?? 'Country'}</title></path>
            );
          })}
        </g>
        <path className="globe-rim" d={spherePath} />
      </svg>
      <div className="globe-drag-hint">Drag ocean to rotate · tap a market to add/select it</div>
    </div>
  );
}
