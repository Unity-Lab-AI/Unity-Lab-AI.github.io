// DIRECTION B — RELIQUARY
// Sigil-led, glass-case feature cards, ritual rhythm. Centered, ceremonial.

const ReliquaryAbout = () => {
  const { ABOUT, AboutShared, Sigils } = window;
  const { AboutSigilDivider, AboutStats, AboutStatModal, AboutExpertiseModal, AboutTimeline, AboutContactForm } = AboutShared;
  const [pickedStat, setPickedStat] = React.useState(null);
  const [pickedCard, setPickedCard] = React.useState(null);

  return (
    <div className="aB ab-artboard">
      {/* Cover */}
      <section className="aB-cover">
        <div className="aB-cover-seal">
          <Sigils.Seal size={150} stroke={1} />
          <div className="aB-cover-seal-inner"><Sigils.Unity size={62} stroke={1.2} /></div>
        </div>
        <div className="aB-mast">
          <span className="aB-mast-orn">✦</span>
          <span>UNITY · AI · LAB</span>
          <span className="aB-mast-orn">✦</span>
        </div>
        <h1>{ABOUT.header.title}</h1>
        <p className="aB-cover-lede">{ABOUT.header.lede}</p>
      </section>

      <section className="aB-stats">
        <AboutStats stats={ABOUT.stats} onPick={setPickedStat} variant="reliquary" />
      </section>

      <AboutSigilDivider sigil="Cross" />

      {/* Manifesto */}
      <section className="aB-section">
        <div className="aB-kicker">{ABOUT.manifesto.kicker}</div>
        <h2 className="aB-h">{ABOUT.manifesto.title}</h2>
        <div className="aB-paragraphs">
          {ABOUT.manifesto.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <div className="aB-pull">
          <p>{ABOUT.manifesto.pull}</p>
          <div className="aB-pull-attr">— {ABOUT.manifesto.pullAttr}</div>
        </div>
      </section>

      <AboutSigilDivider sigil="Seal" size={28} />

      {/* Expertise — glass cases */}
      <section className="aB-section">
        <div className="aB-kicker">DISCIPLINES · I — VI</div>
        <h2 className="aB-h">What we do</h2>
        <p className="aB-lede">A diverse team across the full stack of AI development. Each relic, a discipline.</p>
        <div className="aB-expertise">
          {ABOUT.expertise.map((c) => {
            const Glyph = Sigils[c.icon] || Sigils.Cross;
            return (
              <article key={c.key} className="aB-relic" tabIndex={0} onClick={() => setPickedCard(c)}>
                <div className="aB-relic-glow" />
                <div className="aB-relic-icon"><Glyph size={48} stroke={1.4} /></div>
                <div className="aB-relic-num">DISCIPLINE · {c.kicker}</div>
                <h4>{c.title}</h4>
                <p>{c.lede}</p>
                <div className="aB-relic-cta">OPEN RELIC →</div>
              </article>
            );
          })}
        </div>
      </section>

      <AboutSigilDivider sigil="Cross" />

      {/* Mission */}
      <section className="aB-section">
        <div className="aB-kicker">{ABOUT.mission.kicker}</div>
        <h2 className="aB-h">{ABOUT.mission.title}</h2>
        <div className="aB-mission">
          {ABOUT.mission.body.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      <AboutSigilDivider sigil="Seal" size={28} />

      {/* Origin */}
      <section className="aB-section">
        <div className="aB-kicker">{ABOUT.origin.kicker}</div>
        <h2 className="aB-h">{ABOUT.origin.title}</h2>
        <div className="aB-paragraphs">
          {ABOUT.origin.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {/* Timeline */}
      <section className="aB-section">
        <div className="aB-kicker">CHRONOLOGY · 2019 — 2026</div>
        <h2 className="aB-h">Our timeline</h2>
        <AboutTimeline items={ABOUT.timeline} />
      </section>

      <AboutSigilDivider sigil="Cross" />

      {/* Founders */}
      <section className="aB-section">
        <div className="aB-kicker">PERSONNEL · IV</div>
        <h2 className="aB-h">Meet the crew</h2>
        <div className="aB-founders">
          {ABOUT.founders.map((p) => {
            const Glyph = Sigils[p.sigil] || Sigils.Cross;
            return (
              <article key={p.key} className="aB-founder">
                <div className="aB-founder-sigil"><Glyph size={48} stroke={1.4} /></div>
                <div className="aB-founder-name">{p.name}</div>
                <div className="aB-founder-title">{p.title}</div>
                <div className="aB-founder-handle">@{p.handle}</div>
                <p className="aB-founder-bio">{p.bio}</p>
                <div className="aB-founder-roles">
                  {p.roles.map((r) => <span key={r} className="aB-founder-role">{r}</span>)}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <AboutSigilDivider sigil="Seal" size={28} />

      {/* Contact */}
      <section className="aB-section">
        <div className="aB-kicker">{ABOUT.contact.kicker}</div>
        <h2 className="aB-h">{ABOUT.contact.title}</h2>
        <p className="aB-lede">{ABOUT.contact.lede}</p>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <AboutContactForm
            inbox={ABOUT.contact.inbox}
            reasons={ABOUT.contact.reasons}
            sources={ABOUT.contact.sources}
            variant="reliquary"
          />
        </div>
      </section>

      <AboutStatModal stat={pickedStat} onClose={() => setPickedStat(null)} />
      <AboutExpertiseModal card={pickedCard} onClose={() => setPickedCard(null)} />
    </div>
  );
};

window.ReliquaryAbout = ReliquaryAbout;
