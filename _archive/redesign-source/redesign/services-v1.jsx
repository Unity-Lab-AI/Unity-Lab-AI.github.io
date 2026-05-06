// SERVICES — V1
// Mirrors about-v2 chrome (mast, meta, cover, bands, mission card, eof).
// New components: phases grid, services grid + dossier modal,
// contact split with per-service prefill.
//
// Reads window.SERVICES (services-data.jsx) and reuses
// window.AboutShared.AboutContactForm + window.Sigils for icons.

const ServicesV1 = () => {
  const { SERVICES, AboutShared, Sigils } = window;
  const { AboutContactForm } = AboutShared;

  const [pickedService, setPickedService] = React.useState(null);
  const [prefill, setPrefill] = React.useState({ reason: '', subject: '', message: '' });
  const formRef = React.useRef(null);

  const inquire = (svc) => {
    setPrefill({
      reason: svc.inquire.reason,
      subject: svc.inquire.subject,
      message: svc.inquire.message,
    });
    setPickedService(null);
    // scroll to the form on the same page
    requestAnimationFrame(() => {
      if (formRef.current) {
        const top = formRef.current.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  };

  // Esc closes the dossier modal
  React.useEffect(() => {
    if (!pickedService) return;
    const onKey = (e) => { if (e.key === 'Escape') setPickedService(null); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [pickedService]);

  return (
    <div className="sV1" data-screen-label="Services — V1">
      {/* ─────────────────────── classified mast */}
      <div className="sV1-mast">
        <span className="sV1-mast-classification">FILE / OPEN — UNCLASSIFIED</span>
        <span>UNITY · AI · LAB / CODEX 01 · SERVICES</span>
        <span>FOLIO 01 / 04</span>
      </div>

      {/* meta strip */}
      <dl className="sV1-meta">
        {SERVICES.meta.map((m, i) => (
          <div key={i}><dt>{m.dt}</dt><dd>{m.dd}</dd></div>
        ))}
      </dl>

      {/* ─────────────────────── cover */}
      <section className="sV1-cover">
        <div className="sV1-stamp sV1-stamp-tr">{SERVICES.header.kicker}</div>
        <div className="sV1-stamp sV1-stamp-bl">FOR INTERNAL REVIEW</div>
        <div className="sV1-cover-fileno">FILE-01 · SERVICES · v2026.04</div>
        <h1>{SERVICES.header.title}</h1>
        <div className="sV1-cover-rule" />
        <p className="sV1-cover-lede">{SERVICES.header.lede}</p>
      </section>

      {/* ─────────────────────── I · HOW WE WORK */}
      <section className="sV1-section">
        <div className="sV1-band">
          <span><span className="sV1-band-num">I</span> · METHOD</span>
          <span className="sV1-band-name">HOW WE WORK</span>
          <span>FOLIO 02</span>
        </div>
        <div className="sV1-section-head">
          <h2 className="sV1-h">{SERVICES.howWeWork.title}</h2>
          <p className="sV1-section-lede">{SERVICES.howWeWork.lede}</p>
        </div>
        <div className="sV1-phases">
          {SERVICES.howWeWork.phases.map((p) => (
            <div key={p.roman} className="sV1-phase">
              <div className="sV1-phase-num">{p.roman}</div>
              <h4>{p.name}</h4>
              <div className="sV1-phase-sub">{p.sub}</div>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────── II · SERVICES GRID */}
      <section className="sV1-section">
        <div className="sV1-band">
          <span><span className="sV1-band-num">II</span> · DISCIPLINES</span>
          <span className="sV1-band-name">THE SEVEN</span>
          <span>FOLIO 03</span>
        </div>
        <div className="sV1-section-head">
          <h2 className="sV1-h">Seven engagements.</h2>
          <p className="sV1-section-lede">
            Each card opens a dossier — scope, deliverables, and an inquire button
            that prefills the form below with the right context.
          </p>
        </div>

        <div className="sV1-grid">
          {SERVICES.services.map((svc) => {
            const Icon = Sigils && Sigils[svc.icon];
            return (
              <button
                key={svc.slug}
                type="button"
                className="sV1-card"
                onClick={() => setPickedService(svc)}
                aria-label={`Open dossier for ${svc.title}`}
              >
                <div className="sV1-card-iconcol">
                  <span className="sV1-card-num">{svc.num}</span>
                  {Icon ? <Icon className="sV1-card-icon" size={48} /> : null}
                </div>
                <div className="sV1-card-body">
                  <div className="sV1-card-titlerow">
                    <h3>{svc.title}</h3>
                    {svc.badge ? <span className="sV1-card-badge">{svc.badge}</span> : null}
                  </div>
                  <div className="sV1-card-tag">{svc.tag}</div>
                  <p className="sV1-card-lede">{svc.lede}</p>
                  <ul className="sV1-card-bullets">
                    {svc.bullets.slice(0, 3).map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                  <div className="sV1-card-cta-row">
                    <span className="sV1-card-cta">Open dossier →</span>
                    <span
                      className="sV1-card-inquire"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); inquire(svc); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation(); e.preventDefault(); inquire(svc);
                        }
                      }}
                    >
                      Inquire
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────── III · CONTACT */}
      <section className="sV1-section" ref={formRef}>
        <div className="sV1-band">
          <span><span className="sV1-band-num">III</span> · CONTACT</span>
          <span className="sV1-band-name">SEND WORD</span>
          <span>FOLIO 04</span>
        </div>
        <div className="sV1-section-head">
          <h2 className="sV1-h">{SERVICES.contact.title}</h2>
        </div>
        <div className="sV1-contact-grid">
          <aside className="sV1-contact-aside">
            <div className="sV1-contact-aside-kicker">{SERVICES.contact.kicker}</div>
            <p>{SERVICES.contact.lede}</p>
            <div className="sV1-contact-aside-mail">{SERVICES.contact.inbox}</div>
          </aside>
          <div>
            <AboutContactForm
              inbox={SERVICES.contact.inbox}
              reasons={SERVICES.contact.reasons}
              sources={SERVICES.contact.sources}
              variant="plain"
              defaultReason={prefill.reason}
              defaultSubject={prefill.subject}
              defaultMessage={prefill.message}
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────── eof */}
      <div className="sV1-eof">
        <span><strong>END OF FILE</strong> · CODEX 01 · SERVICES</span>
        <span>UNITY · AI · LAB</span>
        <span>v2026.04</span>
      </div>

      {/* ─────────────────────── dossier modal */}
      {pickedService ? (
        <div
          className="sV1-modal-veil"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setPickedService(null); }}
        >
          <div className="sV1-modal">
            <button
              type="button"
              className="sV1-modal-close"
              aria-label="Close dossier"
              onClick={() => setPickedService(null)}
            >×</button>
            <div className="sV1-modal-kicker">{pickedService.dossier.kicker}</div>
            <h2>{pickedService.dossier.title}</h2>
            <p className="sV1-modal-lede">{pickedService.dossier.lede}</p>

            {pickedService.dossier.sections.map((s, i) => (
              <div key={i} className="sV1-modal-section">
                <h4>{s.heading}</h4>
                <p>{s.body}</p>
              </div>
            ))}

            <div className="sV1-modal-deliverables">
              <h4>Deliverables</h4>
              <ul>
                {pickedService.dossier.deliverables.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>

            <div className="sV1-modal-cta">
              <button type="button" onClick={() => inquire(pickedService)}>
                Inquire about this service
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setPickedService(null)}
              >Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

window.ServicesV1 = ServicesV1;
