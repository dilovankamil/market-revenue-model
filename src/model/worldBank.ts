export interface ExternalCountryProfile {
  id: string;
  name: string;
  population: number;
  populationYear: number;
  source: 'World Bank';
}

interface WorldBankPopulationRecord {
  countryiso3code?: string;
  date?: string;
  value?: number | null;
  country?: { value?: string };
}

export async function fetchExternalCountryProfile(
  iso3: string,
  fallbackName: string,
): Promise<ExternalCountryProfile> {
  const endpoint = `https://api.worldbank.org/v2/country/${encodeURIComponent(iso3)}/indicator/SP.POP.TOTL?format=json&per_page=8`;
  const response = await fetch(endpoint);
  if (!response.ok) throw new Error(`World Bank request failed (${response.status})`);

  const payload = await response.json() as [unknown, WorldBankPopulationRecord[]?];
  const rows = payload?.[1] ?? [];
  const latest = rows.find((row) => typeof row.value === 'number' && row.value > 0);
  if (!latest?.value) throw new Error('No recent population value returned by World Bank');

  return {
    id: latest.countryiso3code || iso3,
    name: latest.country?.value || fallbackName,
    population: latest.value,
    populationYear: Number(latest.date) || new Date().getFullYear(),
    source: 'World Bank',
  };
}
