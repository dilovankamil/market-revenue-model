import type { RegionId } from './types';

export const REGION_ORDER: RegionId[] = [
  'North America',
  'Europe',
  'South America',
  'Middle East & North Africa',
  'South Asia',
  'East Asia',
  'Southeast Asia',
  'Oceania',
];

export const REGION_COLORS: Record<RegionId, string> = {
  'North America': '#6ed7ff',
  Europe: '#4fd1c5',
  'South America': '#f5b942',
  'Middle East & North Africa': '#f28c6f',
  'South Asia': '#d69ef5',
  'East Asia': '#8ca8ff',
  'Southeast Asia': '#7fd9a8',
  Oceania: '#f1a7c5',
};

export const regionColor = (region: RegionId, active = true) => {
  if (active) return REGION_COLORS[region];
  const hex = REGION_COLORS[region].replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgb(${Math.round(r * 0.32)} ${Math.round(g * 0.32)} ${Math.round(b * 0.32)})`;
};
