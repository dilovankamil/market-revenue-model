# SI-053 model — public release gate

Do not treat a green software build as approval to publish the model. The following checks should be completed before using a public-facing version externally.

## 1. Scientific / epidemiology

- [ ] Validate each incidence rate against the cited source and document the exact population/year/definition used.
- [ ] Validate surgical-eligibility assumptions by indication and geography.
- [ ] Decide whether OPBT should remain a single aggregate indication or be split into clinically meaningful tumor groups.
- [ ] Refresh the historical brain-metastasis incidence basis before using the value in external quantitative claims.
- [ ] Confirm population growth assumptions remain appropriate or replace static growth rates with a maintained population series.

## 2. Commercial assumptions

- [ ] Management approves each public treatment-price assumption.
- [ ] Management approves peak penetration and ramp assumptions.
- [ ] Validate country launch dates against the intended regulatory/commercial strategy.
- [ ] Validate the modeled Phase-II commercialization gate with current regulatory strategy; do not imply approval is assured.
- [ ] Validate LoE/patent-extension assumptions with current IP/regulatory advice.
- [ ] Validate COGS and commercial OpEx assumptions before showing profit/cash metrics publicly.
- [ ] Replace Canada, Mexico and non-core EU planning proxies with country-specific assumptions where material.
- [ ] Validate India/China commercial assumptions before enabling them in an external scenario.

## 3. Development / valuation

- [ ] Reconcile the June 2027 Phase-I start and all subsequent stage dates against the current approved development plan.
- [ ] Reconcile coarse public development costs against the current approved programme budget.
- [ ] Review advanced stage-risk inputs; they are sensitivities, not headline success forecasts.
- [ ] Confirm confirmatory post-launch studies are treated correctly in cost and valuation logic.
- [ ] Review the additional risk multiplier and avoid double-counting risk.
- [ ] Confirm the explicit valuation horizon is long enough to capture the intended post-LoE erosion period.
- [ ] Validate tax assumptions and whether public NPV should be shown pre- or post-tax.

## 4. Transaction / deal explorer

- [ ] Keep real DBP partner terms, negotiation ranges, acquisition expectations and confidential financing inputs out of the public repository.
- [ ] Keep Deal Explorer internal/private by default.
- [ ] Review milestone timing/probability and royalty valuation methodology before internal decision use.

## 5. Legal / communications

- [ ] Maintain an external-use disclaimer stating that outputs are scenario estimates and not financial guidance or forecasts.
- [ ] Legal/regulatory review of all claims, labels and descriptions used on the public page.
- [ ] Confirm citations can legally be linked/displayed and wording does not overstate what the source establishes.
- [ ] Confirm company branding, logo use, colors and website copy with DBP communications.

## 6. Privacy / security

- [ ] Inspect repository history for confidential values before making a rebuilt branch the public default.
- [ ] Confirm private scenario JSON remains client-side only.
- [ ] Do not add API keys, analytics secrets, unpublished study data or identifiable patient data to the repository.
- [ ] If an internal deployment is added, enforce access control server-side; a hidden tab is not access control.

## 7. Technical release

- [ ] `npm ci` succeeds from the committed lockfile.
- [ ] Automated tests pass.
- [ ] Production build succeeds.
- [ ] Test current Chrome, Safari/iOS, Edge and Firefox.
- [ ] Test mobile/tablet layout and keyboard navigation.
- [ ] Verify the bundled SVG globe and country clicks on desktop and mobile.
- [ ] Verify EU27 parent selection, indeterminate state and individual deselection.
- [ ] Verify rollout schedule matches the animation year-for-year.
- [ ] Verify scenario import rejects malformed files and does not execute supplied content.
- [ ] Verify all external links and source URLs.
- [ ] Review bundle size and loading performance.

## 8. Deployment

- [ ] Review the draft PR and merge only after modelling/public-content approval.
- [ ] For GitHub Pages preview/hosting, set **Settings → Pages → Source: GitHub Actions**.
- [ ] For DBP website hosting, deploy the compiled `dist/` directory under the approved domain/subpath.
- [ ] Keep a rollback artifact/tag for every public release.
