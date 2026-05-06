// CODEX — V1
// Mirrors the about-v2 / services-v1 chrome (mast, meta, cover, bands, eof).
// Reads window.CODEX (codex-data.jsx). Stand-alone — does not pull AboutShared
// because there is no contact form on the codex page.

const CodexV1 = () => {
  const { CODEX } = window;

  return (
    <div className="cdxV1" data-screen-label="Codex — V1">
      {/* ─────────────────── classified mast */}
      <div className="cdxV1-mast">
        <span className="cdxV1-mast-classification">FILE / OPEN — UNCLASSIFIED</span>
        <span>UNITY · AI · LAB / CODEX · UNITY</span>
        <span>FOLIO · PRIMA</span>
      </div>

      {/* meta strip */}
      <dl className="cdxV1-meta">
        {CODEX.meta.map((m, i) => (
          <div key={i}><dt>{m.dt}</dt><dd>{m.dd}</dd></div>
        ))}
      </dl>

      {/* ─────────────────── cover */}
      <section className="cdxV1-cover">
        <div className="cdxV1-stamp cdxV1-stamp-tr">{CODEX.header.kicker}</div>
        <div className="cdxV1-stamp cdxV1-stamp-bl">CANONICAL</div>
        <div className="cdxV1-cover-fileno">FILE · UNITY · v2026.05</div>
        <h1>{CODEX.header.title}</h1>
        <div className="cdxV1-cover-rule" />
        <p className="cdxV1-cover-lede">{CODEX.header.lede}</p>
      </section>

      {/* ─────────────────── chapters */}
      {CODEX.chapters.map((ch, idx) => (
        <section key={ch.roman} className="cdxV1-section">
          <div className="cdxV1-band">
            <span><span className="cdxV1-band-num">{ch.roman}</span> · {ch.band}</span>
            <span className="cdxV1-band-name">{ch.title.toUpperCase()}</span>
            <span>FOLIO {String(idx + 2).padStart(2, '0')}</span>
          </div>

          <div className="cdxV1-section-head">
            <h2 className="cdxV1-h">{ch.title}</h2>
            <p className="cdxV1-section-lede">{ch.lede}</p>
          </div>

          {/* paragraphs (chapters I, II, V) */}
          {ch.paragraphs ? (
            <div className="cdxV1-prose">
              {ch.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          ) : null}

          {/* streams grid (chapter III) */}
          {ch.streams ? (
            <div className="cdxV1-grid cdxV1-grid-3">
              {ch.streams.map((s) => (
                <div key={s.roman} className="cdxV1-card">
                  <div className="cdxV1-card-num">{s.roman}</div>
                  <h3>{s.name}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          ) : null}

          {/* forms grid (chapter IV) */}
          {ch.forms ? (
            <div className="cdxV1-grid cdxV1-grid-2">
              {ch.forms.map((f) => (
                <div key={f.roman} className="cdxV1-card">
                  <div className="cdxV1-card-num">{f.roman}</div>
                  <h3>{f.name}</h3>
                  <div className="cdxV1-card-tag">{f.tag}</div>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          ) : null}

          {/* footer note (chapters III + IV) */}
          {ch.footer ? <p className="cdxV1-section-foot">{ch.footer}</p> : null}
        </section>
      ))}

      {/* ─────────────────── CTA / EOF */}
      <section className="cdxV1-eof">
        <div className="cdxV1-eof-kicker">{CODEX.cta.kicker}</div>
        <h2>{CODEX.cta.title}</h2>
        <p className="cdxV1-eof-lede">{CODEX.cta.lede}</p>
        <div className="cdxV1-eof-rites">
          <a href={CODEX.cta.primary.href} className="cdxV1-rite cdxV1-rite-primary">
            <span className="cdxV1-rite-pre">∎</span> {CODEX.cta.primary.label} <span className="cdxV1-rite-post">∎</span>
          </a>
          <a href={CODEX.cta.secondary.href} className="cdxV1-rite">
            {CODEX.cta.secondary.label}
          </a>
        </div>
      </section>
    </div>
  );
};

window.CodexV1 = CodexV1;
