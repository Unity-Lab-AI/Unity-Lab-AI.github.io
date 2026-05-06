// APPS — V1
// Codex 04 · Apps. 8-card grid (3 across on desktop, 2 on tablet, 1 on mobile).

const AppsV1 = () => {
  const { APPS_DATA, Sigils } = window;

  return (
    <div className="codex apV1" data-screen-label="Apps — V1">
      {/* mast */}
      <div className="codex-mast">
        <span className="codex-mast-classification">FILE / OPEN — UNCLASSIFIED</span>
        <span>UNITY · AI · LAB / CODEX 04 · APPS</span>
        <span>FOLIO 01 / 03</span>
      </div>

      <dl className="codex-meta">
        {APPS_DATA.meta.map((m, i) => (
          <div key={i}><dt>{m.dt}</dt><dd>{m.dd}</dd></div>
        ))}
      </dl>

      {/* cover */}
      <section className="codex-cover">
        <div className="codex-stamp codex-stamp-tr">{APPS_DATA.header.kicker}</div>
        <div className="codex-stamp codex-stamp-bl">FREE · NO SIGNUP</div>
        <div className="codex-cover-fileno">FILE-04 · APPS · v2026.04</div>
        <h1>{APPS_DATA.header.title}</h1>
        <div className="codex-cover-rule" />
        <p className="codex-cover-lede">{APPS_DATA.header.lede}</p>
      </section>

      {/* I · COLLECTION */}
      <section className="codex-section">
        <div className="codex-band">
          <span><span className="codex-band-num">I</span> · COLLECTION</span>
          <span className="codex-band-name">EIGHT APPS</span>
          <span>FOLIO 02</span>
        </div>
        <div className="codex-section-head">
          <h2 className="codex-h">The collection.</h2>
          <p className="codex-section-lede">
            Each app launches in a new context. Free to use, no account
            required. Powered by the public Pollinations gateway.
          </p>
        </div>

        <div className="apV1-grid">
          {APPS_DATA.apps.map((a) => {
            const Icon = Sigils && Sigils[a.icon];
            return (
              <article key={a.slug} className="apV1-card">
                <div className="apV1-card-head">
                  <div className="apV1-card-iconcol">
                    {Icon ? <Icon size={42} stroke={1.5} /> : <span className="apV1-card-num-fallback">{a.num}</span>}
                  </div>
                  <div className="apV1-card-num">{a.num}</div>
                </div>

                <h3>{a.title}</h3>
                <div className="apV1-card-tag">{a.tag}</div>
                <p className="apV1-card-lede">{a.lede}</p>

                <div className="apV1-card-tags">
                  {a.tags.map((t, i) => <span key={i} className="apV1-tag">{t}</span>)}
                </div>

                <div className="apV1-card-foot">
                  <a className="apV1-card-cta" href={a.cta.href}>
                    <span>{a.cta.label}</span>
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* II · CTA */}
      <section className="codex-section">
        <div className="apV1-cta">
          <h2 className="codex-h">{APPS_DATA.cta.title}</h2>
          <p className="codex-section-lede" style={{ margin: '0 auto 32px' }}>{APPS_DATA.cta.lede}</p>
          <div className="apV1-cta-actions">
            <a className="apV1-btn apV1-btn-primary" href={APPS_DATA.cta.primary.href}>
              <span>{APPS_DATA.cta.primary.label}</span>
              <span aria-hidden="true">→</span>
            </a>
            <a className="apV1-btn apV1-btn-secondary" href={APPS_DATA.cta.secondary.href}>
              <span>{APPS_DATA.cta.secondary.label}</span>
            </a>
          </div>
        </div>
      </section>

      {/* eof */}
      <div className="codex-eof">
        <span><strong>END OF FILE</strong> · CODEX 04 · APPS</span>
        <span>UNITY · AI · LAB</span>
        <span>v2026.04</span>
      </div>
    </div>
  );
};

window.AppsV1 = AppsV1;
