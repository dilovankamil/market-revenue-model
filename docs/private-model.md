# Private/internal model configuration

The repository is public, so detailed salary schedules, financing plans, partner economics and confidential trial-cost line items should **not** be committed.

The application supports local scenario JSON files instead. A user can export a scenario, edit/populate its private fields locally, and import it into a running browser session. The file remains local to that browser session unless the hosting environment adds separate persistence.

## Private fields

`scenario.corporateCosts` supports annual company-cost lines:

```json
{
  "id": "example-opex",
  "label": "Corporate operating costs",
  "startYear": 2027,
  "endYear": 2035,
  "annualCostUsd": 1000000,
  "annualGrowthPct": 5
}
```

`scenario.financingEvents` supports funding events:

```json
{
  "id": "example-equity",
  "label": "Illustrative equity financing",
  "year": 2028,
  "amountUsd": 25000000,
  "type": "equity"
}
```

Financing affects cash balance/runway but does not increase asset NPV. Corporate cost lines reduce operating cash flow and therefore NPV/rNPV.

## Workbook integration

A private deployment can translate the detailed rows of `SI053_Finance_Model_v8.xlsx` into these structures, while the public GitHub application retains only coarse/non-confidential development assumptions.
