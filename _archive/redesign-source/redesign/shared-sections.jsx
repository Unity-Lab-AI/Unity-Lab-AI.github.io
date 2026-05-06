// Shared sections that appear below each hero variation in their artboard
// — Library showcase (PolliLibJS / PolliLibPy)
// — Why we built this
// — Social proof artifacts
// — Footer artifact

const LibraryShowcase = ({ accent = 'crimson' }) => {
  return (
    <section className="lib-showcase" data-accent={accent}>
      <div className="lib-eyebrow">/ THE ACTUAL FLEX /</div>
      <h2>Two libraries. Hand-built. Battle-tested.</h2>
      <p className="lib-sub">PolliLibJS and PolliLibPy are the substantive thing on this site — full Pollinations.AI clients with retry logic, streaming, and a developer experience that doesn't suck.</p>

      <div className="lib-grid">
        <div className="lib-card">
          <div className="lib-card-head">
            <div className="lib-lang lib-js">JS</div>
            <div>
              <div className="lib-name">PolliLibJS</div>
              <div className="lib-meta">~3,700 lines · 14 modules · 100% complete</div>
            </div>
          </div>
          <pre className="lib-code"><code><span className="lib-c">{'// install'}</span>{`\n`}<span className="lib-k">npm</span>{` install pollylib\n\n`}<span className="lib-c">{'// generate'}</span>{`\n`}<span className="lib-k">const</span>{` reply = `}<span className="lib-k">await</span>{` unity.chat({\n  prompt: `}<span className="lib-s">{`'write a sonnet about syntax'`}</span>{`,\n  model: `}<span className="lib-s">{`'openai-large'`}</span>{`,\n  stream: `}<span className="lib-k">true</span>{`,\n});`}</code></pre>
          <ul className="lib-feats">
            <li>· text · image · TTS · STT · vision</li>
            <li>· streaming + exponential backoff</li>
            <li>· function calling / tool use</li>
          </ul>
        </div>

        <div className="lib-card">
          <div className="lib-card-head">
            <div className="lib-lang lib-py">PY</div>
            <div>
              <div className="lib-name">PolliLibPy</div>
              <div className="lib-meta">~5,700 lines · 13 modules · 100% complete</div>
            </div>
          </div>
          <pre className="lib-code"><code><span className="lib-c">{'# install'}</span>{`\n`}<span className="lib-k">pip</span>{` install pollylib\n\n`}<span className="lib-c">{'# generate'}</span>{`\n`}<span className="lib-k">reply</span>{` = unity.chat(\n  prompt=`}<span className="lib-s">{`'write a sonnet about syntax'`}</span>{`,\n  model=`}<span className="lib-s">{`'openai-large'`}</span>{`,\n  stream=`}<span className="lib-k">True</span>{`,\n)`}</code></pre>
          <ul className="lib-feats">
            <li>· python-idiomatic snake_case API</li>
            <li>· class-based, dict configs</li>
            <li>· compatible with python 3.7+</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

const WhyWeBuilt = () => (
  <section className="why">
    <div className="why-eyebrow">/ WHY WE BUILT THIS /</div>
    <div className="why-grid">
      <div className="why-text">
        <p>Most "AI tooling" today is a wrapper around someone else's API, with a paywall stapled on. We wanted to build the opposite: a working stack you can read, fork, run yourself, and actually understand.</p>
        <p>Unity isn't a product trying to grow. It's a tool we needed, written carefully, given away. The retry logic alone took three sleepless nights. The Python port took weeks. We did it because nothing else worked the way we wanted.</p>
        <p className="why-sig">— Hackall360 · Sponge · GFourteen</p>
      </div>
      <div className="why-stats">
        <div className="why-stat"><div className="why-num">9,400+</div><div className="why-lbl">lines of library code</div></div>
        <div className="why-stat"><div className="why-num">2</div><div className="why-lbl">languages, one API</div></div>
        <div className="why-stat"><div className="why-num">3</div><div className="why-lbl">people, no funding</div></div>
        <div className="why-stat"><div className="why-num">0</div><div className="why-lbl">telemetry, ever</div></div>
      </div>
    </div>
  </section>
);

const SocialProof = () => (
  <section className="proof">
    <div className="proof-row">
      <div className="proof-item"><div className="proof-glyph">★</div><div className="proof-num">GitHub</div><div className="proof-lbl">Unity-Lab-AI</div></div>
      <div className="proof-item"><div className="proof-glyph">⌬</div><div className="proof-num">15+</div><div className="proof-lbl">models supported</div></div>
      <div className="proof-item"><div className="proof-glyph">⛧</div><div className="proof-num">Discord</div><div className="proof-lbl">join the lab</div></div>
      <div className="proof-item"><div className="proof-glyph">∎</div><div className="proof-num">v2.1.5</div><div className="proof-lbl">current build</div></div>
    </div>
  </section>
);

const FooterArtifact = () => (
  <footer className="foot">
    <div className="foot-line foot-rule"></div>
    <div className="foot-grid">
      <div className="foot-block">
        <div className="foot-k">DEDICATION</div>
        <div className="foot-v">For everyone who'd rather ship something true than something safe.</div>
      </div>
      <div className="foot-block">
        <div className="foot-k">BUILD</div>
        <div className="foot-v foot-mono">unity-ai-lab @ v2.1.5<br/>commit 80c49fc · main</div>
      </div>
      <div className="foot-block">
        <div className="foot-k">CREATORS</div>
        <div className="foot-v foot-creators">
          <span><strong>HACKALL360</strong> <em>architect</em></span>
          <span><strong>SPONGE</strong> <em>libraries</em></span>
          <span><strong>GFOURTEEN</strong> <em>experiments</em></span>
        </div>
      </div>
      <div className="foot-block">
        <div className="foot-k">CREED</div>
        <div className="foot-v foot-creed">No filters. No telemetry. No apologies.<br/>Open source or it didn't happen.</div>
      </div>
    </div>
    <div className="foot-mark">
      <span>⛧</span>
      <span>UNITYAILAB.COM — MMXXVI</span>
      <span>⛧</span>
    </div>
  </footer>
);

window.LibraryShowcase = LibraryShowcase;
window.WhyWeBuilt = WhyWeBuilt;
window.SocialProof = SocialProof;
window.FooterArtifact = FooterArtifact;
