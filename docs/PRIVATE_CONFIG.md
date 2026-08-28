# Private finance configuration

The repository is public, so confidential company assumptions should not be hard-coded in `src/model/assumptions.ts` or committed anywhere in Git history.

The application supports local scenario JSON import/export. A private file can therefore carry company OpEx, financing events, revised clinical costs and internal commercial assumptions while using the same calculation engine as the public/demo model.

## Safe workflow

1. Run or open the application.
2. Export the current scenario.
3. Save the exported JSON outside this repository in an approved company location.
4. Edit the scenario fields needed for the internal model.
5. Use **Import** in the application.
6. The imported file is parsed in the browser; the import control does not upload it to a backend.
7. Re-export an updated private scenario if needed, again outside this public repository.

Do **not** commit private scenario JSON files. `.gitignore` excludes `*.private.json` and `private-scenarios/`.

## Corporate costs

`scenario.corporateCosts` is an array:

```json
[
  {
    "id": "management-opex",
    "label": "Management and corporate operations",
    "startYear": 2027,
    "endYear": 2035,
    "annualCostUsd": 0,
    "annualGrowthPct": 0
  }
]
```

Use separate lines for materially different cost categories if management wants to see their contribution independently. Detailed employee-level salary data should generally remain outside the web model; aggregate functional cost lines are preferable.

## Financing events

`scenario.financingEvents` is an array:

```json
[
  {
    "id": "financing-2028",
    "label": "Illustrative financing",
    "year": 2028,
    "amountUsd": 0,
    "type": "equity"
  }
]
```

Supported `type` values are:

- `equity`
- `debt`
- `partner`
- `grant`

Financing affects cash balance/runway but is deliberately excluded from asset NPV.

## Development programme

Private scenarios can replace `scenario.developmentStages` with the currently approved programme. Each stage has:

```json
{
  "id": "gbm-p2",
  "indication": "gbm",
  "phase": "Phase II",
  "startDate": "2029-01-01",
  "endDate": "2030-08-31",
  "publicCostUsd": 0,
  "successProbabilityPct": 70
}
```

Despite the property name `publicCostUsd`, a locally imported private scenario may contain a private internal cost. The property name is retained for file compatibility and should eventually be renamed through a versioned scenario-file migration.

## Stage-adjusted rNPV

For an indication, the engine multiplies configured stage probabilities. Example only:

```text
Phase II success 70%
× Phase III success 65%
= 45.5% cumulative clinical success
```

Commercial contribution is weighted by that cumulative probability. Development cost for a later stage is weighted by the probability of reaching that stage. The global `financial.riskAdjustmentPct` is then applied as an additional sensitivity multiplier to commercial contribution.

This means the user should avoid entering stage probabilities and a global multiplier that represent the same risk twice.

## Internal build mode

The public build hides private-labelled navigation such as Deal Explorer. For an internal build:

```bash
VITE_SHOW_PRIVATE_MODULES=true npm run build
```

This flag is **not authentication**. If confidential data is served from a hosted internal deployment, real server-side access control is required.
