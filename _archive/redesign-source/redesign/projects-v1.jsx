// PROJECTS — V1
// Codex 02 · Portfolio. Mirrors services-v1 chrome (mast / meta / cover / band / eof)
// using the shared .codex-* classes from codex-shared.css.
// New: project grid (.pV1-grid) + status pills + CTA band.

const ProjectsV1 = () => {
  const { PROJECTS, Sigils } = window;

  const renderCtaIcon = (kind) => {
    if (kind === 'github') return Sigils.GitHub ? <Sigils.GitHub size={14} /> : <span>↗</span>;
    if (kind === 'flask')  return Sigils.Flask  ? <Sigils.Flask  size={14} stroke={1.6} /> : <span>↗</span>;
    return <span aria-hidden="true">→</span>;
  };

  return (
    <div className="codex pV1" data-screen-label="Projects — V1">
      {/* mast */}
      <div className="codex-mast">
        <span className="codex-mast-classification">FILE / OPEN — UNCLASSIFIED</span>
        <span>UNITY · AI · LAB / CODEX 02 · PROJECTS</span>
        <span>FOLIO 01 / 03</span>
      </div>

      {/* meta strip */}
      <dl className="codex-meta">
        {PROJECTS.meta.map((m, i) => (
          <div key={i}><dt>{m.dt}</dt><dd>{m.dd}</dd></div>
        ))}
      </dl>

      {/* cover */}
      <section className="codex-cover">
        <div className="codex-stamp codex-stamp-tr">{PROJECTS.header.kicker}</div>
        <div className="codex-stamp codex-stamp-bl">FOR PUBLIC REVIEW</div>
        <div className="codex-cover-fileno">FILE-02 · PROJECTS · v2026.04</div>
        <h1>{PROJECTS.header.title}</h1>
        <div className="codex-cover-rule" />
        <p className="codex-cover-lede">{PROJECTS.header.lede}</p>
      </section>

      {/* I · CATALOGUE */}
      <section className="codex-section">
        <div className="codex-band">
          <span><span className="codex-band-num">I</span> · CATALOGUE</span>
          <span className="codex-band-name">SIX WORKS</span>
          <span>FOLIO 02</span>
        </div>
        <div className="codex-section-head">
          <h2 className="codex-h">The portfolio.</h2>
          <p className="codex-section-lede">
            Six works on the bench. Status pills tell you whether you can use it
            today, whether it&rsquo;s in active development, or whether it&rsquo;s
            research we&rsquo;re still writing up.
          </p>
        </div>

        <div className="pV1-grid">
          {PROJECTS.projects.map((p) => {
            const Icon = Sigils && Sigils[p.icon];
            const isExternal = !!p.cta.external;
            return (
              <article key={p.slug} className={`pV1-card pV1-status-${p.status}`}>
                <div className="pV1-card-head">
                  <div className="pV1-card-iconcol">
                    <span className="pV1-card-num">{p.num}</span>
                    {Icon ? <Icon className="pV1-card-icon" size={48} stroke={1.5} /> : null}
                  </div>
                  <div className="pV1-card-titlecol">
                    <div className="pV1-card-titlerow">
                      <h3>{p.title}</h3>
                      <span className={`pV1-status pV1-status-tag-${p.status}`}>{p.statusLabel}</span>
                    </div>
                    <div className="pV1-card-tag">{p.tag}</div>
                  </div>
                </div>

                <p className="pV1-card-lede">{p.lede}</p>

                <ul className="pV1-card-bullets">
                  {p.bullets.map((b, i) => (
                    <li key={i}>
                      <span className="pV1-bullet-mark" aria-hidden="true">&rsaquo;</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="pV1-card-tagrow">
                  {p.tags.map((t, i) => <span key={i} className="pV1-tag">{t}</span>)}
                </div>

                <div className="pV1-card-foot">
                  <a
                    className="pV1-card-cta"
                    href={p.cta.href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                  >
                    <span>{p.cta.label}</span>
                    {renderCtaIcon(p.cta.icon)}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* II · CTA */}
      <section className="codex-section">
        <div className="codex-band">
          <span><span className="codex-band-num">II</span> · CALL</span>
          <span className="codex-band-name">COLLABORATE</span>
          <span>FOLIO 03</span>
        </div>
        <div className="pV1-cta">
          <h2 className="codex-h">{PROJECTS.cta.title}</h2>
          <p className="codex-section-lede">{PROJECTS.cta.lede}</p>
          <a className="pV1-cta-button" href={PROJECTS.cta.button.href}>
            <span>{PROJECTS.cta.button.label}</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      {/* eof */}
      <div className="codex-eof">
        <span><strong>END OF FILE</strong> · CODEX 02 · PROJECTS</span>
        <span>UNITY · AI · LAB</span>
        <span>v2026.04</span>
      </div>
    </div>
  );
};

window.ProjectsV1 = ProjectsV1;
