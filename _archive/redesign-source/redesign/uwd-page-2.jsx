// uwd-page-2.jsx — second half of the docs (brand, components, motion, a11y, changelog).

const {
  UwdSection, UwdSubHead, UwdDemo, UwdCode,
  UwdComponent, UwdDoDont, UwdBullets, UwdVersion,
  Sigils,
} = window;

/* ============================================================
   Brand
   ============================================================ */

const UwdBrand = () => (
  <UwdSection
    id="brand"
    num="④ · Brand"
    title="The voice."
    lede="The Lab speaks two registers — carved and casual. Both are present at the same time; the contrast is the brand."
  >
    <UwdSubHead
      title="Two voices, always together"
      meta="display + italic"
      note="Top line is carved (display, all-caps or title-case, 2px tracked). Second line is whispered (italic Cormorant, lower-case)."
    />
    <UwdDemo tag="LIVE" stack>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 72, color: 'var(--white)', letterSpacing: 2, lineHeight: 1 }}>
          THE DARK SIDE OF AI
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 36, color: 'var(--bone)', marginTop: 16 }}>
          forged without the apology layer
        </div>
      </div>
    </UwdDemo>

    <UwdSubHead
      title="Tone"
      meta="how the lab talks"
      note="Self-aware, dry, never edgy for edge's sake. The atmosphere does the heavy lifting — copy can be plain. When in doubt, write less."
    />
    <UwdBullets items={[
      { k: 'Voice',  v: 'Confident craftsperson, not provocateur. Half engineer, half librarian. Mocks corporate AI vocabulary without quoting it.' },
      { k: 'Words to keep',  v: <>forge, carve, signal, lab, rite, charter, ledger, bones, atmosphere, no-apology.</> },
      { k: 'Words to avoid', v: <>unlock, leverage, supercharge, revolution, paradigm, ecosystem, journey, AI-native, enterprise-grade.</> },
      { k: 'Numbers', v: 'Stats are sparse and meaningful — never four glowing tiles for the sake of rhythm. If a number doesn\'t earn its place, cut it.' },
      { k: 'Punctuation', v: <>Em-dashes set off asides. Periods land hard. Question marks are rare. Quotes are doubled, italics are situational. The middle dot · is the kerning ornament — pair adjacent labels with it.</> },
    ]}/>

    <UwdSubHead
      title="The mark"
      meta="Unity sigil + wordmark"
      note="The Unity ouroboros is the primary mark. It sits beside the wordmark UNITY AI LAB in mono caps. The mark always glows softly when it has space."
    />
    <UwdDemo tag="LIVE" flex style={{ gap: 32, padding: 48, justifyContent: 'space-around' }}>
      {[
        { bg: 'var(--primary-black)', label: 'On primary black' },
        { bg: 'var(--secondary-black)', label: 'On secondary black' },
        { bg: 'var(--bone)', label: 'On bone (inverted)', invert: true },
      ].map((s) => (
        <div key={s.label} style={{ background: s.bg, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, border: '1px solid var(--dark-grey)', flex: 1 }}>
          <span style={{ color: s.invert ? 'var(--blood-red)' : 'var(--crimson-red)', filter: s.invert ? 'none' : 'drop-shadow(0 0 16px rgba(220,20,60,0.5))' }}>
            <Sigils.Unity size={56} stroke={1.5} />
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: 4, fontSize: 13, color: s.invert ? 'var(--primary-black)' : 'var(--bone)' }}>
            UNITY AI LAB
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-grey)', letterSpacing: 1 }}>
            {s.label}
          </div>
        </div>
      ))}
    </UwdDemo>

    <UwdSubHead
      title="Lock-up rules"
      meta="don't break the seal"
    />
    <UwdDoDont
      doItems={[
        'Pair the sigil with the wordmark at a 1:0.4 size ratio (mark height ≈ 2.5× wordmark cap height).',
        'Keep clear space around the lock-up equal to the height of the sigil.',
        'On dark surfaces, let the mark glow with a soft crimson drop-shadow.',
        'On bone backgrounds, use --blood-red (deeper) so the mark holds its weight.',
      ]}
      dontItems={[
        'Don\'t recolor the mark (no neon, no holograms, no two-tone splits).',
        'Don\'t place the mark on photography unless it sits over a 60%+ dark wash.',
        'Don\'t rotate or stretch — the ouroboros is symmetrical for a reason.',
        'Don\'t add taglines under the wordmark; the second voice belongs in body, not in the lock-up.',
      ]}
    />
  </UwdSection>
);

/* ============================================================
   Components
   ============================================================ */

const UwdButtonsDemo = () => (
  <UwdDemo tag="LIVE" flex>
    <button style={{
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: 4,
      padding: '14px 32px', background: 'var(--crimson-red)', color: 'var(--bone)',
      border: '1px solid var(--crimson-red)', cursor: 'pointer',
    }}>ENLIST</button>
    <button style={{
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: 4,
      padding: '14px 32px', background: 'transparent', color: 'var(--bone)',
      border: '1px solid var(--crimson-red)', cursor: 'pointer',
    }}>READ THE CHARTER</button>
    <button style={{
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: 4,
      padding: '14px 32px', background: 'transparent', color: 'var(--bone)',
      border: '1px solid var(--mid-grey)', cursor: 'pointer',
    }}>DECLINE</button>
    <button disabled style={{
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: 4,
      padding: '14px 32px', background: 'transparent', color: 'var(--mid-grey)',
      border: '1px solid var(--dark-grey)', cursor: 'not-allowed', opacity: 0.6,
    }}>SEALED</button>
  </UwdDemo>
);

const UwdCardDemo = () => (
  <UwdDemo tag="LIVE">
    <div style={{
      maxWidth: 380,
      background: 'rgba(10,3,5,0.6)',
      border: '1px solid rgba(220,20,60,0.3)',
      padding: 32,
      position: 'relative',
    }}>
      <div style={{ color: 'var(--crimson-red)', marginBottom: 16, filter: 'drop-shadow(0 0 12px rgba(220,20,60,0.4))' }}>
        <Sigils.Flask size={48} stroke={1.5} />
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-grey)', letterSpacing: 4, marginBottom: 8 }}>FEATURE · 002</div>
      <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--white)', margin: '0 0 12px', letterSpacing: 1 }}>The Wringer</h4>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 18, color: 'var(--light-grey)', lineHeight: 1.5, margin: 0 }}>
        Compresses verbose code into elegant primitives. No comments survive.
      </p>
    </div>
  </UwdDemo>
);

const UwdNavDemo = () => (
  <UwdDemo tag="LIVE" stack style={{ padding: 0, background: 'var(--primary-black)' }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 32px',
      borderBottom: '1px solid rgba(220,20,60,0.3)',
      background: 'rgba(10,3,5,0.6)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ color: 'var(--crimson-red)', filter: 'drop-shadow(0 0 8px rgba(220,20,60,0.5))' }}>
          <Sigils.Unity size={24} stroke={1.5} />
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: 4, fontSize: 13, color: 'var(--bone)' }}>UNITY AI LAB</span>
      </div>
      <ul style={{ display: 'flex', gap: 36, listStyle: 'none', margin: 0, padding: 0 }}>
        {['MANIFESTO', 'SERVICES', 'WORKS', 'CHARTER', 'CONTACT'].map((l, i) => (
          <li key={l} style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: 3,
            color: i === 0 ? 'var(--crimson-red)' : 'var(--bone)',
            position: 'relative', cursor: 'pointer',
          }}>
            {l}
            {i === 0 && <span style={{ position: 'absolute', left: 0, right: 0, bottom: -8, height: 1, background: 'var(--crimson-red)', boxShadow: '0 0 8px rgba(220,20,60,0.6)' }}></span>}
          </li>
        ))}
      </ul>
    </div>
  </UwdDemo>
);

const UwdTerminalDemo = () => (
  <UwdDemo tag="LIVE" stack>
    <div style={{
      maxWidth: 600, margin: '0 auto', background: '#07090a',
      border: '1px solid rgba(220,20,60,0.3)',
      boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(220,20,60,0.1)',
      fontFamily: 'var(--font-mono)', fontSize: 13,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', background: '#101315', borderBottom: '1px solid #1c2024',
      }}>
        <span style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }}></span>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }}></span>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }}></span>
        </span>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#8a929b', letterSpacing: 1 }}>
          root@unityailab.com — wringer — 80×24
        </span>
      </div>
      <div style={{ padding: '18px 20px', color: '#cdd6df', minHeight: 180, lineHeight: 1.6 }}>
        <div><span style={{ color: '#7ee787' }}>$</span> info wringer</div>
        <div style={{ marginTop: 8, color: '#9aa3ad' }}>// Compresses verbose code into elegant primitives.</div>
        <div style={{ color: '#9aa3ad' }}>// status: ACTIVE · last carved: 2025-04-12</div>
        <div style={{ marginTop: 12 }}><span style={{ color: '#7ee787' }}>$</span> <span style={{ color: '#fff' }}>_</span><span style={{ display: 'inline-block', width: 8, height: 14, background: 'var(--crimson-red)', verticalAlign: 'middle', marginLeft: 2, animation: 'uwd-blink 1s steps(1) infinite' }}></span></div>
      </div>
    </div>
  </UwdDemo>
);

const UwdInputDemo = () => (
  <UwdDemo tag="LIVE" stack>
    <form style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 18 }} onSubmit={(e) => e.preventDefault()}>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-grey)', letterSpacing: 3 }}>
        SIGNAL · NAME
        <input type="text" defaultValue="Kael Vor" style={{
          marginTop: 8, display: 'block', width: '100%',
          background: 'transparent', border: 0, borderBottom: '1px solid var(--mid-grey)',
          padding: '10px 0', color: 'var(--bone)', fontFamily: 'var(--font-body)', fontSize: 16,
          outline: 'none',
        }}/>
      </label>
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted-grey)', letterSpacing: 3 }}>
        SIGNAL · TRANSMISSION
        <textarea rows="3" placeholder="Describe what you'd carve."
          style={{
            marginTop: 8, display: 'block', width: '100%',
            background: 'rgba(10,3,5,0.4)', border: '1px solid var(--dark-grey)',
            padding: '12px 14px', color: 'var(--bone)', fontFamily: 'var(--font-body)', fontSize: 15,
            outline: 'none', resize: 'vertical',
          }}
        />
      </label>
      <button type="submit" style={{
        alignSelf: 'flex-start',
        fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, letterSpacing: 4,
        padding: '14px 32px', background: 'var(--crimson-red)', color: 'var(--bone)',
        border: '1px solid var(--crimson-red)', cursor: 'pointer',
      }}>TRANSMIT</button>
    </form>
  </UwdDemo>
);

const UwdBadgeDemo = () => (
  <UwdDemo tag="LIVE" flex>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: '1px solid var(--crimson-red)', color: 'var(--crimson-red)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ember)', boxShadow: '0 0 6px var(--ember)' }}></span>
      LIVE
    </span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: '1px solid var(--mid-grey)', color: 'var(--light-grey)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3 }}>
      DRAFT
    </span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--crimson-red)', color: 'var(--bone)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3 }}>
      002
    </span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: '1px solid var(--blood-red)', background: 'rgba(139,0,0,0.2)', color: 'var(--bone)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3 }}>
      SEALED
    </span>
  </UwdDemo>
);

const UwdDividerDemo = () => (
  <UwdDemo tag="LIVE" stack style={{ padding: '40px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: 'var(--crimson-red)', maxWidth: 600, margin: '0 auto' }}>
      <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(220,20,60,0.5))' }}></span>
      <Sigils.Cross size={16} />
      <span style={{ flex: 1, height: 1, background: 'linear-gradient(270deg, transparent, rgba(220,20,60,0.5))' }}></span>
    </div>
  </UwdDemo>
);

const UwdComponents = () => (
  <UwdSection
    id="components"
    num="⑤ · Components"
    title="The toolkit."
    lede="Eight working components, lifted directly from the production site. Each is shown live, then named so you can find it in code."
  >
    <UwdComponent
      name="Buttons"
      tags={['mono', 'tracked', 'square']}
      desc="Primary fills with crimson, secondary outlines, tertiary muted. Mono font, 12px, 4px letter-spacing, 14×32 padding. No radius."
    >
      <UwdButtonsDemo />
      <UwdCode raw={`/* primary */
font: 700 12px/1 var(--font-mono);
letter-spacing: 4px;
padding: 14px 32px;
background: var(--crimson-red);
color: var(--bone);
border: 1px solid var(--crimson-red);

/* hover */
box-shadow: 0 0 24px rgba(220,20,60,0.5);
transform: translateY(-1px);`}>
{`/* primary */
font: 700 12px/1 var(--font-mono);
letter-spacing: 4px;
padding: 14px 32px;
background: var(--crimson-red);
color: var(--bone);
border: 1px solid var(--crimson-red);

/* hover */
box-shadow: 0 0 24px rgba(220,20,60,0.5);
transform: translateY(-1px);`}
      </UwdCode>
    </UwdComponent>

    <UwdComponent
      name="Navigation bar"
      tags={['fixed', 'blur', 'mono']}
      desc="Fixed top, 80px tall, blurred dark backdrop, single crimson hairline at the bottom. Active route gets a glowing crimson underline."
    >
      <UwdNavDemo />
    </UwdComponent>

    <UwdComponent
      name="Feature / Service card"
      tags={['sigil', 'kicker', 'serif']}
      desc="Square, dark glass over the page wash. Sigil at top in crimson with a soft halo, mono kicker (FEATURE · 00N), display headline, italic Cormorant lede. Hovers lift 4px and gain a faint crimson radial halo."
    >
      <UwdCardDemo />
    </UwdComponent>

    <UwdComponent
      name="Terminal modal"
      tags={['monospace', 'overlay']}
      desc="Mac-style chrome with traffic lights. 820×560 fixed on desktop, fluid on mobile. Greenish prompt, white echo, blinking crimson cursor. Triggered from service cards."
    >
      <UwdTerminalDemo />
    </UwdComponent>

    <UwdComponent
      name="Inputs & forms"
      tags={['underline', 'mono labels']}
      desc="Mono uppercase labels, 11px / 3px tracked, in muted grey above each field. Single underline inputs for short fields, bordered boxes for textareas. No floating labels."
    >
      <UwdInputDemo />
    </UwdComponent>

    <UwdComponent
      name="Badges & status"
      tags={['mono', 'tiny']}
      desc="Pill-less rectangles in mono caps. Live state pairs with an ember dot pulse. Sealed uses --blood-red wash for finality."
    >
      <UwdBadgeDemo />
    </UwdComponent>

    <UwdComponent
      name="Divider with sigil"
      tags={['ornament']}
      desc="Two crimson hairlines fading to transparent, centered around a Cross sigil. Use between stanzas of body copy or to mark long-form section breaks."
    >
      <UwdDividerDemo />
    </UwdComponent>

    <UwdComponent
      name="Footer"
      tags={['4-col', 'ledger']}
      desc="Four columns: brand block, navigate, contact, charter. Above all, a single crimson hairline. Below, a small ledger row with copyright and version."
    >
      <UwdDemo tag="STATIC" stack style={{ padding: '32px 0', background: 'var(--primary-black)' }}>
        <div style={{ borderTop: '1px solid rgba(220,20,60,0.3)', paddingTop: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, padding: '0 32px' }}>
            <div>
              <span style={{ color: 'var(--crimson-red)' }}><Sigils.Unity size={28} stroke={1.5} /></span>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: 4, fontSize: 12, color: 'var(--bone)', marginTop: 12 }}>UNITY AI LAB</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 14, color: 'var(--muted-grey)', marginTop: 8 }}>forged in shadow</div>
            </div>
            {['NAVIGATE', 'CONTACT', 'CHARTER'].map((h) => (
              <div key={h}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: 3, fontSize: 11, color: 'var(--crimson-red)', marginBottom: 12 }}>{h}</div>
                {[1,2,3].map((i) => (
                  <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--light-grey)', marginBottom: 6 }}>link · {i}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </UwdDemo>
    </UwdComponent>
  </UwdSection>
);

/* ============================================================
   Motion
   ============================================================ */

const UwdMotion = () => (
  <UwdSection
    id="motion"
    num="⑥ · Motion"
    title="What breathes."
    lede="The lab is mostly still. When something moves it should feel inevitable — a flicker, a charge, a release."
  >
    <UwdSubHead
      title="Easing & duration"
      meta="ease-out · 200ms / 600ms"
      note="Two beats: fast for hovers (120–200ms), slow for atmospherics (600–1200ms). Avoid bounce, spring, and elastic — too cheerful."
    />
    <UwdBullets items={[
      { k: 'Hover lift',     v: 'transform: translateY(-4px) · 200ms ease-out · paired with a crimson halo fading in.' },
      { k: 'Glow pulse',     v: 'opacity 0.4 → 0.8 · 2.4s · alternate · used on the Live dot and the Unity sigil only.' },
      { k: 'Flicker',        v: 'page-wash overlay opacity 0.96 → 1.0 in irregular keyframes · gives the sense of CRT atmosphere without strobing.' },
      { k: 'Section enter',  v: 'fade + 8px translate, 600ms ease-out, IntersectionObserver-triggered. One-shot per element.' },
      { k: 'Charge / throw', v: 'smoke ball charges over 300–1200ms with intensifying halo, releases with a curved easing on the projectile.' },
    ]}/>

    <UwdSubHead
      title="The smoke effect"
      meta="redesign/v-d-smoke.js · ambient layer"
      note="A canvas pinned to the page background. Click for a small puff with embers. Hold and drag to charge a crimson ball; release to throw it. The trail fades on a destination-out compositing pass — not a hard clear — so the canvas always carries an afterimage."
    />
    <UwdCode raw={`<!-- mount once, near the top of body -->
<canvas id="vD-smoke" aria-hidden="true"></canvas>
<script src="redesign/v-d-smoke.js" defer></script>

/* it self-installs full-screen, DPR-aware,
   and respects prefers-reduced-motion */`}>
{`<!-- mount once, near the top of body -->
<canvas id="vD-smoke" aria-hidden="true"></canvas>
<script src="redesign/v-d-smoke.js" defer></script>

/* it self-installs full-screen, DPR-aware,
   and respects prefers-reduced-motion */`}
    </UwdCode>

    <UwdDoDont
      doItems={[
        'Use motion sparingly. The lab\'s mood is mostly stillness with one thing breathing at a time.',
        'Respect prefers-reduced-motion: cut flicker, dampen the smoke, freeze the live-dot pulse.',
        'Tie motion to user intent (hover, click, scroll-into-view). Avoid autoplay loops besides the ambient flicker.',
      ]}
      dontItems={[
        'Don\'t ease with bounce, elastic, or back-out — they break the carved feeling.',
        'Don\'t animate display text; it should land fully formed.',
        'Don\'t stack glow pulses on more than one element at a time per viewport.',
      ]}
    />
  </UwdSection>
);

/* ============================================================
   A11y
   ============================================================ */

const UwdA11y = () => (
  <UwdSection
    id="a11y"
    num="⑦ · Accessibility"
    title="Atmosphere with a floor."
    lede="The aesthetic is dark and quiet, but it should still pass. These are the non-negotiables we hold the design to."
  >
    <UwdBullets items={[
      { k: 'Contrast (AA)', v: <>Body copy uses <code>--bone</code> on <code>--primary-black</code> = 16.6:1. Captions in <code>--muted-grey</code> = 4.7:1 — the floor; never go lower for text.</> },
      { k: 'Crimson on dark', v: <><code>--crimson-red</code> on <code>--primary-black</code> = 4.0:1 — usable for ≥18px or 14px bold, NOT for body. Use <code>--bone</code> for body and reserve crimson for headings, eyebrows, and ornaments.</> },
      { k: 'Focus states', v: <>Every interactive element shows a visible focus ring: <code>outline: 2px solid var(--crimson-red); outline-offset: 3px;</code>. Don't rely on the default browser ring; reset and replace.</> },
      { k: 'Skip link', v: <>First focusable element on every page is "Skip to content" — visually hidden until focused, then visible at top-left over the navbar.</> },
      { k: 'Motion', v: <>All ambient motion (smoke, flicker, pulse) wraps in a <code>@media (prefers-reduced-motion: reduce)</code> guard that pauses or removes it.</> },
      { k: 'Decorative SVG', v: <>Sigils used as ornament (footer, dividers) carry <code>aria-hidden="true"</code>. Sigils that convey meaning (status icons) get a <code>&lt;title&gt;</code> child.</> },
      { k: 'Forms', v: 'Every input has an associated label — visible mono-uppercase labels above the field. Errors land in plain text with a crimson left-border on the field; never color-only.' },
      { k: 'Keyboard', v: 'The terminal modal opens with Enter on a card, traps focus while open, and closes on Esc. Modal restores focus to the originating card.' },
      { k: 'Headings', v: 'One h1 per page. Section h2s. Card titles are h3 or h4 depending on nesting. Never style-only headings — semantic level always matches visual weight.' },
    ]}/>
    <UwdCode raw={`/* skip link */
.skip-link {
  position: absolute; left: -9999px; top: 0;
  background: var(--crimson-red); color: var(--bone);
  padding: 12px 20px; font: 700 12px/1 var(--font-mono);
  letter-spacing: 4px; z-index: 9999;
}
.skip-link:focus { left: 16px; top: 16px; outline: 2px solid var(--bone); }

/* reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  #vD-smoke { display: none; }
}`}>
{`/* skip link */
.skip-link {
  position: absolute; left: -9999px; top: 0;
  background: var(--crimson-red); color: var(--bone);
  padding: 12px 20px; font: 700 12px/1 var(--font-mono);
  letter-spacing: 4px; z-index: 9999;
}
.skip-link:focus { left: 16px; top: 16px; outline: 2px solid var(--bone); }

/* reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  #vD-smoke { display: none; }
}`}
    </UwdCode>
  </UwdSection>
);

/* ============================================================
   Changelog
   ============================================================ */

const UwdChangelog = () => (
  <UwdSection
    id="changelog"
    num="⑧ · Changelog"
    title="The ledger."
    lede="What changed, when, and who carved it. Newest at the top."
  >
    <div className="uwd-changelog">
      <UwdVersion
        num="0.1"
        date="2026 · 04"
        tag="DRAFT"
        items={[
          { kind: 'NEW', text: 'First public-internal pass at the design system. 13 color tokens, 3 type families, 12 sigils, 8 components.' },
          { kind: 'NEW', text: 'Smoke effect documented as ambient motion layer with embers, charge, and trail-fade compositing.' },
          { kind: 'NEW', text: 'A11y floor written: contrast targets, focus rings, skip link, reduced-motion guard.' },
          { kind: 'NOTE', text: 'Spacing tokens are not yet formalized — current usage documented on an 8-pt rhythm pending a real --sp-* scale.' },
        ]}
      />
      <UwdVersion
        num="0.0.3"
        date="2026 · 04"
        items={[
          { kind: 'FIX', text: 'Service cards regained hover lift after an `all: unset` regression flattened them.' },
          { kind: 'FIX', text: 'Terminal modal now renders as an actual terminal (chrome, prompt, blinking cursor); cache-bust bumped.' },
        ]}
      />
      <UwdVersion
        num="0.0.2"
        date="2026 · 04"
        items={[
          { kind: 'NEW', text: 'GothicFooter gains NAVIGATE column and a 4-col grid that collapses to 2/1 on tablet/phone.' },
          { kind: 'NEW', text: 'SEO + social meta and a skip link added to Gothic Landing head.' },
        ]}
      />
      <UwdVersion
        num="0.0.1"
        date="2026 · 03"
        tag="GENESIS"
        items={[
          { kind: 'NEW', text: 'Initial gothic redesign: shared tokens, navbar, hero, manifesto, services, features, footer.' },
        ]}
      />
    </div>
  </UwdSection>
);

window.UwdBrand = UwdBrand;
window.UwdComponents = UwdComponents;
window.UwdMotion = UwdMotion;
window.UwdA11y = UwdA11y;
window.UwdChangelog = UwdChangelog;
