# SI-053 Strategic Model

Interactive commercial, development and valuation model for SI-053. The React/TypeScript application separates the model engine from the user interface so market, development, cash-flow, valuation and private transaction views share one scenario source of truth.

## Architecture

- **React + TypeScript + Vite** — application shell and controls
- **D3 + SVG** — revenue/cash-flow charts and the interactive orthographic globe
- **Layered WebP + code-native story visuals** — five calibrated scientific assets, plus restrained pathway/opportunity diagrams rendered by the application
- **Bundled world geometry** — country selection does not require WebGL or a third-party map service at runtime
- **Pure TypeScript engine** — scenario → epidemiology → eligible patients → commercial adoption → revenue → costs → cash flow → NPV/rNPV
- **Vitest** — calculation and validation tests

## Application sections

1. **SI-053 story** — seven-chapter treatment-to-opportunity scrollytelling introduction
2. **Commercial & valuation** — scenario, value levers, rollout globe, country contribution and revenue forecast
3. **Development & cash** — programme sequence, development spend, funding requirement and cumulative operating cash flow
4. **Methodology** — source lineage, assumption status and modelling caveats
5. **Deal explorer** — private-build-only illustrative transaction structures

## Geography

The committed base scenario now contains:

- United States, Canada and Mexico under **North America**;
- all **27 European Union member states**, the United Kingdom, Norway and Switzerland under **Europe**;
- North America and Europe enabled by default, for 33 active base-case markets;
- selectable planning markets across South America, MENA, South Asia, East Asia, Southeast Asia and Oceania, disabled by default.

Canada, Mexico, non-core European countries and the expansion markets are labelled planning proxies until country-specific epidemiology, pricing, access and launch assumptions are validated. Japan is available in East Asia but is not selected in the public base case.

## Public vs private assumptions

This repository is public. It intentionally excludes internal salary schedules, detailed financing plans, confidential workbook line items, acquisition expectations and real partner terms.

Private builds expose local scenario JSON import/export for adding approved corporate-cost and financing assumptions without committing those values to the repository. Import/export runs in the browser and does not upload the file to a server.

## Development and valuation method

The current public programme calendar begins GBM Phase I in June 2027. The base commercial model treats completion of the pre-launch programme through Phase II as the commercialization gate. Confirmatory Phase III may continue after the first modeled commercial launch.

Stage-adjusted rNPV therefore works as follows:

- commercial contribution is weighted by the product of stage probabilities required **before first modeled launch**;
- a confirmatory study that finishes after launch does not become an additional probability barrier to initial sales;
- later-stage development spend is still weighted by the probability of reaching that stage;
- corporate costs are not probability-adjusted;
- an additional global risk sensitivity remains available;
- financing affects cash balance/runway but is excluded from asset NPV;
- no perpetual terminal value is used.

Detailed stage probabilities are advanced scenario inputs, not headline forecasts or validated industry benchmarks.

## Development

```bash
npm ci
npm test
npm run dev
```

Production validation:

```bash
npm test
npm run build
```

CI validates tests and a production build on every pull request to `main` and publishes the compiled `dist` directory as an artifact. `npm run release:pages` also refreshes the stable branch-hosted release aliases.

## Website deployment

GitHub Pages is served from the repository branch root. Production uses checked-in, cache-busted `/market-revenue-model/assets/app.js` and `style.css` aliases generated from a verified build; CI independently verifies the same source on `main`.

The responsive shell is designed around a 320 px minimum width, uses a mobile command bar through tablet widths, accounts for iOS safe areas, and expands analytical pages on large displays. Desktop/tablet use a paced sticky story; phones use a normal editorial sequence so touch scrolling remains predictable.

## Important modelling limitations

- Epidemiology, surgery eligibility, price, accessible population, launch timing and market penetration require formal source/assumption review before public quantitative use.
- OPBT epidemiology remains a placeholder and brain-metastasis epidemiology should be refreshed.
- Canada, Mexico and many EU country-level commercial assumptions are regional planning proxies.
- The Phase-II commercialization path is a model/regulatory strategy assumption and must not be presented as a regulatory conclusion.
- Detailed private finance-workbook assumptions remain outside this public repository by design.
