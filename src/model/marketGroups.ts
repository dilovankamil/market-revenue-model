import type { CountryId } from './types';

export interface MarketGroupDefinition {
  id: string;
  label: string;
  countryIds: CountryId[];
  collapsedByDefault?: boolean;
}

export const EU27_IDS: CountryId[] = [
  'BEL','BGR','CZE','DNK','DEU','EST','IRL','GRC','ESP','FRA','HRV','ITA','CYP','LVA','LTU','LUX','HUN','MLT','NLD','AUT','POL','PRT','ROU','SVN','SVK','FIN','SWE',
];

export const MARKET_GROUPS: MarketGroupDefinition[] = [
  { id: 'north-america', label: 'North America', countryIds: ['USA', 'CAN', 'MEX'] },
  { id: 'eu27', label: 'European Union', countryIds: EU27_IDS, collapsedByDefault: true },
  { id: 'uk', label: 'United Kingdom', countryIds: ['GBR'] },
  { id: 'asia-pacific', label: 'Asia-Pacific', countryIds: ['JPN', 'IND', 'CHN'] },
];
