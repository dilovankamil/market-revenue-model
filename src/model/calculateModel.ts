import type {
  CorporateCostLine,
  CountryAssumption,
  CountryYearResult,
  DevelopmentStage,
  IndicationAssumption,
  ModelResult,
  Scenario,
  YearResult,
} from './types';
import { calculateValuation } from './valuation';

const populationForYear = (country: CountryAssumption, year: number) =>
  country.populationBase * Math.pow(1 + country.populationGrowthPct / 100, year - country.populationBaseYear);

const erosionFactor = (scenario: Scenario, country: CountryAssumption, year: number) => {
  const effectiveLoe = country.loeYear + scenario.patentExtensionYears;
  if (year <= effectiveLoe) return 1;
  return Math.pow(1 - scenario.erosionPct / 100, year - effectiveLoe);
};

const commercialAdoption = (
  country: CountryAssumption,
  indication: IndicationAssumption,
  year: number,
) => {
  const launchYear = country.launchYearByIndication[indication.id];
  if (year < launchYear) return 0;
  const elapsed = year - launchYear + 1;
  return (country.peakSharePct / 100) * Math.min(1, elapsed / indication.defaultRampYears);
};

const namedPatientTreated = (country: CountryAssumption, year: number) => {
  const config = country.namedPatient;
  if (!config || year < config.startYear) return 0;
  const elapsed = year - config.startYear;
  const centres = Math.min(
    config.maxCentres,
    config.centres * Math.pow(1 + config.annualCentreGrowthPct / 100, elapsed),
  );
  return centres * config.eligiblePatientsPerCentre * (config.conversionPct / 100);
};

const activeDevelopmentCostForYear = (stage: DevelopmentStage, year: number) => {
  const start = new Date(`${stage.startDate}T00:00:00Z`);
  const end = new Date(`${stage.endDate}T00:00:00Z`);
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));
  const overlapStart = start > yearStart ? start : yearStart;
  const overlapEnd = end < yearEnd ? end : yearEnd;
  if (overlapEnd < overlapStart) return 0;

  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / 86_400_000 + 1);
  const overlapDays = (overlapEnd.getTime() - overlapStart.getTime()) / 86_400_000 + 1;
  return stage.publicCostUsd * overlapDays / totalDays;
};

const corporateCostForYear = (cost: CorporateCostLine, year: number) => {
  if (year < cost.startYear || year > cost.endYear) return 0;
  const elapsed = year - cost.startYear;
  return cost.annualCostUsd * Math.pow(1 + cost.annualGrowthPct / 100, elapsed);
};

const calculateCountryYear = (
  scenario: Scenario,
  country: CountryAssumption,
  year: number,
): CountryYearResult => {
  const population = populationForYear(country, year);
  let eligiblePatients = 0;
  let treatedPatients = 0;
  let grossRevenueUsd = 0;

  const enabledIndications = Object.values(scenario.indications).filter((indication) => indication.enabled);

  enabledIndications.forEach((indication) => {
    const incidence = indication.incidencePer100kByRegion[country.region];
    const totalCases = population * incidence / 100_000;
    const accessibleCases = totalCases * (country.accessiblePopulationPct / 100);
    const eligible = accessibleCases * country.surgeryEligibility[indication.id];
    eligiblePatients += eligible;

    let treated = 0;
    if (country.accessRoute === 'commercial') {
      treated = eligible * commercialAdoption(country, indication, year);
    } else if (country.accessRoute === 'named-patient' && indication.id === 'gbm') {
      treated = Math.min(eligible, namedPatientTreated(country, year));
    }

    treatedPatients += treated;
    grossRevenueUsd += treated * country.priceUsd * erosionFactor(scenario, country, year);
  });

  const cogsUsd = treatedPatients * scenario.financial.cogsPerTreatmentUsd;
  const commercialOpexUsd = grossRevenueUsd * scenario.financial.commercialOpexPct / 100;

  return {
    countryId: country.id,
    year,
    population,
    eligiblePatients,
    treatedPatients,
    grossRevenueUsd,
    cogsUsd,
    commercialOpexUsd,
    contributionUsd: grossRevenueUsd - cogsUsd - commercialOpexUsd,
  };
};

export const calculateModel = (scenario: Scenario): ModelResult => {
  const modelYears = Array.from(
    { length: scenario.endYear - scenario.startYear + 1 },
    (_, index) => scenario.startYear + index,
  );

  const enabledCountries = Object.values(scenario.countries).filter((country) => country.enabled);
  const countryYears = enabledCountries.flatMap((country) =>
    modelYears.map((year) => calculateCountryYear(scenario, country, year)),
  );

  let cumulativeCashFlowUsd = 0;
  let cashBalanceUsd = 0;
  let minimumCumulativeCashFlowUsd = 0;
  let breakEvenYear: number | null = null;

  const years: YearResult[] = modelYears.map((year) => {
    const countryRows = countryYears.filter((row) => row.year === year);
    const grossRevenueUsd = countryRows.reduce((sum, row) => sum + row.grossRevenueUsd, 0);
    const cogsUsd = countryRows.reduce((sum, row) => sum + row.cogsUsd, 0);
    const commercialOpexUsd = countryRows.reduce((sum, row) => sum + row.commercialOpexUsd, 0);
    const developmentCostsUsd = scenario.developmentStages
      .filter((stage) => scenario.indications[stage.indication].enabled)
      .reduce((sum, stage) => sum + activeDevelopmentCostForYear(stage, year), 0);
    const corporateCostsUsd = scenario.corporateCosts
      .reduce((sum, cost) => sum + corporateCostForYear(cost, year), 0);

    const preTaxCashFlow = grossRevenueUsd - cogsUsd - commercialOpexUsd - developmentCostsUsd - corporateCostsUsd;
    const taxUsd = preTaxCashFlow > 0 ? preTaxCashFlow * scenario.financial.corporateTaxPct / 100 : 0;
    const netCashFlowUsd = preTaxCashFlow - taxUsd;
    const financingCashUsd = scenario.financingEvents
      .filter((event) => event.year === year)
      .reduce((sum, event) => sum + event.amountUsd, 0);

    cumulativeCashFlowUsd += netCashFlowUsd;
    cashBalanceUsd += netCashFlowUsd + financingCashUsd;
    minimumCumulativeCashFlowUsd = Math.min(minimumCumulativeCashFlowUsd, cumulativeCashFlowUsd);

    if (breakEvenYear === null && grossRevenueUsd > 0 && cumulativeCashFlowUsd >= 0) breakEvenYear = year;

    return {
      year,
      grossRevenueUsd,
      cogsUsd,
      commercialOpexUsd,
      developmentCostsUsd,
      corporateCostsUsd,
      taxUsd,
      netCashFlowUsd,
      cumulativeCashFlowUsd,
      financingCashUsd,
      cashBalanceUsd,
      treatedPatients: countryRows.reduce((sum, row) => sum + row.treatedPatients, 0),
    };
  });

  const peakRevenue = years.reduce(
    (best, row) => row.grossRevenueUsd > best.grossRevenueUsd ? row : best,
    years[0],
  );

  return {
    years,
    countryYears,
    peakRevenueUsd: peakRevenue?.grossRevenueUsd ?? 0,
    peakRevenueYear: peakRevenue?.year ?? scenario.startYear,
    cumulativeRevenueUsd: years.reduce((sum, row) => sum + row.grossRevenueUsd, 0),
    cumulativeCashFlowUsd,
    endingCashBalanceUsd: cashBalanceUsd,
    externalFundingUsd: scenario.financingEvents.reduce((sum, event) => sum + event.amountUsd, 0),
    peakTreatedPatients: Math.max(0, ...years.map((row) => row.treatedPatients)),
    peakFundingRequirementUsd: Math.abs(minimumCumulativeCashFlowUsd),
    breakEvenYear,
    valuation: calculateValuation(
      years,
      scenario.startYear,
      scenario.financial.discountRatePct,
      scenario.financial.riskAdjustmentPct,
    ),
  };
};
