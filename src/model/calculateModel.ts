import type {
  IndicationAssumption,
  MarketAssumption,
  MarketYearResult,
  ModelResult,
  Scenario,
  YearResult,
} from './types';

const adoptionShare = (
  year: number,
  indication: IndicationAssumption,
  peakSharePct: number,
): number => {
  if (year < indication.launchYear) return 0;
  const elapsed = year - indication.launchYear + 1;
  const rampFraction = Math.min(1, elapsed / indication.rampYears);
  return (peakSharePct / 100) * rampFraction;
};

const erosionFactor = (
  year: number,
  loeYear: number,
  patentExtensionYears: number,
  erosionPct: number,
): number => {
  const effectiveLoe = loeYear + patentExtensionYears;
  if (year <= effectiveLoe) return 1;
  return Math.pow(1 - erosionPct / 100, year - effectiveLoe);
};

const marketYear = (
  scenario: Scenario,
  market: MarketAssumption,
  year: number,
): MarketYearResult => {
  let eligiblePatients = 0;
  let treatedPatients = 0;
  let grossRevenueUsd = 0;

  Object.values(scenario.indications)
    .filter((indication) => indication.enabled)
    .forEach((indication) => {
      const annualCases = market.population * indication.incidencePer100k / 100_000;
      const eligible = annualCases * market.surgeryEligibility[indication.id];
      const share = adoptionShare(year, indication, market.peakSharePct);
      const treated = eligible * share;
      const erosion = erosionFactor(
        year,
        market.loeYear,
        scenario.patentExtensionYears,
        scenario.erosionPct,
      );

      eligiblePatients += eligible;
      treatedPatients += treated;
      grossRevenueUsd += treated * market.priceUsd * erosion;
    });

  const operatingCostsUsd = grossRevenueUsd * (scenario.operatingCostPct / 100);
  const developmentCostsUsd = scenario.developmentCosts
    .filter((cost) => cost.year === year)
    .filter((cost) => !cost.indication || scenario.indications[cost.indication].enabled)
    .reduce((sum, cost) => sum + cost.amountUsd, 0);

  return {
    marketId: market.id,
    year,
    eligiblePatients,
    treatedPatients,
    grossRevenueUsd,
    operatingCostsUsd,
    developmentCostsUsd,
    netCashFlowUsd: grossRevenueUsd - operatingCostsUsd - developmentCostsUsd,
  };
};

export const calculateModel = (scenario: Scenario): ModelResult => {
  const years = Array.from(
    { length: scenario.endYear - scenario.startYear + 1 },
    (_, index) => scenario.startYear + index,
  );

  const enabledMarkets = Object.values(scenario.markets).filter((market) => market.enabled);
  const marketYears = enabledMarkets.flatMap((market) =>
    years.map((year) => marketYear(scenario, market, year)),
  );

  let cumulativeCashFlowUsd = 0;

  const yearResults: YearResult[] = years.map((year) => {
    const rows = marketYears.filter((row) => row.year === year);
    const grossRevenueUsd = rows.reduce((sum, row) => sum + row.grossRevenueUsd, 0);
    const operatingCostsUsd = rows.reduce((sum, row) => sum + row.operatingCostsUsd, 0);

    // Development costs are company-level, not repeated once per active market.
    const developmentCostsUsd = scenario.developmentCosts
      .filter((cost) => cost.year === year)
      .filter((cost) => !cost.indication || scenario.indications[cost.indication].enabled)
      .reduce((sum, cost) => sum + cost.amountUsd, 0);

    const netCashFlowUsd = grossRevenueUsd - operatingCostsUsd - developmentCostsUsd;
    cumulativeCashFlowUsd += netCashFlowUsd;

    return {
      year,
      grossRevenueUsd,
      operatingCostsUsd,
      developmentCostsUsd,
      netCashFlowUsd,
      cumulativeCashFlowUsd,
      treatedPatients: rows.reduce((sum, row) => sum + row.treatedPatients, 0),
    };
  });

  const peakRevenue = yearResults.reduce(
    (best, row) => row.grossRevenueUsd > best.grossRevenueUsd ? row : best,
    yearResults[0],
  );

  return {
    years: yearResults,
    marketYears,
    peakRevenueUsd: peakRevenue?.grossRevenueUsd ?? 0,
    peakRevenueYear: peakRevenue?.year ?? scenario.startYear,
    cumulativeRevenueUsd: yearResults.reduce((sum, row) => sum + row.grossRevenueUsd, 0),
    cumulativeCashFlowUsd,
    peakTreatedPatients: Math.max(0, ...yearResults.map((row) => row.treatedPatients)),
  };
};
