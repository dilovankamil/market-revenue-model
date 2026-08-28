import type { CountryAssumption, CountryId } from '../model/types';
import { SvgCountryGlobeV8 } from './SvgCountryGlobeV8';

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

export function CountryGlobe(props: CountryGlobeProps) {
  return <SvgCountryGlobeV8 {...props} />;
}
