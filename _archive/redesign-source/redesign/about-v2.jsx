// ABOUT — V2 (FUSED)
// "Best of" merge of the four directions:
//   • Cathedral  — clean canvas, vertical sigil rules, generous spacing, big type
//   • Dossier    — classified mast, file metadata, rotated stamps, EOF footer
//   • Reliquary  — glass-case sigil cards for the expertise grid
//   • Manifest   — stamped FOLIO band headers + tabular crew listing
//
// Reads from window.ABOUT (about-data.jsx) and uses window.AboutShared primitives
// (stats, timeline, modals, contact form, sigil divider).

const AboutV2 = () => {
  const { ABOUT, AboutShared, Sigils } = window;
  const { AboutStats, AboutStatModal, AboutExpertiseModal, AboutTimeline, AboutContactForm } = AboutShared;
  const [pickedStat, setPickedStat] = React.useState(null);
  const [pickedCard, setPickedCard] = React.useState(null);

  return (
    <div className="aV2 ab-artboard">
      {/* ───────────────────────── classified mast (Dossier) */}
      <div className="aV2-mast">
        <span className="aV2-mast-classification">FILE / OPEN — UNCLASSIFIED</span>
        <span>UNITY · AI · LAB / CODEX 00 · ABOUT</span>
        <span>FOLIO 01 / 09</span>
      </div>

      {/* meta strip */}
      <dl className="aV2-meta">
        <div><dt>Subject</dt><dd>Independent AI laboratory</dd></div>
        <div><dt>Founded</dt><dd>2020 · forum thread</dd></div>
        <div><dt>Personnel</dt><dd>04 (named) / <span className="aV2-redact">classified</span></dd></div>
        <div><dt>Operating From</dt><dd>Distributed · self-hosted</dd></div>
      </dl>

      {/* ───────────────────────── cover (Cathedral typography + Dossier stamps) */}
      <section className="aV2-cover">
        <div className="aV2-cover-vline" />
        <div className="aV2-stamp aV2-stamp-tr">{ABOUT.header.kicker}</div>
        <div className="aV2-stamp aV2-stamp-bl">FOR INTERNAL REVIEW</div>
        <div className="aV2-cover-fileno">FILE-00 · ABOUT · v2026.04</div>
        <h1>{ABOUT.header.title}</h1>
        <div className="aV2-cover-rule" />
        <p className="aV2-cover-lede">{ABOUT.header.lede}</p>
      </section>

      {/* ───────────────────────── stats */}
      <div className="aV2-stats">
        <AboutStats stats={ABOUT.stats} onPick={setPickedStat} variant="cathedral" />
      </div>

      {/* ───────────────────────── I · WHO WE ARE */}
      <section className="aV2-section">
        <div className="aV2-band">
          <span><span className="aV2-band-num">I</span> · WHO WE ARE</span>
          <span className="aV2-band-name">MANIFESTO</span>
          <span>FOLIO 02</span>
        </div>
        <div className="aV2-section-head">
          <h2 className="aV2-h">{ABOUT.manifesto.title}</h2>
        </div>
        <div className="aV2-paragraphs">
          {ABOUT.manifesto.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <blockquote className="aV2-pull">
          <p>{ABOUT.manifesto.pull}</p>
          <div className="aV2-pull-attr">— {ABOUT.manifesto.pullAttr}</div>
        </blockquote>
      </section>

      {/* ───────────────────────── II · DISCIPLINES (Reliquary cards) */}
      <section className="aV2-section">
        <div className="aV2-band">
          <span><span className="aV2-band-num">II</span> · DISCIPLINES</span>
          <span className="aV2-band-name">WHAT WE DO</span>
          <span>FOLIO 03</span>
        </div>
        <div className="aV2-section-head">
          <h2 className="aV2-h">Six disciplines, one workshop.</h2>
        </div>
        <div className="aV2-expertise">
          {ABOUT.expertise.map((c) => {
            const Glyph = Sigils[c.icon] || Sigils.Cross;
            return (
              <article
                key={c.key}
                className="aV2-relic"
                tabIndex={0}
                role="button"
                onClick={() => setPickedCard(c)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPickedCard(c); } }}
              >
                <div className="aV2-relic-glow" />
                <div className="aV2-relic-icon"><Glyph size={48} stroke={1.4} /></div>
                <div className="aV2-relic-num">DISCIPLINE · {c.kicker}</div>
                <h4>{c.title}</h4>
                <p>{c.lede}</p>
                <div className="aV2-relic-cta">OPEN DOSSIER →</div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ───────────────────────── III · MISSION */}
      <section className="aV2-section">
        <div className="aV2-band">
          <span><span className="aV2-band-num">III</span> · MISSION</span>
          <span className="aV2-band-name">SAILING ORDERS</span>
          <span>FOLIO 04</span>
        </div>
        <div className="aV2-section-head">
          <h2 className="aV2-h">{ABOUT.mission.title}</h2>
        </div>
        <div className="aV2-mission">
          {ABOUT.mission.body.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {/* ───────────────────────── IV · ORIGIN */}
      <section className="aV2-section">
        <div className="aV2-band">
          <span><span className="aV2-band-num">IV</span> · ORIGIN</span>
          <span className="aV2-band-name">SHIP'S LOG · OPENING ENTRY</span>
          <span>FOLIO 05</span>
        </div>
        <div className="aV2-section-head">
          <h2 className="aV2-h">How we got here</h2>
        </div>
        <div className="aV2-paragraphs">
          {ABOUT.origin.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {/* ───────────────────────── V · CHRONOLOGY */}
      <section className="aV2-section">
        <div className="aV2-band">
          <span><span className="aV2-band-num">V</span> · CHRONOLOGY</span>
          <span className="aV2-band-name">PORTS OF CALL · 2019 — 2026</span>
          <span>FOLIO 06</span>
        </div>
        <div className="aV2-section-head">
          <h2 className="aV2-h">Our timeline</h2>
        </div>
        <AboutTimeline items={ABOUT.timeline} />
      </section>

      {/* ───────────────────────── VI · CREW (Manifest table) */}
      <section className="aV2-section">
        <div className="aV2-band">
          <span><span className="aV2-band-num">VI</span> · PERSONNEL</span>
          <span className="aV2-band-name">SOULS ABOARD</span>
          <span>FOLIO 07</span>
        </div>
        <div className="aV2-section-head">
          <h2 className="aV2-h">Meet the crew</h2>
        </div>
        <table className="aV2-crew-table">
          <thead>
            <tr>
              <th>Handle</th>
              <th>Sigil</th>
              <th>Name &amp; Role</th>
              <th>Notes</th>
              <th>Posts</th>
            </tr>
          </thead>
          <tbody>
            {ABOUT.founders.map((p) => {
              const Glyph = Sigils[p.sigil] || Sigils.Cross;
              return (
                <tr key={p.key} className="aV2-crew-row">
                  <td className="aV2-cell-handle">@{p.handle}</td>
                  <td className="aV2-cell-portrait"><Glyph size={40} stroke={1.4} /></td>
                  <td>
                    <div className="aV2-cell-name">{p.name}</div>
                    <span className="aV2-cell-role">{p.title}</span>
                  </td>
                  <td><div className="aV2-cell-bio">{p.bio}</div></td>
                  <td>
                    <div className="aV2-cell-roles">
                      {p.roles.map((r) => <span key={r}>{r}</span>)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* ───────────────────────── VII · TRANSMISSION */}
      <section className="aV2-section">
        <div className="aV2-band">
          <span><span className="aV2-band-num">VII</span> · TRANSMISSION</span>
          <span className="aV2-band-name">SEND WORD</span>
          <span>FOLIO 08</span>
        </div>
        <div className="aV2-section-head">
          <h2 className="aV2-h">{ABOUT.contact.title}</h2>
        </div>
        <div className="aV2-contact-grid">
          <aside className="aV2-contact-aside">
            <div className="aV2-contact-aside-kicker">DIRECT TRANSMISSION</div>
            <p>{ABOUT.contact.lede}</p>
            <span className="aV2-contact-aside-mail">{ABOUT.contact.inbox}</span>
          </aside>
          <AboutContactForm
            inbox={ABOUT.contact.inbox}
            reasons={ABOUT.contact.reasons}
            sources={ABOUT.contact.sources}
            variant="cathedral"
          />
        </div>
      </section>

      {/* ───────────────────────── EOF (Dossier) */}
      <footer className="aV2-eof">
        <span>END OF FILE · UNITY · AI · LAB</span>
        <span><strong>v2026.04</strong></span>
        <span>FILE-00 · 09 / 09</span>
      </footer>

      <AboutStatModal stat={pickedStat} onClose={() => setPickedStat(null)} />
      <AboutExpertiseModal card={pickedCard} onClose={() => setPickedCard(null)} />
    </div>
  );
};

window.AboutV2 = AboutV2;
