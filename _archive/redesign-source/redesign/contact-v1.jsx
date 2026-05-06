// CONTACT — V1
// Codex 02. Same chrome vocabulary as About V2 / Services V1.
// Reuses window.AboutShared.AboutContactForm + window.Sigils.

const ContactV1 = () => {
  const { CONTACT, AboutShared, Sigils } = window;
  const { AboutContactForm } = AboutShared;

  return (
    <div className="cV1" data-screen-label="Contact — V1">
      {/* ─────────────────────── classified mast */}
      <div className="cV1-mast">
        <span className="cV1-mast-classification">FILE / OPEN — UNCLASSIFIED</span>
        <span>UNITY · AI · LAB / CODEX 02 · CONTACT</span>
        <span>FOLIO 01 / 04</span>
      </div>

      {/* meta strip */}
      <dl className="cV1-meta">
        {CONTACT.meta.map((m, i) => (
          <div key={i}><dt>{m.dt}</dt><dd>{m.dd}</dd></div>
        ))}
      </dl>

      {/* ─────────────────────── cover */}
      <section className="cV1-cover">
        <div className="cV1-stamp cV1-stamp-tr">{CONTACT.header.kicker}</div>
        <div className="cV1-stamp cV1-stamp-bl">FOR HUMAN REPLY</div>
        <div className="cV1-cover-fileno">FILE-02 · CONTACT · v2026.04</div>
        <h1>{CONTACT.header.title}</h1>
        <div className="cV1-cover-rule" />
        <p className="cV1-cover-lede">{CONTACT.header.lede}</p>
      </section>

      {/* ─────────────────────── I · WHAT TO EXPECT */}
      <section className="cV1-section">
        <div className="cV1-band">
          <span><span className="cV1-band-num">I</span> · INTAKE</span>
          <span className="cV1-band-name">WHAT TO EXPECT</span>
          <span>FOLIO 02</span>
        </div>
        <div className="cV1-section-head">
          <h2 className="cV1-h">{CONTACT.expect.title}</h2>
          <p className="cV1-section-lede">{CONTACT.expect.lede}</p>
        </div>
        <div className="cV1-phases">
          {CONTACT.expect.rows.map((p) => (
            <div key={p.roman} className="cV1-phase">
              <div className="cV1-phase-num">{p.roman}</div>
              <h4>{p.name}</h4>
              <div className="cV1-phase-sub">{p.sub}</div>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────── II · OTHER CHANNELS */}
      <section className="cV1-section">
        <div className="cV1-band">
          <span><span className="cV1-band-num">II</span> · CHANNELS</span>
          <span className="cV1-band-name">OTHER WAYS IN</span>
          <span>FOLIO 03</span>
        </div>
        <div className="cV1-section-head">
          <h2 className="cV1-h">{CONTACT.channels.title}</h2>
          <p className="cV1-section-lede">{CONTACT.channels.lede}</p>
        </div>

        <div className="cV1-channels">
          {CONTACT.channels.items.map((ch) => {
            const Icon = Sigils && Sigils[ch.icon];
            const external = /^https?:/.test(ch.href);
            return (
              <a
                key={ch.slug}
                className="cV1-channel"
                href={ch.href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
              >
                <div className="cV1-channel-iconcol">
                  <span className="cV1-channel-num">{ch.num}</span>
                  {Icon ? <Icon className="cV1-channel-icon" size={44} /> : null}
                </div>
                <div className="cV1-channel-body">
                  <h3>{ch.title}</h3>
                  <div className="cV1-channel-sub">{ch.sub}</div>
                  <p>{ch.body}</p>
                  <span className="cV1-channel-cta">{ch.cta} ↗</span>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────── III · THE FORM */}
      <section className="cV1-section">
        <div className="cV1-band">
          <span><span className="cV1-band-num">III</span> · DISPATCH</span>
          <span className="cV1-band-name">THE FORM</span>
          <span>FOLIO 04</span>
        </div>
        <div className="cV1-section-head">
          <h2 className="cV1-h">{CONTACT.form.title}</h2>
        </div>
        <div className="cV1-contact-grid">
          <aside className="cV1-contact-aside">
            <div className="cV1-contact-aside-kicker">{CONTACT.form.kicker}</div>
            <p>{CONTACT.form.lede}</p>
            <div className="cV1-contact-aside-mail">{CONTACT.form.inbox}</div>
            <ul className="cV1-contact-aside-points">
              <li>No tracking pixels.</li>
              <li>No third-party form service.</li>
              <li>No copies retained on this page.</li>
            </ul>
          </aside>
          <div>
            <AboutContactForm
              inbox={CONTACT.form.inbox}
              reasons={CONTACT.form.reasons}
              sources={CONTACT.form.sources}
              variant="plain"
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────── eof */}
      <div className="cV1-eof">
        <span><strong>END OF FILE</strong> · CODEX 02 · CONTACT</span>
        <span>UNITY · AI · LAB</span>
        <span>v2026.04</span>
      </div>
    </div>
  );
};

window.ContactV1 = ContactV1;
