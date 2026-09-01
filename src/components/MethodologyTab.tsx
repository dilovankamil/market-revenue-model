import { methodologySources } from '../model/sources';

const statusLabel = (status: 'literature' | 'workbook' | 'scenario') => ({
  literature: 'Literature',
  workbook: 'Finance workbook',
  scenario: 'Scenario input',
}[status]);

export function MethodologyTab() {
  const categories = Array.from(new Set(methodologySources.map((source) => source.category)));

  return (
    <section className="methodology-v7">
      <div className="panel methodology-hero-v7">
        <div>
          <span className="section-kicker">Model governance</span>
          <h3>What is sourced, what is assumed</h3>
          <p>The model separates literature/workbook lineage from management scenario choices. A number on the website is not automatically a validated market fact.</p>
        </div>
        <div className="methodology-principles">
          <div><strong>Population & epidemiology</strong><span>Core markets have source lineage; newly added regional markets are planning proxies until country-specific inputs are validated.</span></div>
          <div><strong>Commercial model</strong><span>Price, accessible population, launch timing, adoption and peak share are editable assumptions rather than forecasts.</span></div>
          <div><strong>Valuation</strong><span>Explicit forecast horizon, no perpetual terminal value. Revenue risk is applied through the modeled pre-launch commercialization gate.</span></div>
        </div>
      </div>

      <div className="methodology-category-stack">
        {categories.map((category) => {
          const sources = methodologySources.filter((source) => source.category === category);
          return (
            <section className="panel methodology-category-card" key={category}>
              <div className="methodology-category-heading"><span className="section-kicker">{category}</span><strong>{sources.length} source{sources.length === 1 ? '' : 's'}</strong></div>
              <div className="methodology-source-list">
                {sources.map((source) => (
                  <article className="methodology-source-row" key={source.id}>
                    <div className="methodology-source-main">
                      <div className="methodology-source-title">
                        {source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a> : <strong>{source.label}</strong>}
                        <span className={`source-status source-${source.status}`}>{statusLabel(source.status)}</span>
                      </div>
                      <p>{source.note}</p>
                    </div>
                    <div className="methodology-applies"><span>Applies to</span><strong>{source.appliesTo}</strong></div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="panel methodology-caveat-v7">
        <span className="section-kicker">High-priority review</span>
        <p>Brain-metastasis incidence is currently a regional planning proxy, while other primary brain tumors temporarily reuse the GBM incidence structure. South America, MENA, South Asia, East/Southeast Asia and Oceania also contain country-level planning proxies. These inputs must be replaced or validated before the corresponding outputs are used externally.</p>
      </div>
    </section>
  );
}
