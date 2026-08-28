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
    id: 'development-workbook',
    category: 'Development',
    label: 'Clinical programme timing and public cost layer',
    appliesTo: 'GBM · BM · OPBT',
    note: 'Phase timing and coarse cost aggregates are transcribed from SI053_Finance_Model_v8.xlsx. Detailed internal line items are intentionally excluded from this public repository.',
    status: 'workbook',
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
    id: 'valuation-method',
    category: 'Valuation',
    label: 'Explicit-horizon NPV/rNPV',
    appliesTo: 'Whole model',
    note: 'Uses annual cash flows through the selected horizon and no perpetual terminal value. Current public rNPV applies an aggregate risk factor and should be replaced with validated stage-conditional probabilities for formal valuation.',
    status: 'scenario',
  },
];
