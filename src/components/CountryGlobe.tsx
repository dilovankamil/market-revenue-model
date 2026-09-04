import type { CountryAssumption, CountryId } from '../model/types';
import { SvgCountryGlobe } from './SvgCountryGlobe';

export interface GlobeCountrySelection {
  id: string;
  name: string;
  configured: boolean;
}

interface CountryGlobeProps {
  countries: CountryAssumption[];
  onSelectCountry: (countryId: CountryId) => void;
  onInspectCountry?: (selection: GlobeCountrySelection) => void;
  autoRotate?: boolean;
}

export function CountryGlobe(props: CountryGlobeProps) {
  return <SvgCountryGlobe {...props} />;
}
