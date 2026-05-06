// DIRECTION C — CATHEDRAL
// Full-bleed sections, vertical sigil rules, ceremonial. Tall, vertical, black.

const CathedralAbout = () => {
  const { ABOUT, AboutShared, Sigils } = window;
  const { AboutSigilDivider, AboutStats, AboutStatModal, AboutExpertiseModal, AboutTimeline, AboutContactForm } = AboutShared;
  const [pickedStat, setPickedStat] = React.useState(null);
  const [pickedCard, setPickedCard] = React.useState(null);

  return (
    <div className="aC ab-artboard">
      {/* Cover */}
      <section className="aC-cover">
        <div className="aC-cover-vline" />
        <div className="aC-mast">UNITY · AI · LAB &nbsp;✦&nbsp; CODEX · 00 · ABOUT</div>
        <h1>{ABOUT.header.title}</h1>
        <div className="aC-cover-rule" />
        <p className="aC-cover-lede">{ABOUT.header.lede}</p>
      </section>

      <div className="aC-stats">
        <AboutStats stats={ABOUT.stats} onPick={setPickedStat} variant="cathedral" />
      </div>

      {/* Manifesto */}
      <section className="aC-section">
        <div className="aC-section-vline" />
        <div className="aC-section-head">
          <div className="aC-kicker">{ABOUT.manifesto.kicker}</div>
          <h2 className="aC-h">{ABOUT.manifesto.title}</h2>
        </div>
        <div className="aC-paragraphs">
          {ABOUT.manifesto.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <div className="aC-pull">
          <p>{ABOUT.manifesto.pull}</p>
          <div className="aC-pull-attr">— {ABOUT.manifesto.pullAttr}</div>
        </div>
      </section>

      {/* Expertise — altar grid */}
      <section className="aC-section">
        <div className="aC-section-head">
          <div className="aC-kicker">DISCIPLINES · I — VI</div>
          <h2 className="aC-h">What we do</h2>
        </div>
        <div className="aC-expertise">
          {ABOUT.expertise.map((c) => {
            const Glyph = Sigils[c.icon] || Sigils.Cross;
            return (
              <article key={c.key} className="aC-altar" tabIndex={0} onClick={() => setPickedCard(c)}>
                <div className="aC-altar-icon"><Glyph size={56} stroke={1.4} /></div>
                <div>
                  <div className="aC-altar-kicker">DISCIPLINE · {c.kicker}</div>
                  <h4>{c.title}</h4>
                  <p>{c.lede}</p>
                  <div className="aC-altar-cta">OPEN ALTAR →</div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Mission */}
      <section className="aC-section">
        <div className="aC-section-head">
          <div className="aC-kicker">{ABOUT.mission.kicker}</div>
          <h2 className="aC-h">{ABOUT.mission.title}</h2>
        </div>
        <div className="aC-mission">
          {ABOUT.mission.body.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {/* Origin */}
      <section className="aC-section">
        <div className="aC-section-head">
          <div className="aC-kicker">{ABOUT.origin.kicker}</div>
          <h2 className="aC-h">{ABOUT.origin.title}</h2>
        </div>
        <div className="aC-paragraphs">
          {ABOUT.origin.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>

      {/* Timeline */}
      <section className="aC-section">
        <div className="aC-section-head">
          <div className="aC-kicker">CHRONOLOGY · 2019 — 2026</div>
          <h2 className="aC-h">Our timeline</h2>
        </div>
        <AboutTimeline items={ABOUT.timeline} />
      </section>

      {/* Founders */}
      <section className="aC-section">
        <div className="aC-section-head">
          <div className="aC-kicker">PERSONNEL · IV</div>
          <h2 className="aC-h">Meet the crew</h2>
        </div>
        <div className="aC-founders">
          {ABOUT.founders.map((p) => {
            const Glyph = Sigils[p.sigil] || Sigils.Cross;
            return (
              <article key={p.key} className="aC-founder">
                <div className="aC-founder-sigil"><Glyph size={40} stroke={1.4} /></div>
                <div className="aC-founder-name">{p.name}</div>
                <div className="aC-founder-title">{p.title}</div>
                <p className="aC-founder-bio">{p.bio}</p>
                <div className="aC-founder-handle">@{p.handle}</div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Contact */}
      <section className="aC-section">
        <div className="aC-section-head">
          <div className="aC-kicker">{ABOUT.contact.kicker}</div>
          <h2 className="aC-h">{ABOUT.contact.title}</h2>
        </div>
        <p className="aC-paragraphs" style={{ marginBottom: 32 }}>
          <span style={{ display: 'block' }}>{ABOUT.contact.lede}</span>
        </p>
        <div className="aC-contact">
          <AboutContactForm
            inbox={ABOUT.contact.inbox}
            reasons={ABOUT.contact.reasons}
            sources={ABOUT.contact.sources}
            variant="cathedral"
          />
        </div>
      </section>

      <AboutStatModal stat={pickedStat} onClose={() => setPickedStat(null)} />
      <AboutExpertiseModal card={pickedCard} onClose={() => setPickedCard(null)} />
    </div>
  );
};

window.CathedralAbout = CathedralAbout;
