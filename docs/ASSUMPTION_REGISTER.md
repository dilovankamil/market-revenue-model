# Base-case assumption register

This document is a review aid for the committed **public/demo** scenario. It is not an endorsement of the values. A value should not be treated as publication-ready merely because it exists in code.

Status key:

- **Workbook/literature lineage** — inherited from the finance workbook and/or a linked literature source; still requires exact reconciliation.
- **Scenario choice** — management modelling choice rather than an observed fact.
- **Placeholder / high-priority review** — particularly important to replace or justify before external use.

## Epidemiology

| Assumption | Base value | Status | Review note |
|---|---:|---|---|
| GBM incidence — North America | 3.42296 / 100k | Workbook/literature lineage | Reconcile exact definition/year with linked source. |
| GBM incidence — Europe | 4.52 / 100k | Workbook/literature lineage | Reconcile exact geography/age standardisation with linked source. |
| GBM incidence — Asia-Pacific/Japan proxy | 2.1 / 100k | Workbook/literature lineage | Japan-derived value is currently used as the Asia-Pacific proxy. |
| Brain metastasis incidence | 19.82683 / 100k | **Placeholder / high-priority review** | Historical source basis; refresh with contemporary epidemiology before external quantitative use. |
| OPBT incidence | Equal to GBM incidence by region | **Placeholder / high-priority review** | This is not a defensible definition of “all other primary brain tumors”; OPBT needs a proper tumor-group definition and incidence model. |

## Surgical eligibility

| Market | GBM | Brain metastasis | OPBT | Status |
|---|---:|---:|---:|---|
| United States | 73.0% | 25.0% | 33.0% | Scenario / workbook lineage |
| EU4 + UK | 74.1% | 25.0% | 33.0% | Scenario / workbook lineage |
| Japan | 88.6% | 25.0% | 33.0% | Scenario / workbook lineage |
| India | 50.0% | 15.0% | 33.0% | Scenario choice |
| China | 55.0% | 18.0% | 33.0% | Scenario choice |

**Priority:** define exactly what “surgery eligible” means: resection performed, resection clinically indicated, gross/partial resection, or addressable intracavitary placement population.

## Base population / growth

| Market | Base population | Base year | Annual growth | Status |
|---|---:|---:|---:|---|
| United States | 353.05M | 2028 | +0.543% | Workbook lineage |
| Germany | 84.5M | 2028 | +0.105% | EU split preserving regional scale approximately |
| France | 68.3M | 2028 | +0.105% | EU split preserving regional scale approximately |
| Italy | 58.5M | 2028 | +0.105% | EU split preserving regional scale approximately |
| Spain | 49.5M | 2028 | +0.105% | EU split preserving regional scale approximately |
| United Kingdom | 67.8M | 2028 | +0.105% | EU split preserving regional scale approximately |
| Japan | 121.221M | 2028 | -0.52% | Workbook lineage |
| India | 1.48B | 2028 | +0.75% | **Scenario / review** |
| China | 1.40B | 2028 | -0.15% | **Scenario / review** |

The globe can retrieve current national population for newly added countries through the World Bank, but population alone does not validate the rest of that market's assumptions.

## Commercial assumptions

| Market | Price | Peak share | Accessible population | GBM launch | LoE | Base access route |
|---|---:|---:|---:|---:|---:|---|
| United States | $75,000 | 30% | 100% | 2030 | 2037 | Commercial |
| Germany/France/Italy/Spain/UK | $75,000 | 30% | 100% | 2031 | 2040 | Commercial |
| Japan | $75,000 | 30% | 100% | 2033 | 2040 | Commercial |
| India | $25,000 | 15% | 25% | 2032 | 2040 | Named-patient scenario |
| China | $35,000 | 15% | 30% | 2033 | 2040 | None |

Portfolio assumptions:

- Adoption ramp: **6 years** to peak share.
- Post-LoE erosion: **15% per year**.
- Patent extension: **0 years** in base case.
- Commercial OpEx: **8% of revenue**.
- COGS: **$500 per treatment**.

### High-priority commercial reviews

1. **$500 COGS is extremely low relative to $75,000 pricing** and creates near-pharmaceutical-pure gross margins before commercial/corporate costs. Reconcile with manufacturing, fill/finish, release, packaging, distribution and wastage assumptions.
2. Country pricing should reflect the intended price concept (list, net, ex-manufacturer, transfer price, or realised revenue). A single US/EU/Japan price is useful for sensitivity analysis but weak as a public “forecast.”
3. Peak share and ramp require an adoption rationale: eligible neurosurgical centres, surgeon uptake, contraindications, reimbursement, competitive products and capacity.
4. LoE should be tied to an IP/regulatory exclusivity schedule rather than a single generic year where possible.

## Early-access / named-patient — India

Base illustrative assumptions:

- Start: **2027**
- Starting centres: **4**
- Centre growth: **40% / year**
- Maximum centres: **35**
- Eligible patients per centre per year: **20**
- Conversion: **50%**
- Price: **$25,000**

These are operating-scenario inputs, **not evidence that an Indian named-patient route is available or that hospitals will achieve this throughput**.

## Development programme

| Indication | Stage | Dates | Public/demo cost | Stage success input |
|---|---|---|---:|---:|
| GBM | Phase I | Jun 2026 – May 2028 | $4.4M | 100% |
| GBM | Phase II | Jan 2029 – Aug 2030 | $24.7M | 70% |
| GBM | Phase III | Dec 2030 – Nov 2032 | $45.0M | 65% |
| Brain metastases | Bridging Phase II | Mar 2031 – May 2032 | $9.7M | 70% |
| Brain metastases | Phase III | Nov 2032 – Oct 2034 | $44.7M | 65% |
| OPBT | Bridging Phase II | Mar 2031 – May 2032 | $9.7M | 70% |
| OPBT | Phase III | Nov 2032 – Oct 2034 | $44.7M | 65% |

### Timing warning

The commercial scenario currently permits launch before the configured programme ends. For example, US GBM launch is 2030 while the configured GBM Phase III runs to late 2032. The validation engine flags this explicitly. It can represent an intended accelerated/conditional approval path, but it must not happen accidentally.

## Valuation assumptions

- Forecast horizon: **2026–2047**
- Discount rate: **10.135%**
- Corporate tax: **20%**
- Additional commercial risk multiplier: **70%**
- Perpetual terminal value: **none**

Stage-adjusted commercial success from the configured GBM stages is currently:

`100% × 70% × 65% = 45.5%`

The additional 70% risk multiplier is then applied to risk-adjusted commercial contribution. This can double-count uncertainty if the 70% was originally intended to represent clinical success. Management should define what this second risk factor is meant to represent (commercial/regulatory/forecast risk) or set it to 100%.

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
3. Reconcile launch/development/regulatory pathway assumptions.
4. Decide what stage probabilities and the additional 70% risk multiplier each represent.
5. Validate country pricing and COGS.
6. Validate India/China access assumptions.
7. Load approved aggregate corporate costs/financing privately and reconcile cash runway to the finance workbook.
8. Only then approve which outputs are appropriate for the public website.
