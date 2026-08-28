# Base-case assumption register

This document is a review aid for the committed **public/demo** scenario. It is not an endorsement of the values. A value should not be treated as publication-ready merely because it exists in code.

Status key:

- **Workbook/literature lineage** — inherited from the finance workbook and/or a linked literature source; still requires exact reconciliation.
- **Scenario choice** — management modelling choice rather than an observed fact.
- **Planning proxy** — regional assumptions applied to a country until country-specific inputs are validated.
- **Placeholder / high-priority review** — particularly important to replace or justify before external use.

## Epidemiology

| Assumption | Base value | Status | Review note |
|---|---:|---|---|
| GBM incidence — North America | 3.42296 / 100k | Workbook/literature lineage | US-derived regional basis; Canada/Mexico currently inherit it as a proxy. |
| GBM incidence — Europe | 4.52 / 100k | Workbook/literature lineage | Applied across EU27 + UK; country-specific variation is not yet modelled. |
| GBM incidence — Asia-Pacific/Japan proxy | 2.1 / 100k | Workbook/literature lineage | Japan-derived value currently used as the Asia-Pacific proxy. |
| Brain metastasis incidence | 19.82683 / 100k | **Placeholder / high-priority review** | Historical source basis; refresh before external quantitative use. |
| OPBT incidence | Equal to GBM incidence by region | **Placeholder / high-priority review** | OPBT needs a defensible tumor-group definition and incidence model. |

## Surgical eligibility

| Market basis | GBM | Brain metastasis | OPBT | Status |
|---|---:|---:|---:|---|
| United States / Canada proxy | 73.0% | 25.0% | 33.0% | Scenario / workbook lineage |
| Mexico proxy | 60.0% | 20.0% | 30.0% | Planning proxy |
| EU27 + UK | 74.1% | 25.0% | 33.0% | Scenario / workbook lineage |
| Japan | 88.6% | 25.0% | 33.0% | Scenario / workbook lineage |
| India | 50.0% | 15.0% | 33.0% | Scenario choice |
| China | 55.0% | 18.0% | 33.0% | Scenario choice |

**Priority:** define exactly what “surgery eligible” means: resection performed, resection clinically indicated, gross/partial resection, or addressable intracavitary placement population.

## Base population / growth

- **EU27:** member-state populations use Eurostat population on 1 January 2026 and sum to approximately **451.99M**. Country-specific growth assumptions are planning inputs.
- **Canada:** 41.289M (2024 World Bank population basis); +1.0% annual growth is a planning assumption.
- **Mexico:** 131.947M (2025 World Bank population basis); +0.8% annual growth.
- **United States:** 353.05M in 2028; +0.543% annual growth from workbook lineage.
- **United Kingdom:** 69.0M in 2026; +0.45% planning growth.
- **Japan:** 121.221M in 2028; −0.52% annual growth from workbook lineage.
- **India:** 1.48B in 2028; +0.75% planning growth.
- **China:** 1.40B in 2028; −0.15% planning growth.

The population expansion does **not** mean every added country has validated commercial assumptions. Proxy markets remain marked in the UI.

## Market structure

The base selector is grouped as:

1. **North America** — United States, Canada, Mexico.
2. **European Union** — all 27 EU member states, enabled by default under one parent toggle; individual countries can be deselected.
3. **United Kingdom** — separate from the EU selector.
4. **Asia-Pacific** — Japan enabled in base; India and China disabled by default.

Latin America beyond Mexico is intentionally not represented by arbitrary north/south buckets. A later expansion should use a defined regional or country model with explicit population, epidemiology, access, price and launch assumptions.

## Commercial assumptions

| Market / group | Price | Peak share | Accessible population | GBM launch | LoE | Status |
|---|---:|---:|---:|---:|---:|---|
| United States | $75,000 | 30% | 100% | 2032 | 2037 | Configured scenario |
| Canada | $70,000 | 25% | 100% | 2032 | 2040 | Planning proxy |
| Mexico | $45,000 | 15% | 60% | 2033 | 2040 | Planning proxy |
| EU27 | $75,000 | 30% | 100% | 2032 | 2040 | Regional scenario; non-core countries proxy |
| United Kingdom | $75,000 | 30% | 100% | 2032 | 2040 | Configured scenario |
| Japan | $75,000 | 30% | 100% | 2034 | 2040 | Configured scenario |
| India | $25,000 | 15% | 25% | 2034 | 2040 | Disabled base / planning proxy |
| China | $35,000 | 15% | 30% | 2034 | 2040 | Disabled base / planning proxy |

Portfolio assumptions:

- Adoption ramp: **6 years** to peak share.
- Post-LoE erosion: **15% per year**.
- Patent extension: **0 years** in base case.
- Commercial OpEx: **8% of revenue**.
- COGS: **$500 per treatment**.

### High-priority commercial reviews

1. **$500 COGS is extremely low relative to $75,000 pricing** and should be reconciled with manufacturing, fill/finish, release, packaging, distribution and wastage assumptions.
2. Country pricing should specify list/net/ex-manufacturer/realised revenue concepts.
3. Peak share and ramp require an adoption rationale based on neurosurgical centres, surgeon uptake, reimbursement, contraindications, competition and capacity.
4. LoE should be tied to an IP/regulatory exclusivity schedule rather than a single generic year where possible.
5. Canada, Mexico and non-core EU country inputs need country-specific validation.

## Development programme

The programme has been shifted **one year later** versus the prior public model.

| Indication | Stage | Dates | Public/demo cost | Stage risk input | Role in base model |
|---|---|---|---:|---:|---|
| GBM | Phase I | Jun 2027 – May 2029 | $4.4M | 100% | Pre-launch |
| GBM | Phase II | Jan 2030 – Aug 2031 | $24.7M | 70% | **Commercialization gate** |
| GBM | Confirmatory Phase III | Dec 2031 – Nov 2033 | $45.0M | 65% | Post-launch confirmatory |
| Brain metastases | Bridging Phase II | Mar 2032 – May 2033 | $9.7M | 70% | Commercialization gate |
| Brain metastases | Confirmatory Phase III | Nov 2033 – Oct 2035 | $44.7M | 65% | Post-launch confirmatory |
| OPBT | Bridging Phase II | Mar 2032 – May 2033 | $9.7M | 70% | Commercialization gate |
| OPBT | Confirmatory Phase III | Nov 2033 – Oct 2035 | $44.7M | 65% | Post-launch confirmatory |

The model allocates each stage budget across calendar years according to active days in that year.

## Commercialization-gate valuation logic

The previous model multiplied all configured GBM stages:

`100% × 70% × 65% = 45.5%`

That was inconsistent with a model that begins commercial sales after Phase II. Model v5 therefore separates **initial commercialization risk** from **post-launch confirmatory programme risk**:

- revenue is risk-adjusted through stages completed before first modeled launch;
- in the GBM base case, the pre-launch gate is Phase II, so the configured commercialization factor is **100% × 70% = 70%**;
- the 65% confirmatory Phase III input still affects probability-weighted later-stage development spend, but does not apply another haircut to initial sales;
- the UI does not present 70% as a headline “chance of success”; detailed stage inputs sit under Advanced risk assumptions;
- a separate additional risk sensitivity defaults to 100% and can be used deliberately if another haircut is desired.

This is a **scenario architecture**, not a regulatory conclusion that approval after Phase II will occur.

## Valuation assumptions

- Forecast horizon: **2026–2047**
- Discount rate: **10.135%**
- Corporate tax: **20%**
- Additional risk sensitivity: **100% in the base case**
- Perpetual terminal value: **none**
- Financing affects cash balance/runway but is excluded from asset NPV.

## Corporate finance

The committed public scenario intentionally contains:

- no corporate cost lines;
- no financing events;
- no detailed salary schedule;
- no actual partner/acquisition terms.

Therefore public/demo “funding requirement” is **not the full DBP corporate funding requirement** until a private scenario file loads those items.

## Recommended review order

1. Define OPBT precisely and replace its incidence placeholder.
2. Refresh brain-metastasis epidemiology.
3. Validate the intended Phase-II commercialization/regulatory pathway and launch calendar.
4. Validate stage risk assumptions and decide whether any additional risk haircut is justified.
5. Validate country pricing, COGS, eligible population and penetration.
6. Replace Canada/Mexico/non-core EU regional proxies with country-specific assumptions where material.
7. Load approved aggregate corporate costs/financing privately and reconcile cash runway to the finance workbook.
8. Only then approve which outputs are appropriate for the public website.
