# SI-053 Strategic Model

Interactive commercial, development and valuation model for SI-053. The React/TypeScript rebuild separates the model engine from the user interface so commercial, development, access, financing and transaction views share one scenario source of truth.

`Prototype.html` remains in the repository as a historical/reference implementation.

## Architecture

- **React + TypeScript + Vite** — application shell and controls
- **D3** — revenue and cash-flow charts
- **MapLibre GL JS** — interactive globe/country layer
- **World Bank API** — population lookup when inspecting an unconfigured country
- **Pure TypeScript engine** — scenario → epidemiology → access → treated patients → revenue → costs → cash flow → NPV/rNPV
- **Vitest** — calculation tests

## Application sections

1. **Overview** — global footprint, key commercial/funding/value metrics
2. **Global opportunity** — click any country; configured markets show model outputs, unconfigured countries can be explicitly added as labelled proxy markets
3. **Commercial model** — country pricing, penetration, LoE, COGS and commercial OpEx
4. **Development & cash** — clinical programme, stage probabilities, development spend and funding requirement
5. **Scenario lab** — conservative/base/expansion presets
6. **Valuation** — explicit-horizon NPV and stage-adjusted rNPV
7. **Access strategy** — commercial / clinical-trial / named-patient scenarios for India and China
8. **Deal explorer** — illustrative self-commercialisation, licensing and acquisition structures
9. **Methodology** — source lineage and modelling caveats

### Geography

The committed base scenario contains the original strategic markets split to country level. The globe is open-ended: selecting another country retrieves its latest available national population from the World Bank. It is **not** automatically added to the forecast. The user must explicitly add it and choose a regional epidemiology proxy, price, accessible-population share, peak penetration, launch and LoE. Such markets are labelled `proxy` until validated.

India and China also have non-additive subnational opportunity views:

- selected Indian states / territory use government population projections;
- China uses the official four census macro-regions.

These decompose the national opportunity and do not add a second layer of revenue to the country total.

## Public vs private assumptions

This repository is public. It intentionally excludes internal salary schedules, detailed financing plans, confidential workbook line items, acquisition expectations and real partner terms.

Scenario JSON files can be imported locally in the browser to add private corporate-cost and financing assumptions without committing those values to the repository. Browser import/export does not upload the file to a server.

## Valuation method

The public model uses an explicit forecast horizon rather than a perpetual pharmaceutical terminal value.

Stage-adjusted rNPV currently works as follows:

- commercial contribution for each indication is weighted by the product of that indication's configured clinical-stage success probabilities;
- later-stage development spend is weighted by the probability of reaching that stage;
- corporate costs are not probability-adjusted;
- an additional global risk multiplier remains available for sensitivity analysis;
- financing is included in cash balance/runway but excluded from asset NPV.

The stage probabilities are scenario inputs, not validated industry benchmarks. They must be reviewed before formal valuation or external claims.

## Development

```bash
npm install
npm test
npm run dev
```

Production validation:

```bash
npm test
npm run build
```

CI validates tests and a production build on every pull request to `main` and publishes the compiled `dist` directory as an artifact.

## Website deployment

A GitHub Pages production workflow is included for `main`. Before the first deployment, an administrator must configure **Settings → Pages → Build and deployment → Source: GitHub Actions**. The deployment workflow then tests, builds and deploys `dist`.

The Vite build uses relative assets, so the same `dist` can also be hosted under a company-domain subpath without code changes.

## Important modelling limitations

- Epidemiology, surgery eligibility, price, access, launch timing and market penetration require formal source/assumption review before public quantitative use.
- Globe-added countries use World Bank population only; all other assumptions remain explicit proxies.
- Named-patient / early-access legality and operational feasibility are jurisdiction-specific and are not inferred by the model.
- Subnational India/China layers are planning decompositions, not independent market forecasts.
- Detailed private finance-workbook assumptions remain outside this public repository by design.
