# SI-053 model — public release gate

Do not treat a green software build as approval to publish the model. The following checks should be completed before merging/deploying a public-facing version.

## 1. Scientific / epidemiology

- [ ] Validate each incidence rate against the cited source and document the exact population/year/definition used.
- [ ] Validate surgical-eligibility assumptions by indication and geography.
- [ ] Decide whether OPBT should remain a single aggregate indication or be split into clinically meaningful tumor groups.
- [ ] Refresh the historical brain-metastasis incidence basis before using the value in external quantitative claims.
- [ ] Confirm that population growth assumptions remain appropriate or replace static growth rates with a maintained population series.

## 2. Commercial assumptions

- [ ] Management approves each public treatment-price assumption.
- [ ] Management approves peak penetration and ramp assumptions.
- [ ] Validate country launch dates against the intended regulatory/commercial strategy.
- [ ] Validate LoE/patent-extension assumptions with current IP/regulatory advice.
- [ ] Validate COGS and commercial OpEx assumptions before showing profit/cash metrics publicly.
- [ ] Review all globe-added proxy markets before any screenshot, export or presentation is used externally.

## 3. Development / valuation

- [ ] Reconcile public clinical-stage dates and coarse costs against the current approved development plan.
- [ ] Replace placeholder stage-success probabilities with approved assumptions or remove rNPV from the public version.
- [ ] Review the additional risk multiplier and avoid double-counting risk.
- [ ] Confirm the explicit valuation horizon is long enough to capture the intended post-LoE erosion period.
- [ ] Validate tax assumptions and whether public NPV should be shown pre- or post-tax.

## 4. Early access / named-patient scenarios

- [ ] Obtain jurisdiction-specific regulatory/legal confirmation before implying an early-access route is available.
- [ ] Treat centre count, patient throughput and conversion as scenario inputs, not market facts.
- [ ] Validate India/China accessible-population assumptions.
- [ ] Confirm subnational population layers are presented as decompositions only and cannot double-count national revenue.

## 5. Transaction / deal explorer

- [ ] Keep real DBP partner terms, negotiation ranges, acquisition expectations and confidential financing inputs out of the public repository.
- [ ] Decide whether the Deal Explorer exists at all in the public build; preferred default is internal/private deployment only.
- [ ] Review milestone timing/probability and royalty valuation methodology before internal decision use.

## 6. Legal / communications

- [ ] Add an external-use disclaimer stating that outputs are scenario estimates and not financial guidance or forecasts.
- [ ] Legal/regulatory review of all claims, labels and descriptions used on the public page.
- [ ] Confirm citations can legally be linked/displayed and that wording does not overstate what the source establishes.
- [ ] Confirm company branding, logo use, colors and website copy with DBP communications.

## 7. Privacy / security

- [ ] Inspect repository history for confidential values before making the rebuilt branch the public default.
- [ ] Confirm private scenario JSON remains client-side only.
- [ ] Do not add API keys, analytics secrets, unpublished study data or identifiable patient data to the repository.
- [ ] If an internal deployment is added, enforce access control server-side; a hidden tab is not access control.

## 8. Technical release

- [ ] `npm ci` succeeds from the committed lockfile.
- [ ] Automated tests pass.
- [ ] Production build succeeds.
- [ ] Test current Chrome, Safari/iOS, Edge and Firefox.
- [ ] Test mobile/tablet layout and keyboard navigation.
- [ ] Test the globe when external World Bank/GeoJSON services are unavailable.
- [ ] Verify scenario import rejects malformed files and does not execute supplied content.
- [ ] Verify all external links and source URLs.
- [ ] Review bundle size and loading performance.
- [ ] Configure website error monitoring/analytics only after privacy review.

## 9. Deployment

- [ ] Review the draft PR and merge only after modelling/public-content approval.
- [ ] For GitHub Pages preview/hosting, set **Settings → Pages → Source: GitHub Actions**.
- [ ] For DBP website hosting, deploy the compiled `dist/` directory under the approved domain/subpath.
- [ ] Keep a rollback artifact/tag for every public release.
