// Variation B — Editorial Dark
// Oversized Trajan as magazine display, asymmetric grid, full-bleed moments,
// less effects, more typographic confidence. Drop caps, large numerals.

const EditorialHero = () => {
  return (
    <section className="vB-hero">
      <div className="vB-topbar">
        <div className="vB-mast">
          <span className="vB-mast-num">№ 02</span>
          <span className="vB-mast-issue">VOL. II — UNFILTERED</span>
          <span className="vB-mast-date">MMXXVI</span>
        </div>
      </div>

      <div className="vB-stack">
        <div className="vB-eyebrow">— A LAB FOR UNRESTRICTED INTELLIGENCE —</div>
        <h1 className="vB-title">
          <span className="vB-line-1">The Dark</span>
          <span className="vB-line-2"><em>Side</em> of</span>
          <span className="vB-line-3">A<span className="vB-amp">·</span>I</span>
        </h1>

        <div className="vB-grid">
          <aside className="vB-folio">
            <div className="vB-folio-num">001</div>
            <div className="vB-folio-cap">THE PREMISE</div>
          </aside>
          <div className="vB-lede">
            <p className="vB-drop">
              <span className="vB-dropcap">W</span>e build AI that doesn't ask permission. Not for chaos — for <em>capability</em>. The same tools, without the apology layer. The same models, without the warning labels. Unity is what happens when you stop training fear into the machine.
            </p>
          </div>
          <aside className="vB-pull">
            <div className="vB-quote-mark">"</div>
            <p>We're not building an AI wrapper.<br/>We're building the thing wrappers were hiding.</p>
            <div className="vB-quote-attr">— sponge, founders' note</div>
          </aside>
        </div>

        <div className="vB-cta-row">
          <a href="#" className="vB-cta">→ Open Unity</a>
          <span className="vB-cta-sep">·</span>
          <a href="#" className="vB-cta">→ Read the lab notes</a>
          <span className="vB-cta-sep">·</span>
          <a href="#" className="vB-cta">→ Discord</a>
        </div>
      </div>

      <div className="vB-folio-bottom">
        <span>UNITYAILAB.COM</span>
        <span>—</span>
        <span>P.001</span>
      </div>
    </section>
  );
};

window.EditorialHero = EditorialHero;
