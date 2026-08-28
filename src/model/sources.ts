export type SourceCategory = 'Epidemiology' | 'Surgery eligibility' | 'Population' | 'Development' | 'Commercial' | 'Valuation';

export interface MethodologySource {
  id: string;
  category: SourceCategory;
  label: string;
  url?: string;
  appliesTo: string;
  note: string;
  status: 'literature' | 'workbook' | 'scenario';
}

export const methodologySources: MethodologySource[] = [
  {
    id: 'gbm-us-incidence',
    category: 'Epidemiology',
    label: 'US glioblastoma incidence',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6352755/',
    appliesTo: 'North America · GBM proxy basis',
    note: 'Literature lineage used by the finance workbook. Canada and Mexico currently inherit the North American incidence basis as planning proxies.',
    status: 'literature',
  },
  {
    id: 'gbm-eu-incidence',
    category: 'Epidemiology',
    label: 'European glioblastoma incidence',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40203511/',
    appliesTo: 'EU27 + UK · GBM',
    note: 'Literature lineage used for the European regional incidence assumption. Country-specific variation is not yet modelled.',
    status: 'literature',
  },
  {
    id: 'gbm-jp-incidence',
    category: 'Epidemiology',
    label: 'Japan glioblastoma incidence',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38206510/',
    appliesTo: 'Japan · GBM',
    note: 'Literature lineage used for the Japanese incidence assumption.',
    status: 'literature',
  },
  {
    id: 'brain-met-incidence',
    category: 'Epidemiology',
    label: 'Brain metastasis incidence basis',
    url: 'https://pubmed.ncbi.nlm.nih.gov/2405271/',
    appliesTo: 'Brain metastases',
    note: 'Historical incidence basis inherited from the modelling workbook; this should be refreshed before external quantitative use.',
    status: 'literature',
  },
  {
    id: 'brain-met-surgery',
    category: 'Surgery eligibility',
    label: 'Role of surgery in metastatic brain tumors',
    url: 'https://www.cns.org/guidelines/treatment-adults-metastatic-brain-tumors/practice-guideline-on-role-of-surgery-in-managemen',
    appliesTo: 'Brain metastases',
    note: 'Clinical context for resection eligibility. Country-specific surgical access remains a model assumption.',
    status: 'literature',
  },
  {
    id: 'population-eurostat',
    category: 'Population',
    label: 'Eurostat EU27 population, 1 January 2026',
    url: 'https://ec.europa.eu/eurostat/statistics-explained/index.php?title=Population_and_population_change_statistics',
    appliesTo: 'European Union (27 countries)',
    note: 'EU member-state population bases are aligned to Eurostat 2026 demographic totals. Commercial assumptions are still regional planning proxies outside the previously configured core markets.',
    status: 'literature',
  },
  {
    id: 'population-world-bank',
    category: 'Population',
    label: 'World Bank population indicator (SP.POP.TOTL)',
    url: 'https://data.worldbank.org/indicator/SP.POP.TOTL',
    appliesTo: 'Canada · Mexico',
    note: 'Latest available national population observations are used as the public population basis; commercial assumptions remain scenario inputs.',
    status: 'literature',
  },
  {
    id: 'population-workbook',
    category: 'Population',
    label: 'Original workbook population scale',
    appliesTo: 'United States · UK · Japan and original configured European markets',
    note: 'The original finance workbook remains the lineage for core market population scale where more recent public sources have not yet replaced it.',
    status: 'workbook',
  },
  {
    id: 'development-workbook',
    category: 'Development',
    label: 'Clinical programme timing and public cost layer',
    appliesTo: 'GBM · BM · OPBT',
    note: 'Coarse cost aggregates are transcribed from SI053_Finance_Model_v8.xlsx. The programme calendar is a live planning assumption; the current public model shifts the programme one year later, beginning Phase I in June 2027.',
    status: 'workbook',
  },
  {
    id: 'stage-probability-scenario',
    category: 'Development',
    label: 'Clinical stage risk sensitivities',
    appliesTo: 'GBM · BM · OPBT',
    note: 'Stage probabilities are advanced scenario inputs rather than headline forecasts. Pre-launch stages affect commercialization risk; confirmatory post-launch stages affect probability-weighted programme spend.',
    status: 'scenario',
  },
  {
    id: 'pricing-scenario',
    category: 'Commercial',
    label: 'Treatment price, launch timing and peak penetration',
    appliesTo: 'Country markets',
    note: 'Scenario assumptions, not observed market facts. Proxy markets are explicitly marked and require country-specific validation before external quantitative use.',
    status: 'scenario',
  },
  {
    id: 'valuation-method',
    category: 'Valuation',
    label: 'Explicit-horizon commercialization-gate rNPV',
    appliesTo: 'Whole model',
    note: 'Uses annual cash flows through the selected horizon and no perpetual terminal value. Revenue is weighted by the configured pre-launch commercialization gate; confirmatory studies that continue after launch remain in the development cost path instead of becoming an additional barrier to initial sales. An additional risk sensitivity remains available.',
    status: 'scenario',
  },
];
