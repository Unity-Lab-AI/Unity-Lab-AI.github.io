// uwd-page.jsx — Unity Web Design system docs, single-page render.

const {
  UwdSection, UwdSubHead, UwdDemo, UwdCode,
  UwdSwatch, UwdComponent, UwdDoDont, UwdBullets, UwdVersion,
  Sigils,
} = window;

/* ============================================================
   TOC + Cover
   ============================================================ */

const TOC = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'layout',      label: 'Layout' },
  { id: 'iconography', label: 'Iconography' },
  { id: 'brand',       label: 'Brand' },
  { id: 'components',  label: 'Components' },
  { id: 'motion',      label: 'Motion' },
  { id: 'a11y',        label: 'A11y' },
  { id: 'changelog',   label: 'Changelog' },
];

const UwdTopbar = () => (
  <div className="uwd-top">
    <div className="uwd-top-inner">
      <a className="uwd-brand" href="#cover">
        <span className="uwd-brand-mark"><Sigils.Unity size={20} stroke={1.4} /></span>
        UNITY WEB DESIGN
        <small>v0.1 · draft</small>
      </a>
      <ul className="uwd-toc">
        {TOC.map((t) => (
          <li key={t.id}><a href={'#' + t.id}>{t.label}</a></li>
        ))}
      </ul>
    </div>
  </div>
);

const UwdCover = () => (
  <header id="cover" className="uwd-cover">
    <div className="uwd-cover-rule">
      <span></span><Sigils.Cross size={14} /><span></span>
    </div>
    <div className="uwd-cover-eyebrow">Internal · Working Draft</div>
    <h1>
      Unity Web Design
      <em>the visual grammar of the dark side of AI</em>
    </h1>
    <p className="uwd-cover-lede">
      An internal reference for everyone forging pages under the Unity AI Lab name.
      Tokens, components, and the atmosphere they belong to. Not a brand book — a
      working draft, kept close to the code.
    </p>
    <div className="uwd-cover-meta">
      <span>Version <strong>0.1</strong></span>
      <span>Status <strong>Draft</strong></span>
      <span>Audience <strong>Internal</strong></span>
      <span>Sources <strong>shared-tokens.css · variations.css</strong></span>
    </div>
  </header>
);

/* ============================================================
   Foundations
   ============================================================ */

const COLOR_TOKENS = [
  { name: 'Primary Black',   token: 'primary-black',   hex: '#0a0a0a' },
  { name: 'Secondary Black', token: 'secondary-black', hex: '#1a1a1a' },
  { name: 'Tertiary Black',  token: 'tertiary-black',  hex: '#141414' },
  { name: 'Dark Grey',       token: 'dark-grey',       hex: '#2a2a2a' },
  { name: 'Mid Grey',        token: 'mid-grey',        hex: '#4a4a4a' },
  { name: 'Muted Grey',      token: 'muted-grey',      hex: '#6a6a6a' },
  { name: 'Light Grey',      token: 'light-grey',      hex: '#cccccc' },
  { name: 'Bone',            token: 'bone',            hex: '#e8e2d4' },
  { name: 'White',           token: 'white',           hex: '#ffffff' },
  { name: 'Crimson Red',     token: 'crimson-red',     hex: '#dc143c' },
  { name: 'Blood Red',       token: 'blood-red',       hex: '#8b0000' },
  { name: 'Accent Red',      token: 'accent-red',      hex: '#ff0033' },
  { name: 'Ember',           token: 'ember',           hex: '#ff5a3c' },
];

const UwdFoundations = () => (
  <UwdSection
    id="foundations"
    num="① · Foundations"
    title="The bones."
    lede="Every page begins with these. Color, type, scale, and the soft glow that holds them. Change them here and the whole site shifts mood."
  >
    <UwdSubHead
      title="Color"
      meta="13 tokens · 1 gradient"
      note="Three blacks descending into ash. One bone for body text. Three reds — crimson is the soul, blood is the bruise, accent is the strike. Ember is reserved for live signal and motion."
    />
    <div className="uwd-swatches">
      {COLOR_TOKENS.map((c) => <UwdSwatch key={c.token} {...c} />)}
      <UwdSwatch
        name="Gradient Red"
        token="gradient-red"
        hex="135° · #8b0000 → #dc143c → #ff0033"
        css="linear-gradient(135deg, #8b0000 0%, #dc143c 50%, #ff0033 100%)"
      />
    </div>
    <UwdCode raw={`/* paste into your <style> or stylesheet */
:root {
  --primary-black:   #0a0a0a;
  --secondary-black: #1a1a1a;
  --tertiary-black:  #141414;
  --dark-grey:       #2a2a2a;
  --mid-grey:        #4a4a4a;
  --muted-grey:      #6a6a6a;
  --light-grey:      #cccccc;
  --bone:            #e8e2d4;
  --white:           #ffffff;
  --crimson-red:     #dc143c;
  --blood-red:       #8b0000;
  --accent-red:      #ff0033;
  --ember:           #ff5a3c;
  --gradient-red: linear-gradient(135deg, #8b0000 0%, #dc143c 50%, #ff0033 100%);
}`}>
{`/* paste into your <style> or stylesheet */
:root {
  --primary-black:   #0a0a0a;
  --secondary-black: #1a1a1a;
  --tertiary-black:  #141414;
  --dark-grey:       #2a2a2a;
  --mid-grey:        #4a4a4a;
  --muted-grey:      #6a6a6a;
  --light-grey:      #cccccc;
  --bone:            #e8e2d4;
  --white:           #ffffff;
  --crimson-red:     #dc143c;
  --blood-red:       #8b0000;
  --accent-red:      #ff0033;
  --ember:           #ff5a3c;
  --gradient-red: linear-gradient(135deg, #8b0000 0%, #dc143c 50%, #ff0033 100%);
}`}
    </UwdCode>

    <UwdSubHead
      title="Semantic roles"
      meta="how to read the palette"
      note="Tokens have personalities. Use them in role, not because the color looks nice."
    />
    <UwdBullets items={[
      { k: 'Background', v: <><code>--primary-black</code> on body, deeper radial wash on hero pages. Avoid pure black; the lab breathes a little warmth.</> },
      { k: 'Surface',    v: <>Card backgrounds use <code>rgba(10,3,5,0.5–0.7)</code> over the page wash, never <code>--secondary-black</code> directly.</> },
      { k: 'Body text',  v: <><code>--bone</code> for paragraphs, <code>--light-grey</code> for support, <code>--muted-grey</code> for captions and meta.</> },
      { k: 'Display',    v: <><code>--white</code> for headlines, <code>--bone</code> for italic seconds.</> },
      { k: 'Accent',     v: <><code>--crimson-red</code> for borders, eyebrows, links, ornaments. <code>--accent-red</code> for active state. <code>--blood-red</code> only as backdrop weight (start of gradients, deep shadow tints).</> },
      { k: 'Live',       v: <><code>--ember</code> for things that breathe — pulses, smoke embers, charging states.</> },
    ]}/>

    <UwdSubHead
      title="Typography"
      meta="3 families · display, body, mono"
      note="Trajan / Cormorant for the carved feeling. Inter for plain speech. JetBrains Mono for the things the machine is actually saying."
    />
    <div className="uwd-demo">
      <div className="uwd-type-row">
        <div className="uwd-type-meta">
          <strong>Display</strong>
          --font-display<br/>Trajan Pro / Cormorant Garamond<br/>700 / 400 italic
        </div>
        <div className="uwd-type-sample" style={{ fontFamily: 'var(--font-display)', fontSize: 64, fontWeight: 700, letterSpacing: 2, lineHeight: 1 }}>
          The Dark Side of AI
        </div>
      </div>
      <div className="uwd-type-row">
        <div className="uwd-type-meta">
          <strong>Display italic</strong>
          --font-display<br/>400 italic<br/>used for "second voice" subtitles
        </div>
        <div className="uwd-type-sample" style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontStyle: 'italic', color: 'var(--bone)' }}>
          forged without the apology layer
        </div>
      </div>
      <div className="uwd-type-row">
        <div className="uwd-type-meta">
          <strong>Body</strong>
          --font-body<br/>Inter 400 / 500 / 600<br/>line-height 1.6
        </div>
        <div className="uwd-type-sample" style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.7, color: 'var(--bone)', maxWidth: 560 }}>
          Plain speech for plain things. Inter is what the lab says when it's not chanting. Use it for paragraphs, lists, and any prose that has to be read on the way to a button.
        </div>
      </div>
      <div className="uwd-type-row">
        <div className="uwd-type-meta">
          <strong>Body serif</strong>
          'Cormorant Garamond' italic<br/>used for ledes, quotes, card prose
        </div>
        <div className="uwd-type-sample" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: 'italic', color: 'var(--bone)', lineHeight: 1.6, maxWidth: 560 }}>
          Cormorant carries the atmosphere — almost everything that wants to feel hand-set falls back to it.
        </div>
      </div>
      <div className="uwd-type-row">
        <div className="uwd-type-meta">
          <strong>Mono</strong>
          --font-mono<br/>JetBrains Mono 400 / 500 / 700<br/>code, terminal, meta, kickers
        </div>
        <div className="uwd-type-sample" style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--bone)' }}>
          $ unity --no-apology
        </div>
      </div>
    </div>

    <UwdSubHead
      title="Type scale"
      meta="display"
      note="The lab speaks loudly when it speaks. Display sizes are unusually large; let them breathe."
    />
    <div className="uwd-demo">
      {[
        { key: 'h1.editorial', size: 140, weight: 700, sample: 'Editorial' },
        { key: 'h1.gothic',    size: 96,  weight: 700, sample: 'The Dark Side' },
        { key: 'h1.cover',     size: 88,  weight: 700, sample: 'Unity Web Design' },
        { key: 'h2',           size: 56,  weight: 700, sample: 'The bones.' },
        { key: 'h3',           size: 28,  weight: 700, sample: 'Color' },
        { key: 'eyebrow',      size: 12,  weight: 700, sample: 'INTERNAL · WORKING DRAFT', letterSpacing: 8, mono: false, italic: false },
      ].map((s) => (
        <div className="uwd-type-row" key={s.key}>
          <div className="uwd-type-meta">
            <strong>{s.key}</strong>
            {s.size}px · {s.weight}<br/>
            display family
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: s.size, fontWeight: s.weight,
            letterSpacing: s.letterSpacing != null ? s.letterSpacing : 1,
            color: 'var(--white)', lineHeight: 1, fontStyle: s.italic ? 'italic' : 'normal',
          }}>{s.sample}</div>
        </div>
      ))}
    </div>

    <UwdSubHead
      title="Spacing"
      meta="8-pt rhythm + section padding"
      note="No formal scale token yet — the system uses raw px on a loose 8-pt rhythm. Documenting current usage so we drift less."
    />
    <div className="uwd-demo uwd-demo-pad-tight">
      {[
        { k: 'sp-1',  px: 4 },
        { k: 'sp-2',  px: 8 },
        { k: 'sp-3',  px: 12 },
        { k: 'sp-4',  px: 16 },
        { k: 'sp-5',  px: 24 },
        { k: 'sp-6',  px: 32 },
        { k: 'sp-7',  px: 48 },
        { k: 'sp-8',  px: 60 },
        { k: 'sp-9',  px: 80 },
        { k: 'sp-10', px: 110 },
      ].map((s) => (
        <div className="uwd-space-row" key={s.k}>
          <span className="uwd-space-key">{s.k}<span className="uwd-space-px">{s.px}px</span></span>
          <span className="uwd-space-bar" style={{ width: s.px * 4 }}></span>
        </div>
      ))}
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'var(--light-grey)', marginTop: 16, fontSize: 14 }}>
        Section padding is 110px top/bottom on desktop, 80px on tablet, 60px on phone.
        Card padding is 28–44px. Hero padding is 80–120px. Always pair with a max-width container.
      </p>
    </div>

    <UwdSubHead
      title="Radii"
      meta="≈ none"
      note="The lab is engraved, not extruded. Square corners by default. Border-radius is reserved for deliberate flourishes (dots, ornaments, the smoke ball)."
    />
    <div className="uwd-grid-3">
      <div className="uwd-tile">
        <div className="uwd-tile-block" style={{ borderRadius: 0 }}></div>
        <div className="uwd-tile-name">Engraved</div>
        <div className="uwd-tile-token">radius: 0 · default</div>
      </div>
      <div className="uwd-tile">
        <div className="uwd-tile-block" style={{ borderRadius: 2 }}></div>
        <div className="uwd-tile-name">Whisper</div>
        <div className="uwd-tile-token">radius: 2px · sparingly</div>
      </div>
      <div className="uwd-tile">
        <div className="uwd-tile-block" style={{ borderRadius: '50%' }}></div>
        <div className="uwd-tile-name">Sigil</div>
        <div className="uwd-tile-token">radius: 50% · ornament only</div>
      </div>
    </div>

    <UwdSubHead
      title="Shadow & glow"
      meta="darkness + crimson halo"
      note="Two stacks: drop shadows for lifting cards on hover, crimson glows for things that emit. Never combine indiscriminately."
    />
    <div className="uwd-grid-3">
      <div className="uwd-tile" style={{ background: 'rgba(10,3,5,0.6)', boxShadow: '0 20px 50px rgba(220,20,60,0.2)' }}>
        <div className="uwd-tile-block" style={{ background: 'transparent', border: '1px solid var(--crimson-red)' }}></div>
        <div className="uwd-tile-name">Card lift</div>
        <div className="uwd-tile-token">0 20px 50px rgba(220,20,60,.2)</div>
      </div>
      <div className="uwd-tile" style={{ background: 'rgba(10,3,5,0.6)' }}>
        <div className="uwd-tile-block" style={{ background: 'transparent', border: '1px solid var(--crimson-red)', boxShadow: '0 0 30px rgba(220,20,60,0.5)' }}></div>
        <div className="uwd-tile-name">Inner glow</div>
        <div className="uwd-tile-token">0 0 30px rgba(220,20,60,.5)</div>
      </div>
      <div className="uwd-tile" style={{ background: 'rgba(10,3,5,0.6)' }}>
        <div className="uwd-tile-block" style={{
          background: 'transparent',
          color: 'var(--crimson-red)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          filter: 'drop-shadow(0 0 16px rgba(220,20,60,0.6))',
          border: 0,
        }}>
          <Sigils.Cross size={48} />
        </div>
        <div className="uwd-tile-name">Drop-shadow halo</div>
        <div className="uwd-tile-token">drop-shadow(0 0 16px crimson)</div>
      </div>
    </div>
  </UwdSection>
);

/* ============================================================
   Layout
   ============================================================ */

const UwdLayout = () => (
  <UwdSection
    id="layout"
    num="② · Layout"
    title="Where things sit."
    lede="The page wraps in a fixed atmosphere. Sections center on a 1240px container. Grid is generous: text breathes, cards have shoulder room."
  >
    <UwdSubHead
      title="Page wrap"
      meta=".vD-page"
      note="Every Unity Lab page descends from .vD-page — a fixed radial wash with a flicker overlay. Don't put bare backgrounds inside; let the wash through."
    />
    <UwdCode raw={`<body>
  <div class="vD-page">
    <GothicNavbar />
    <main id="main-content">
      <!-- sections -->
    </main>
    <GothicFooter />
  </div>
</body>`}>
{`<body>
  <div class="vD-page">
    <GothicNavbar />
    <main id="main-content">
      <!-- sections -->
    </main>
    <GothicFooter />
  </div>
</body>`}
    </UwdCode>

    <UwdSubHead
      title="Section container"
      meta=".vD-section · max 1240px"
      note="Center, 1240px max, 110px top/bottom. The .uwd-section in this doc uses the same sizing — what you see here is the live grid."
    />
    <UwdDemo tag="LIVE" stack>
      <div style={{
        width: '100%',
        maxWidth: 1240,
        background: 'repeating-linear-gradient(90deg, rgba(220,20,60,0.08), rgba(220,20,60,0.08) 1px, transparent 1px, transparent 80px)',
        height: 200,
        border: '1px dashed rgba(220,20,60,0.4)',
        position: 'relative',
        margin: '0 auto',
      }}>
        <span style={{ position: 'absolute', top: 8, left: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-grey)', letterSpacing: 2 }}>1240px max-width container</span>
      </div>
    </UwdDemo>

    <UwdSubHead
      title="Common grids"
      meta="3-col / 2-col / 4-col"
      note="Most card sets are 3-col on desktop, falling to 2-col at 1100px and 1-col at 720px. Stat rows are 4-col with a 1px crimson divider grid."
    />
    <UwdCode raw={`/* services / features */
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 28px;
@media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
@media (max-width: 720px)  { grid-template-columns: 1fr; }`}>
{`/* services / features */
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 28px;
@media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
@media (max-width: 720px)  { grid-template-columns: 1fr; }`}
    </UwdCode>

    <UwdSubHead
      title="Section header pattern"
      meta="number + h2 + lede"
      note="Number reads like a chapter mark. The h2 lands in display family with subtle crimson glow. The lede is italic Cormorant — never sans."
    />
  </UwdSection>
);

/* ============================================================
   Iconography (Sigils)
   ============================================================ */

const SIGILS_META = [
  { name: 'Unity',    desc: 'Ouroboros — the unfiltered cycle.', size: 64 },
  { name: 'Wringer',  desc: 'Code optimization, monitor & matrix.', size: 64 },
  { name: 'Flask',    desc: 'Experimental edge.', size: 64 },
  { name: 'Seal',     desc: 'Octagonal section ornament.', size: 64 },
  { name: 'Cross',    desc: 'Cross-pattée — divider element.', size: 28 },
  { name: 'Node',     desc: 'Pentagonal stat marker.', size: 36 },
  { name: 'Shield',   desc: 'Secured systems / camera.', size: 64 },
  { name: 'Robot',    desc: 'Agentic frameworks.', size: 64 },
  { name: 'Stack',    desc: 'Full-stack tetris.', size: 64 },
  { name: 'Wrenches', desc: 'Current build / tooling.', size: 30 },
  { name: 'GitHub',   desc: 'Octocat mark.', size: 30 },
  { name: 'Discord',  desc: 'Discord mark.', size: 30 },
];

const UwdIconography = () => (
  <UwdSection
    id="iconography"
    num="③ · Iconography"
    title="Sigils."
    lede="No emoji. No icon-font slop. Twelve hand-drawn marks rendered inline as SVG, all stroking with currentColor so they breathe with their parent."
  >
    <UwdSubHead
      title="The set"
      meta="12 marks · single React component"
      note="Drop a sigil with <Sigils.Name size={N} stroke={W} />. They inherit color from their container — set color: var(--crimson-red) on the parent for the lab's signature glow."
    />
    <div className="uwd-sigils">
      {SIGILS_META.map((s) => {
        const C = Sigils[s.name];
        if (!C) return null;
        return (
          <div className="uwd-sigil" key={s.name}>
            <C size={s.size} />
            <div className="uwd-sigil-name">{s.name}</div>
            <div className="uwd-sigil-desc">{s.desc}</div>
          </div>
        );
      })}
    </div>
    <UwdCode raw={`<span style={{ color: 'var(--crimson-red)', filter: 'drop-shadow(0 0 12px rgba(220,20,60,0.4))' }}>
  <Sigils.Unity size={64} stroke={1.5} />
</span>`}>
{`<span style={{ color: 'var(--crimson-red)', filter: 'drop-shadow(0 0 12px rgba(220,20,60,0.4))' }}>
  <Sigils.Unity size={64} stroke={1.5} />
</span>`}
    </UwdCode>
    <UwdDoDont
      doItems={[
        'Use sigils for section ornaments, feature card icons, and footer marks.',
        'Pair with a soft drop-shadow when on dark backgrounds — they should glow, not float.',
        'Set the parent color to crimson by default; switch to bone for inverted treatments.',
      ]}
      dontItems={[
        'Don\'t mix sigils with emoji or off-brand icon libraries.',
        'Don\'t fill them with solid color — strokes are the point.',
        'Don\'t scale below 16px; the strokes break.',
      ]}
    />
  </UwdSection>
);

window.UwdTopbar = UwdTopbar;
window.UwdCover = UwdCover;
window.UwdFoundations = UwdFoundations;
window.UwdLayout = UwdLayout;
window.UwdIconography = UwdIconography;
