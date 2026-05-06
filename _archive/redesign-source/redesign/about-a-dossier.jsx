// DIRECTION A — DOSSIER
// Classified file aesthetic. Manilla-meets-blackline; redactions, stamps, mono-heavy.

const DossierAbout = () => {
  const { ABOUT, AboutShared, Sigils } = window;
  const { AboutSigilDivider, AboutStats, AboutStatModal, AboutExpertiseModal, AboutTimeline, AboutContactForm } = AboutShared;
  const [pickedStat, setPickedStat] = React.useState(null);
  const [pickedCard, setPickedCard] = React.useState(null);

  return (
    <div className="aA ab-artboard">
      {/* === Document header === */}
      <header className="aA-header">
        <div className="aA-mast">
          <span className="aA-mast-classification">FILE / OPEN — UNCLASSIFIED</span>
          <span>UNITY · AI · LAB / DOSSIER 00 · ABOUT</span>
          <span>FOLIO 01 / 09</span>
        </div>
        <dl className="aA-meta-grid aA-meta">
          <div><dt>Subject</dt><dd>Independent AI laboratory</dd></div>
          <div><dt>Founded</dt><dd>2020 · forum thread</dd></div>
          <div><dt>Personnel</dt><dd>04 (named) / <span className="aA-redact">classified</span></dd></div>
          <div><dt>Operating From</dt><dd>Distributed · self-hosted</dd></div>
        </dl>
      </header>

      {/* === Cover (header) === */}
      <section className="aA-cover">
        <div className="aA-cover-inner">
          <div className="aA-stamp aA-stamp-tr">{ABOUT.header.kicker}</div>
          <div className="aA-stamp aA-stamp-bl">FOR INTERNAL REVIEW</div>
          <div className="aA-fileno">FILE-00 · ABOUT · v2026.04</div>
          <h1>{ABOUT.header.title}</h1>
          <p>{ABOUT.header.lede}</p>
          <div className="aA-cover-foot">
            <span>FILED — 26 APR 2026</span>
            <span>UNITY · AI · LAB</span>
            <span>PAGE 01</span>
          </div>
        </div>
      </section>

      {/* === Stats — 'Exhibits' === */}
      <section className="aA-stats">
        <AboutStats stats={ABOUT.stats} onPick={setPickedStat} variant="dossier" />
      </section>

      <AboutSigilDivider sigil="Cross" />

      {/* === Who we are === */}
      <section className="aA-section">
        <span className="aA-section-tag">FOLIO 02 · WHO WE ARE</span>
        <h2 className="aA-h">{ABOUT.manifesto.title}</h2>
        <div className="aA-paragraphs">
          {ABOUT.manifesto.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <blockquote className="aA-pull">
          <p>{ABOUT.manifesto.pull}</p>
          <div className="aA-pull-attr">— {ABOUT.manifesto.pullAttr}</div>
        </blockquote>
      </section>

      <AboutSigilDivider sigil="Seal" size={26} />

      {/* === Expertise === */}
      <section className="aA-section">
        <span className="aA-section-tag">FOLIO 03 · DISCIPLINES</span>
        <h2 className="aA-h">What we do</h2>
        <div className="aA-expertise">
          {ABOUT.expertise.map((c) => {
            const Glyph = Sigils[c.icon] || Sigils.Cross;
            return (
              <article key={c.key} className="aA-expertise-card" onClick={() => setPickedCard(c)} tabIndex={0}>
                <div className="aA-expertise-head">
                  <span className="aA-expertise-kicker">DISCIPLINE · {c.kicker}</span>
                  <span>OPEN</span>
                </div>
                <h4>{c.title}</h4>
                <p>{c.lede}</p>
                <div className="aA-icon"><Glyph size={36} stroke={1.4} /></div>
                <div className="aA-expertise-cta">VIEW DOSSIER →</div>
              </article>
            );
          })}
        </div>
      </section>

      <AboutSigilDivider sigil="Cross" />

      {/* === Mission === */}
      <section className="aA-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <span className="aA-section-tag" style={{ left: 56 }}>FOLIO 04 · MISSION</span>
        <div className="aA-mission" style={{ marginTop: 30 }}>
          {ABOUT.mission.body.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      <AboutSigilDivider sigil="Seal" size={26} />

      {/* === Origin === */}
      <section className="aA-section">
        <span className="aA-section-tag">FOLIO 05 · ORIGIN</span>
        <h2 className="aA-h">How we got here</h2>
        <div className="aA-paragraphs" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {ABOUT.origin.paragraphs.slice(0, 2).map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <div className="aA-paragraphs" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 28 }}>
          {ABOUT.origin.paragraphs.slice(2).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {/* === Timeline === */}
      <section className="aA-section">
        <span className="aA-section-tag">FOLIO 06 · CHRONOLOGY</span>
        <h2 className="aA-h">Timeline</h2>
        <AboutTimeline items={ABOUT.timeline} />
      </section>

      <AboutSigilDivider sigil="Cross" />

      {/* === Founders === */}
      <section className="aA-section">
        <span className="aA-section-tag">FOLIO 07 · PERSONNEL</span>
        <h2 className="aA-h">The crew</h2>
        <div className="aA-founders">
          {ABOUT.founders.map((p) => {
            const Glyph = Sigils[p.sigil] || Sigils.Cross;
            return (
              <article key={p.key} className="aA-founder">
                <div className="aA-founder-portrait"><Glyph size={48} stroke={1.4} /></div>
                <div>
                  <div className="aA-founder-meta">PERSONNEL · {p.handle}</div>
                  <div className="aA-founder-name">{p.name}</div>
                  <div className="aA-founder-handle">@{p.handle}</div>
                  <p className="aA-founder-bio">{p.bio}</p>
                  <div className="aA-founder-roles">
                    {p.roles.map((r) => <span key={r} className="aA-founder-role">{r}</span>)}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* === Contact === */}
      <section className="aA-section" style={{ paddingLeft: 0, paddingRight: 0 }}>
        <span className="aA-section-tag" style={{ left: 56 }}>FOLIO 08 · TRANSMISSION</span>
        <div className="aA-contact" style={{ marginTop: 30 }}>
          <h2 className="aA-h" style={{ marginBottom: 24 }}>{ABOUT.contact.title}</h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, color: 'var(--bone)', fontStyle: 'italic', marginBottom: 24, maxWidth: 640 }}>
            {ABOUT.contact.lede}
          </p>
          <AboutContactForm
            inbox={ABOUT.contact.inbox}
            reasons={ABOUT.contact.reasons}
            sources={ABOUT.contact.sources}
            variant="dossier"
          />
        </div>
      </section>

      {/* footer band */}
      <footer style={{
        padding: '24px 56px', borderTop: '1px solid rgba(220,20,60,0.3)',
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--muted-grey)'
      }}>
        <span>END OF FILE · UNITY · AI · LAB</span>
        <span>v2026.04</span>
        <span>FILE-00 · 09 / 09</span>
      </footer>

      <AboutStatModal stat={pickedStat} onClose={() => setPickedStat(null)} />
      <AboutExpertiseModal card={pickedCard} onClose={() => setPickedCard(null)} />
    </div>
  );
};

window.DossierAbout = DossierAbout;
