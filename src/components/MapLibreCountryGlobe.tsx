import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, MapLayerMouseEvent, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { CountryAssumption, CountryId } from '../model/types';

const WORLD_GEOJSON = `${import.meta.env.BASE_URL}world.geojson`;
const LOCAL_GLOBE_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'space-background',
      type: 'background',
      paint: { 'background-color': '#02070d' },
    },
  ],
};

const enabledColor = '#4fd1c5';
const inactiveColor = '#263341';
const namedPatientColor = '#f5b942';

export interface GlobeCountrySelection {
  id: string;
  name: string;
  configured: boolean;
}

export interface CountryGlobeProps {
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
  const [mapError, setMapError] = useState(false);

  useEffect(() => { countriesRef.current = countries; }, [countries]);
  useEffect(() => { metricRef.current = metricByCountry; }, [metricByCountry]);
  useEffect(() => { onSelectRef.current = onSelectCountry; }, [onSelectCountry]);
  useEffect(() => { onInspectRef.current = onInspectCountry; }, [onInspectCountry]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: MapLibreMap | null = null;
    let frame = 0;
    let ready = false;
    const readinessTimer = window.setTimeout(() => {
      if (!ready) setMapError(true);
    }, 8000);

    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: LOCAL_GLOBE_STYLE,
        center: [12, 18],
        zoom: 0.95,
        minZoom: 0.55,
        maxZoom: 7,
        attributionControl: false,
      });
      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

      map.on('error', (event) => {
        console.warn('MapLibre globe error', event.error);
      });

      map.on('style.load', () => {
        try {
          map?.setProjection({ type: 'globe' });
          map?.setSky({
            'sky-color': '#020912',
            'sky-horizon-blend': 0.28,
            'horizon-color': '#15344a',
            'horizon-fog-blend': 0.22,
            'fog-color': '#0d2232',
            'fog-ground-blend': 0.08,
          });
        } catch (error) {
          console.warn('Globe atmosphere styling unavailable', error);
        }
      });

      map.on('load', () => {
        if (!map) return;
        try {
          map.addSource('si053-ocean-source', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [[[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]],
              },
            },
          });
          map.addLayer({
            id: 'si053-ocean',
            type: 'fill',
            source: 'si053-ocean-source',
            paint: {
              'fill-color': '#0a2a3f',
              'fill-opacity': 1,
            },
          });

          map.addSource('si053-countries-source', { type: 'geojson', data: WORLD_GEOJSON });
          map.addLayer({
            id: 'si053-countries',
            type: 'fill',
            source: 'si053-countries-source',
            paint: {
              'fill-color': fillExpression(countriesRef.current, metricRef.current) as never,
              'fill-opacity': 0.82,
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
              'line-opacity': 0.46,
              'line-width': 0.55,
              'line-color-transition': { duration: 400, delay: 0 },
              'line-width-transition': { duration: 400, delay: 0 },
            },
          });

          map.on('mousemove', 'si053-countries', () => { if (map) map.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', 'si053-countries', () => { if (map) map.getCanvas().style.cursor = ''; });
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

          map.once('idle', () => {
            ready = true;
            window.clearTimeout(readinessTimer);
            setMapError(false);
          });
        } catch (error) {
          console.warn('Could not add globe data layers', error);
          setMapError(true);
        }
      });

      let previous = performance.now();
      const rotate = (now: number) => {
        const deltaSeconds = Math.min(0.05, (now - previous) / 1000);
        previous = now;
        if (map && autoRotateRef.current && !map.isMoving()) {
          const center = map.getCenter();
          map.setCenter([center.lng + deltaSeconds * 3.2, center.lat]);
        }
        frame = requestAnimationFrame(rotate);
      };
      frame = requestAnimationFrame(rotate);
    } catch (error) {
      console.error('Could not initialize MapLibre globe', error);
      setMapError(true);
    }

    return () => {
      window.clearTimeout(readinessTimer);
      if (frame) cancelAnimationFrame(frame);
      try { map?.remove(); } catch { /* ignore cleanup failures */ }
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer('si053-countries')) return;
    try {
      map.setPaintProperty('si053-countries', 'fill-color', fillExpression(countries, metricByCountry) as never);
    } catch (error) {
      console.warn('Could not update globe market colors', error);
    }
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
    try {
      map.setPaintProperty('si053-country-lines', 'line-color', selected as never);
      map.setPaintProperty('si053-country-lines', 'line-width', width as never);
    } catch (error) {
      console.warn('Could not update globe selection', error);
    }
  }, [selectedCountryId]);

  return (
    <div className="country-globe" aria-label="Interactive SI-053 global opportunity globe">
      <div ref={containerRef} className="country-globe-map" />
      {mapError && (
        <div className="globe-fallback" role="status">
          <strong>Interactive globe unavailable</strong>
          <span>The commercial model remains available. This browser may have WebGL disabled or unavailable.</span>
        </div>
      )}
    </div>
  );
}
