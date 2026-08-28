export interface SubnationalRegion {
  id: string;
  name: string;
  populationBase: number;
  populationBaseYear: number;
  sourceLabel: string;
  sourceUrl: string;
  note?: string;
}

export interface SubnationalDataset {
  countryId: 'IND' | 'CHN';
  title: string;
  coverageNote: string;
  regions: SubnationalRegion[];
}

export const subnationalDatasets: Record<'IND' | 'CHN', SubnationalDataset> = {
  IND: {
    countryId: 'IND',
    title: 'Selected strategic Indian states / territory',
    coverageNote: 'Selected regions only; values are 2031 population projections and do not sum to India. Intended for regional opportunity discussion, not national reconciliation.',
    regions: [
      {
        id: 'IND-MH',
        name: 'Maharashtra',
        populationBase: 133_451_000,
        populationBaseYear: 2031,
        sourceLabel: 'National Commission on Population projection report',
        sourceUrl: 'https://www.mohfw.gov.in/sites/default/files/Population%20Projection%20Report%202011-2036%20-%20upload_compressed_0.pdf',
      },
      {
        id: 'IND-KA',
        name: 'Karnataka',
        populationBase: 70_738_000,
        populationBaseYear: 2031,
        sourceLabel: 'National Commission on Population projection report',
        sourceUrl: 'https://www.mohfw.gov.in/sites/default/files/Population%20Projection%20Report%202011-2036%20-%20upload_compressed_0.pdf',
      },
      {
        id: 'IND-TN',
        name: 'Tamil Nadu',
        populationBase: 78_081_000,
        populationBaseYear: 2031,
        sourceLabel: 'National Commission on Population projection report',
        sourceUrl: 'https://www.mohfw.gov.in/sites/default/files/Population%20Projection%20Report%202011-2036%20-%20upload_compressed_0.pdf',
      },
      {
        id: 'IND-TG',
        name: 'Telangana',
        populationBase: 39_207_000,
        populationBaseYear: 2031,
        sourceLabel: 'National Commission on Population projection report',
        sourceUrl: 'https://www.mohfw.gov.in/sites/default/files/Population%20Projection%20Report%202011-2036%20-%20upload_compressed_0.pdf',
      },
      {
        id: 'IND-DL',
        name: 'NCT of Delhi',
        populationBase: 24_552_000,
        populationBaseYear: 2031,
        sourceLabel: 'National Commission on Population projection report',
        sourceUrl: 'https://www.mohfw.gov.in/sites/default/files/Population%20Projection%20Report%202011-2036%20-%20upload_compressed_0.pdf',
      },
    ],
  },
  CHN: {
    countryId: 'CHN',
    title: 'China census macro-regions',
    coverageNote: 'Official 2020 census macro-regions. Population is projected forward only with the national scenario growth rate; region-specific post-2020 migration is not modelled.',
    regions: [
      {
        id: 'CHN-EAST',
        name: 'Eastern region',
        populationBase: 563_717_119,
        populationBaseYear: 2020,
        sourceLabel: 'National Bureau of Statistics of China, Seventh Census',
        sourceUrl: 'https://www.stats.gov.cn/english/PressRelease/202105/t20210510_1817188.html',
      },
      {
        id: 'CHN-CENTRAL',
        name: 'Central region',
        populationBase: 364_694_362,
        populationBaseYear: 2020,
        sourceLabel: 'National Bureau of Statistics of China, Seventh Census',
        sourceUrl: 'https://www.stats.gov.cn/english/PressRelease/202105/t20210510_1817188.html',
      },
      {
        id: 'CHN-WEST',
        name: 'Western region',
        populationBase: 382_852_295,
        populationBaseYear: 2020,
        sourceLabel: 'National Bureau of Statistics of China, Seventh Census',
        sourceUrl: 'https://www.stats.gov.cn/english/PressRelease/202105/t20210510_1817188.html',
      },
      {
        id: 'CHN-NORTHEAST',
        name: 'Northeast region',
        populationBase: 98_514_948,
        populationBaseYear: 2020,
        sourceLabel: 'National Bureau of Statistics of China, Seventh Census',
        sourceUrl: 'https://www.stats.gov.cn/english/PressRelease/202105/t20210510_1817188.html',
      },
    ],
  },
};
