import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { CountryAssumption, CountryId } from '../model/types';

const WORLD_GEOJSON = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';
const GLOBE_STYLE = 'https://demotiles.maplibre.org/globe.json';

const enabledColor = '#4fd1c5';
const inactiveColor = '#263341';
const namedPatientColor = '#f5b942';

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

const metricColor = (value: number, max: number) => {
  if (value <= 0 || max <= 0) return enabledColor;
  const fraction = Math.min(1, Math.sqrt(value / max));
  const lightness = 30 + fraction * 34;
  return `hsl(174 62% ${lightness}%)`;
};

const featureIdExpression = ['to-string', ['id']];

const fillExpression = (
  countries: CountryAssumption[],
  metricByCountry: Partial<Record<CountryId, number>> = {},
) => {
  const maxMetric = Math.max(0, ...countries.map((country) => metricByCountry[country.id] ?? 0));
  const expression: unknown[] = ['match', featureIdExpression];
  countries.forEach((country) => {
    const hasTemporalMetric = Object.prototype.hasOwnProperty.call(metricByCountry, country.id);
    const metric = metricByCountry[country.id] ?? 0;
    const active = country.enabled && (!hasTemporalMetric || metric > 0);
    expression.push(
      country.id,
      !active
        ? inactiveColor
        : country.accessRoute === 'named-patient'
          ? namedPatientColor
          : metricColor(metric, maxMetric),
    );
  });
  expression.push('#172431');
  return expression;
};

export function CountryGlobe({
  countries,
  selectedCountryId,
  onSelectCountry,
  onInspectCountry,
  metricByCountry = {},
  autoRotate = false,
}: CountryGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const countriesRef = useRef(countries);
  const metricRef = useRef(metricByCountry);
  const onSelectRef = useRef(onSelectCountry);
  const onInspectRef = useRef(onInspectCountry);
  const autoRotateRef = useRef(autoRotate);

  useEffect(() => { countriesRef.current = countries; }, [countries]);
  useEffect(() => { metricRef.current = metricByCountry; }, [metricByCountry]);
  useEffect(() => { onSelectRef.current = onSelectCountry; }, [onSelectCountry]);
  useEffect(() => { onInspectRef.current = onInspectCountry; }, [onInspectCountry]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: GLOBE_STYLE,
      center: [12, 18],
      zoom: 0.95,
      minZoom: 0.55,
      maxZoom: 7,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('style.load', () => {
      map.setProjection({ type: 'globe' });
      map.setSky({
        'sky-color': '#020912',
        'sky-horizon-blend': 0.28,
        'horizon-color': '#15344a',
        'horizon-fog-blend': 0.22,
        'fog-color': '#0d2232',
        'fog-ground-blend': 0.08,
      });
    });

    map.on('load', () => {
      map.addSource('si053-countries-source', { type: 'geojson', data: WORLD_GEOJSON });
      map.addLayer({
        id: 'si053-countries',
        type: 'fill',
        source: 'si053-countries-source',
        paint: {
          'fill-color': fillExpression(countriesRef.current, metricRef.current) as never,
          'fill-opacity': 0.72,
          'fill-color-transition': { duration: 700, delay: 0 },
          'fill-opacity-transition': { duration: 500, delay: 0 },
        },
      });
      map.addLayer({
        id: 'si053-country-lines',
        type: 'line',
        source: 'si053-countries-source',
        paint: {
          'line-color': '#9ab0c2',
          'line-opacity': 0.42,
          'line-width': 0.55,
          'line-color-transition': { duration: 400, delay: 0 },
          'line-width-transition': { duration: 400, delay: 0 },
        },
      });

      map.on('mousemove', 'si053-countries', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'si053-countries', () => { map.getCanvas().style.cursor = ''; });
      map.on('click', 'si053-countries', (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const name = feature?.properties?.name as string | undefined;
        const id = typeof feature?.id === 'string' ? feature.id : String(feature?.id ?? '');
        if (!name || !id) return;

        const match = countriesRef.current.find((country) => country.id === id || country.geoName === name);
        if (match) {
          onSelectRef.current(match.id);
          onInspectRef.current?.({ id: match.id, name: match.name, configured: true });
        } else {
          onInspectRef.current?.({ id, name, configured: false });
        }
      });
    });

    let frame = 0;
    let previous = performance.now();
    const rotate = (now: number) => {
      const deltaSeconds = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      if (autoRotateRef.current && !map.isMoving()) {
        const center = map.getCenter();
        map.setCenter([center.lng + deltaSeconds * 3.2, center.lat]);
      }
      frame = requestAnimationFrame(rotate);
    };
    frame = requestAnimationFrame(rotate);

    mapRef.current = map;
    return () => {
      cancelAnimationFrame(frame);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer('si053-countries')) return;
    map.setPaintProperty('si053-countries', 'fill-color', fillExpression(countries, metricByCountry) as never);
  }, [countries, metricByCountry]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer('si053-country-lines')) return;
    const selected = selectedCountryId
      ? ['case', ['==', featureIdExpression, selectedCountryId], '#ffffff', '#9ab0c2']
      : '#9ab0c2';
    const width = selectedCountryId
      ? ['case', ['==', featureIdExpression, selectedCountryId], 2.3, 0.55]
      : 0.55;
    map.setPaintProperty('si053-country-lines', 'line-color', selected as never);
    map.setPaintProperty('si053-country-lines', 'line-width', width as never);
  }, [selectedCountryId]);

  return <div ref={containerRef} className="country-globe" aria-label="Interactive SI-053 global opportunity globe" />;
}
