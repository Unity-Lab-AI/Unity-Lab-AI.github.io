// AI — V1
// Codex 03 · AI Experience. Single demo hero (Coming Soon panel dropped per
// user direction) + a "what to expect" four-card caveats section + CTA.

const AiV1 = () => {
  const { AI_DATA, Sigils } = window;
  const HeroIcon = Sigils && Sigils[AI_DATA.hero.icon];

  return (
    <div className="codex aiV1" data-screen-label="AI — V1">
      {/* mast */}
      <div className="codex-mast">
        <span className="codex-mast-classification">FILE / OPEN — UNCLASSIFIED</span>
        <span>UNITY · AI · LAB / CODEX 03 · AI EXPERIENCE</span>
        <span>FOLIO 01 / 03</span>
      </div>

      <dl className="codex-meta">
        {AI_DATA.meta.map((m, i) => (
          <div key={i}><dt>{m.dt}</dt><dd>{m.dd}</dd></div>
        ))}
      </dl>

      {/* cover */}
      <section className="codex-cover">
        <div className="codex-stamp codex-stamp-tr">{AI_DATA.header.kicker}</div>
        <div className="codex-stamp codex-stamp-bl">DEMO LIVE</div>
        <div className="codex-cover-fileno">FILE-03 · AI · v2026.04</div>
        <h1>{AI_DATA.header.title}</h1>
        <div className="codex-cover-rule" />
        <p className="codex-cover-lede">{AI_DATA.header.lede}</p>
      </section>

      {/* I · DEMO HERO */}
      <section className="codex-section">
        <div className="codex-band">
          <span><span className="codex-band-num">I</span> · DEMO</span>
          <span className="codex-band-name">LIVE ACCESS</span>
          <span>FOLIO 02</span>
        </div>

        <div className="aiV1-hero">
          <div className="aiV1-hero-iconcol">
            {HeroIcon ? <HeroIcon size={96} stroke={1.4} /> : null}
            <div className="aiV1-hero-kicker">{AI_DATA.hero.kicker}</div>
          </div>
          <div className="aiV1-hero-body">
            <h2 className="codex-h">{AI_DATA.hero.title}</h2>
            <p className="codex-section-lede">{AI_DATA.hero.lede}</p>

            <ul className="aiV1-hero-bullets">
              {AI_DATA.hero.bullets.map((b, i) => (
                <li key={i}><span className="aiV1-bullet-mark">▸</span>{b}</li>
              ))}
            </ul>

            <div className="aiV1-hero-actions">
              <a className="aiV1-btn aiV1-btn-primary" href={AI_DATA.hero.primary.href}>
                <span>{AI_DATA.hero.primary.label}</span>
                <span aria-hidden="true">→</span>
              </a>
              <a className="aiV1-btn aiV1-btn-secondary" href={AI_DATA.hero.secondary.href}>
                <span>{AI_DATA.hero.secondary.label}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* II · WHAT TO EXPECT */}
      <section className="codex-section">
        <div className="codex-band">
          <span><span className="codex-band-num">II</span> · NOTES</span>
          <span className="codex-band-name">WHAT TO EXPECT</span>
          <span>FOLIO 03</span>
        </div>
        <div className="codex-section-head">
          <h2 className="codex-h">{AI_DATA.caveats.title}</h2>
          <p className="codex-section-lede">{AI_DATA.caveats.lede}</p>
        </div>

        <div className="aiV1-caveats">
          {AI_DATA.caveats.items.map((it) => (
            <article key={it.kicker} className="aiV1-caveat">
              <div className="aiV1-caveat-num">{it.kicker}</div>
              <h4>{it.title}</h4>
              <p>{it.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* III · CTA */}
      <section className="codex-section">
        <div className="aiV1-cta">
          <h2 className="codex-h">{AI_DATA.cta.title}</h2>
          <p className="codex-section-lede" style={{ margin: '0 auto 32px' }}>{AI_DATA.cta.lede}</p>
          <div className="aiV1-cta-actions">
            <a className="aiV1-btn aiV1-btn-primary" href={AI_DATA.cta.primary.href}>
              <span>{AI_DATA.cta.primary.label}</span>
              <span aria-hidden="true">→</span>
            </a>
            <a className="aiV1-btn aiV1-btn-secondary" href={AI_DATA.cta.secondary.href}>
              <span>{AI_DATA.cta.secondary.label}</span>
            </a>
          </div>
        </div>
      </section>

      {/* eof */}
      <div className="codex-eof">
        <span><strong>END OF FILE</strong> · CODEX 03 · AI EXPERIENCE</span>
        <span>UNITY · AI · LAB</span>
        <span>v2026.04</span>
      </div>
    </div>
  );
};

window.AiV1 = AiV1;
