# SI-053 Strategic Model

Interactive commercial, development and valuation model for SI-053. This branch replaces the original single-file Plotly prototype with a React + TypeScript application and a pure calculation engine.

## Current architecture

- **React + TypeScript + Vite** — application shell and controls
- **D3** — financial charts
- **MapLibre GL JS** — interactive globe/country layer
- **Pure TypeScript model** — scenario → epidemiology → access → treated patients → revenue → costs → cash flow → NPV/rNPV
- **Vitest** — calculation smoke tests

`Prototype.html` remains in the repository as a historical/reference implementation while outputs are reconciled.

## Public vs private assumptions

This GitHub repository is public. The committed model therefore contains only public/demo assumptions and coarse development-cost aggregates. It does **not** contain internal salary schedules, financing plans, detailed workbook cost lines, acquisition expectations or confidential partner terms.

The code is structured so an internal deployment can later load a private scenario/configuration layer without changing the public model engine.

## Sections

1. Overview
2. Global opportunity — country-level globe and patient funnel
3. Commercial model — price, penetration, LoE and cost assumptions
4. Development & cash — clinical timing, development spend and funding requirement
5. Scenario lab — conservative/base/expansion presets
6. Valuation — explicit-horizon NPV and simplified rNPV
7. Access strategy — named-patient/early-access model for India/China
8. Deal explorer — illustrative transaction structures; no DBP deal assumptions are stored

## Development

```bash
npm install
npm run dev
```

Validation:

```bash
npm test
npm run build
```

## Important modelling limitations

- Country populations outside the original US/EU4+UK/Japan workbook geography are demo estimates and should be replaced by a maintained population dataset/API before external quantitative use.
- India and China accessibility assumptions are scenario variables, not epidemiological facts.
- Named-patient availability is jurisdiction-specific and must be verified outside this calculator.
- Current rNPV uses a simplified aggregate risk adjustment. Formal valuation should use phase-conditional probabilities and validated cash-flow assumptions.
- No perpetual terminal value is used; the explicit forecast captures the finite-exclusivity nature of the asset more transparently than the workbook's current perpetuity approach.

## Source lineage

The modelling structure was informed by `SI053_Finance_Model_v8.xlsx` and the original HTML prototype. Public literature/source URLs already present in those models should remain attached to the relevant assumptions as the methodology layer is expanded.
