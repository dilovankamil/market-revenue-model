import { useEffect, useMemo, useRef } from 'react';
import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { CountryAssumption, CountryId } from '../model/types';

const WORLD_GEOJSON = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';

const enabledColor = '#4fd1c5';
const inactiveColor = '#263341';
const namedPatientColor = '#f5b942';

interface CountryGlobeProps {
  countries: CountryAssumption[];
  selectedCountryId: CountryId | null;
  onSelectCountry: (countryId: CountryId) => void;
  metricByCountry?: Partial<Record<CountryId, number>>;
}

const metricColor = (value: number, max: number) => {
  if (value <= 0 || max <= 0) return enabledColor;
  const fraction = Math.min(1, Math.sqrt(value / max));
  const lightness = 28 + fraction * 34;
  return `hsl(174 60% ${lightness}%)`;
};

const fillExpression = (countries: CountryAssumption[], metricByCountry: Partial<Record<CountryId, number>> = {}) => {
  const maxMetric = Math.max(0, ...countries.map((country) => metricByCountry[country.id] ?? 0));
  const expression: unknown[] = ['match', ['get', 'name']];
  countries.forEach((country) => {
    expression.push(
      country.geoName,
      country.enabled
        ? country.accessRoute === 'named-patient'
          ? namedPatientColor
          : metricColor(metricByCountry[country.id] ?? 0, maxMetric)
        : inactiveColor,
    );
  });
  expression.push('#111923');
  return expression;
};

export function CountryGlobe({ countries, selectedCountryId, onSelectCountry, metricByCountry = {} }: CountryGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const countriesRef = useRef(countries);
  const metricRef = useRef(metricByCountry);
  const onSelectRef = useRef(onSelectCountry);

  useEffect(() => { countriesRef.current = countries; }, [countries]);
  useEffect(() => { metricRef.current = metricByCountry; }, [metricByCountry]);
  useEffect(() => { onSelectRef.current = onSelectCountry; }, [onSelectCountry]);

  const selectedGeoName = useMemo(
    () => countries.find((country) => country.id === selectedCountryId)?.geoName ?? null,
    [countries, selectedCountryId],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [12, 24],
      zoom: 1.15,
      minZoom: 0.8,
      maxZoom: 7,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    map.on('style.load', () => {
      map.setProjection({ type: 'globe' });
    });

    map.on('load', () => {
      map.addSource('countries', { type: 'geojson', data: WORLD_GEOJSON });
      map.addLayer({
        id: 'si053-countries',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': fillExpression(countriesRef.current, metricRef.current) as never,
          'fill-opacity': 0.82,
        },
      });
      map.addLayer({
        id: 'si053-country-lines',
        type: 'line',
        source: 'countries',
        paint: { 'line-color': '#8090a0', 'line-opacity': 0.35, 'line-width': 0.6 },
      });

      map.on('mousemove', 'si053-countries', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'si053-countries', () => { map.getCanvas().style.cursor = ''; });
      map.on('click', 'si053-countries', (event) => {
        const name = event.features?.[0]?.properties?.name as string | undefined;
        const match = countriesRef.current.find((country) => country.geoName === name);
        if (match) onSelectRef.current(match.id);
      });
    });

    mapRef.current = map;
    return () => {
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
    map.setPaintProperty(
      'si053-country-lines',
      'line-color',
      selectedGeoName ? ['case', ['==', ['get', 'name'], selectedGeoName], '#ffffff', '#8090a0'] : '#8090a0',
    );
    map.setPaintProperty(
      'si053-country-lines',
      'line-width',
      selectedGeoName ? ['case', ['==', ['get', 'name'], selectedGeoName], 2.4, 0.6] : 0.6,
    );
  }, [selectedGeoName]);

  return <div ref={containerRef} className="country-globe" aria-label="Interactive SI-053 global opportunity map" />;
}
