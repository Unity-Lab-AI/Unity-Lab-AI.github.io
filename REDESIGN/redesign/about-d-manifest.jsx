// DIRECTION D — CREW MANIFEST
// Ship/voyage metaphor. Roles laid out as a manifest with stamped headers
// and a tabular crew listing.

const ManifestAbout = () => {
  const { ABOUT, AboutShared, Sigils } = window;
  const { AboutSigilDivider, AboutStats, AboutStatModal, AboutExpertiseModal, AboutTimeline, AboutContactForm } = AboutShared;
  const [pickedStat, setPickedStat] = React.useState(null);
  const [pickedCard, setPickedCard] = React.useState(null);

  return (
    <div className="aD ab-artboard">
      {/* Cover — manifest header */}
      <section className="aD-cover">
        <div className="aD-stamp-row">
          <span><strong>MANIFEST</strong> · UNITY · AI · LAB</span>
          <span>VOYAGE 06 · 2026</span>
          <span>STAMPED — 26 APR 2026</span>
        </div>
        <div className="aD-cover-grid">
          <div>
            <div className="aD-cover-eyebrow">CODEX 00 · ABOUT THE CREW</div>
            <h1>{ABOUT.header.title}</h1>
          </div>
          <dl className="aD-cover-meta">
            <dt>VESSEL</dt><dd>unityailab.com</dd>
            <dt>FLAG</dt><dd>Independent · open-source</dd>
            <dt>HOMEPORT</dt><dd>The internet</dd>
            <dt>SOULS ABOARD</dt><dd>04 named</dd>
            <dt>UNDER WAY SINCE</dt><dd>2020</dd>
          </dl>
        </div>
        <p className="aD-cover-lede">{ABOUT.header.lede}</p>
      </section>

      <div className="aD-stats">
        <AboutStats stats={ABOUT.stats} onPick={setPickedStat} variant="manifest" />
      </div>

      {/* Manifesto */}
      <section className="aD-section">
        <div className="aD-band">
          <span><span className="aD-band-num">I</span> · WHO WE ARE</span>
          <span className="aD-band-name">MANIFESTO</span>
          <span>FOLIO 01</span>
        </div>
        <h2 className="aD-h">{ABOUT.manifesto.title}</h2>
        <div className="aD-paragraphs">
          {ABOUT.manifesto.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <blockquote className="aD-pull">
          <p>{ABOUT.manifesto.pull}</p>
          <div className="aD-pull-attr">— {ABOUT.manifesto.pullAttr}</div>
        </blockquote>
      </section>

      {/* Expertise — manifest table */}
      <section className="aD-section">
        <div className="aD-band">
          <span><span className="aD-band-num">II</span> · DISCIPLINES</span>
          <span className="aD-band-name">CARGO MANIFEST</span>
          <span>FOLIO 02</span>
        </div>
        <table className="aD-expertise-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Sigil</th>
              <th>Discipline</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ABOUT.expertise.map((c) => {
              const Glyph = Sigils[c.icon] || Sigils.Cross;
              return (
                <tr key={c.key} className="aD-expertise-row" tabIndex={0} onClick={() => setPickedCard(c)}>
                  <td className="aD-cell-num">{c.kicker}</td>
                  <td className="aD-cell-icon"><Glyph size={36} stroke={1.4} /></td>
                  <td><div className="aD-cell-title">{c.title}</div></td>
                  <td><div className="aD-cell-lede">{c.lede}</div></td>
                  <td className="aD-cell-cta">OPEN →</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Mission */}
      <section className="aD-section">
        <div className="aD-band">
          <span><span className="aD-band-num">III</span> · MISSION</span>
          <span className="aD-band-name">SAILING ORDERS</span>
          <span>FOLIO 03</span>
        </div>
        <div className="aD-mission">
          {ABOUT.mission.body.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {/* Origin */}
      <section className="aD-section">
        <div className="aD-band">
          <span><span className="aD-band-num">IV</span> · ORIGIN</span>
          <span className="aD-band-name">SHIP'S LOG · OPENING ENTRY</span>
          <span>FOLIO 04</span>
        </div>
        <h2 className="aD-h">How we got here</h2>
        <div className="aD-paragraphs">
          {ABOUT.origin.paragraphs.slice(0, 2).map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <div className="aD-paragraphs" style={{ marginTop: 18 }}>
          {ABOUT.origin.paragraphs.slice(2).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {/* Timeline */}
      <section className="aD-section">
        <div className="aD-band">
          <span><span className="aD-band-num">V</span> · CHRONOLOGY</span>
          <span className="aD-band-name">PORTS OF CALL</span>
          <span>FOLIO 05</span>
        </div>
        <AboutTimeline items={ABOUT.timeline} />
      </section>

      {/* Founders — crew table */}
      <section className="aD-section">
        <div className="aD-band">
          <span><span className="aD-band-num">VI</span> · CREW</span>
          <span className="aD-band-name">SOULS ABOARD</span>
          <span>FOLIO 06</span>
        </div>
        <table className="aD-crew-table">
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
                <tr key={p.key} className="aD-crew-row">
                  <td className="aD-cell-handle">@{p.handle}</td>
                  <td className="aD-cell-portrait"><Glyph size={36} stroke={1.4} /></td>
                  <td>
                    <div className="aD-cell-name">{p.name}</div>
                    <span className="aD-cell-role">{p.title}</span>
                  </td>
                  <td><div className="aD-cell-bio">{p.bio}</div></td>
                  <td>
                    <div className="aD-cell-roles">
                      {p.roles.map((r) => <span key={r}>{r}</span>)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Contact */}
      <section className="aD-section">
        <div className="aD-band">
          <span><span className="aD-band-num">VII</span> · TRANSMISSION</span>
          <span className="aD-band-name">SEND WORD</span>
          <span>FOLIO 07</span>
        </div>
        <div className="aD-contact-grid">
          <aside className="aD-contact-aside">
            <div className="aD-contact-aside-kicker">DIRECT TRANSMISSION</div>
            <p>{ABOUT.contact.lede}</p>
            <span className="aD-contact-aside-mail">{ABOUT.contact.inbox}</span>
          </aside>
          <AboutContactForm
            inbox={ABOUT.contact.inbox}
            reasons={ABOUT.contact.reasons}
            sources={ABOUT.contact.sources}
            variant="manifest"
          />
        </div>
      </section>

      <AboutStatModal stat={pickedStat} onClose={() => setPickedStat(null)} />
      <AboutExpertiseModal card={pickedCard} onClose={() => setPickedCard(null)} />
    </div>
  );
};

window.ManifestAbout = ManifestAbout;
