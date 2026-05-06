// Variation D — Push the gothic
// Sigil-forward, candle-flicker glow, drop caps, horror-academic.
// Heavy ornamentation, deliberate, ritual feel.

const GothicHero = () => {
  const { Sigils } = window;

  return (
    <section className="vD-hero">
      <div className="vD-vignette"></div>
      <div className="vD-flicker"></div>

      <div className="vD-frame">
        <div className="vD-corner vD-tl"></div>
        <div className="vD-corner vD-tr"></div>
        <div className="vD-corner vD-bl"></div>
        <div className="vD-corner vD-br"></div>

        <div className="vD-seal">
          <Sigils.Seal size={140} stroke={1} />
          <div className="vD-seal-inner">
            <Sigils.Unity size={56} stroke={1.2} />
          </div>
        </div>

        <div className="vD-mast">
          <span className="vD-orn">✦</span>
          <span>UNITY · AI · LAB</span>
          <span className="vD-orn">✦</span>
        </div>

        <h1 className="vD-title">
          <span className="vD-l1">The Dark Side</span>
          <span className="vD-and">— of —</span>
          <span className="vD-l2">Artificial Intelligence</span>
        </h1>

        <div className="vD-rule"><span></span><Sigils.Cross size={14} /><span></span></div>

        <p className="vD-lede">
          <span className="vD-drop">A</span>n independent lab forging AI tools without the apology layer. Open source, hand-written, intentionally unfiltered. Built by four people who'd rather ship something true than something safe.
        </p>

        <div className="vD-rites">
          <a href="./ai/demo/" className="vD-rite vD-rite-primary">
            <span className="vD-rite-pre">∎</span> Summon Unity <span className="vD-rite-post">∎</span>
          </a>
          <a href="./codex.html" className="vD-rite">
            Read the codex
          </a>
        </div>

        {window.GothicVisitorCounter ? <window.GothicVisitorCounter /> : null}

        <div className="vD-creed">
          <span>HACKALL360/SPONGE</span>
          <span className="vD-orn-sm">✦</span>
          <span>GFOURTEEN</span>
          <span className="vD-orn-sm">✦</span>
          <span>ALFREDO</span>
          <span className="vD-orn-sm">✦</span>
          <span>RED</span>
        </div>
      </div>
    </section>
  );
};

window.GothicHero = GothicHero;
