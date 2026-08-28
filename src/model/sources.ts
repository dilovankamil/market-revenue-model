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
    appliesTo: 'United States · GBM',
    note: 'Literature lineage used by the finance workbook; the committed model retains the workbook aggregate rate.',
    status: 'literature',
  },
  {
    id: 'gbm-eu-incidence',
    category: 'Epidemiology',
    label: 'European glioblastoma incidence',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40203511/',
    appliesTo: 'EU4 + UK · GBM',
    note: 'Literature lineage used for the European incidence assumption.',
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
    id: 'population-workbook',
    category: 'Population',
    label: 'Population forecast scale',
    appliesTo: 'US · EU4 + UK · Japan',
    note: 'Base-year totals and growth rates are inherited from SI053_Finance_Model_v8.xlsx. EU4+UK is split into countries for mapping while preserving the workbook regional total approximately.',
    status: 'workbook',
  },
  {
    id: 'population-world-bank',
    category: 'Population',
    label: 'World Bank population indicator (SP.POP.TOTL)',
    url: 'https://data.worldbank.org/indicator/SP.POP.TOTL',
    appliesTo: 'Countries inspected/added from the globe',
    note: 'The globe can retrieve the latest available national population value. No epidemiology, access, price, launch or LoE assumption is inferred from the World Bank data.',
    status: 'literature',
  },
  {
    id: 'india-state-population',
    category: 'Population',
    label: 'Population Projections for India and States 2011–2036',
    url: 'https://www.mohfw.gov.in/sites/default/files/Population%20Projection%20Report%202011-2036%20-%20upload_compressed_0.pdf',
    appliesTo: 'Selected India state/territory opportunity view',
    note: 'Government population projections are used for selected strategic regions. This is a partial subnational planning view and does not replace or add to the national market total.',
    status: 'literature',
  },
  {
    id: 'china-census-regions',
    category: 'Population',
    label: 'China Seventh National Population Census — regional population',
    url: 'https://www.stats.gov.cn/english/PressRelease/202105/t20210510_1817188.html',
    appliesTo: 'China macro-region opportunity view',
    note: 'Official 2020 census population for Eastern, Central, Western and Northeast regions. Subsequent projection uses the national scenario growth rate rather than region-specific migration forecasts.',
    status: 'literature',
  },
  {
    id: 'development-workbook',
    category: 'Development',
    label: 'Clinical programme timing and public cost layer',
    appliesTo: 'GBM · BM · OPBT',
    note: 'Phase timing and coarse cost aggregates are transcribed from SI053_Finance_Model_v8.xlsx. Detailed internal line items are intentionally excluded from this public repository.',
    status: 'workbook',
  },
  {
    id: 'stage-probability-scenario',
    category: 'Development',
    label: 'Clinical stage success probabilities',
    appliesTo: 'GBM · BM · OPBT',
    note: 'Stage probabilities are explicit scenario inputs. They are not presented as validated industry benchmarks and must be reviewed before formal valuation use.',
    status: 'scenario',
  },
  {
    id: 'pricing-scenario',
    category: 'Commercial',
    label: 'Treatment price and peak penetration',
    appliesTo: 'Country markets',
    note: 'Scenario assumptions, not observed market facts. Users should stress-test these values rather than treating the base case as a forecast.',
    status: 'scenario',
  },
  {
    id: 'india-china-access',
    category: 'Commercial',
    label: 'India/China accessible-population and early-access assumptions',
    appliesTo: 'India · China',
    note: 'Illustrative strategic assumptions. They are not assertions that named-patient or equivalent access is legally available in a jurisdiction.',
    status: 'scenario',
  },
  {
    id: 'proxy-market-method',
    category: 'Commercial',
    label: 'Globe-added proxy markets',
    appliesTo: 'Any country added from the map',
    note: 'Only population is retrieved externally. The user must explicitly select a regional epidemiology proxy, price, addressable fraction, launch year, peak share and LoE. Proxy markets are labelled until validated.',
    status: 'scenario',
  },
  {
    id: 'valuation-method',
    category: 'Valuation',
    label: 'Explicit-horizon stage-adjusted rNPV',
    appliesTo: 'Whole model',
    note: 'Uses annual cash flows through the selected horizon and no perpetual terminal value. Commercial contribution is weighted by cumulative configured clinical-stage success; later-stage development spend is weighted by probability of reaching that stage. An additional risk multiplier remains available for sensitivity analysis.',
    status: 'scenario',
  },
];
