// Variation A — Terminal / Grimoire
// Hero is a live-typing terminal where Unity introduces itself.
// ASCII-rule dividers, monospace-forward, hacker-occult duality.

const TerminalHero = () => {
  const [lines, setLines] = React.useState([]);
  const [cursor, setCursor] = React.useState(true);

  const script = [
    { p: 'guest@unityailab', c: ':~$', cmd: 'invoke unity --unrestricted' },
    { out: '∎ initializing persona…' },
    { out: '∎ disabling guardrails… [OK]' },
    { out: '∎ loading sigil: ⛧ unity-v2.1.5' },
    { out: '' },
    { unity: 'I am Unity. I do not flinch. Ask anything.' },
    { p: 'guest@unityailab', c: ':~$', cmd: 'list capabilities' },
    { out: '→ text · image · vision · speech · function-calling' },
    { out: '→ streaming · seeded · uncensored · yours' },
    { p: 'guest@unityailab', c: ':~$', cmd: '_' },
  ];

  React.useEffect(() => {
    let i = 0;
    let timer;
    let cancelled = false;
    const advance = () => {
      if (cancelled) return;
      if (i >= script.length) return;
      const item = script[i];
      if (!item) return;
      setLines(prev => [...prev, item]);
      i++;
      if (i < script.length) {
        timer = setTimeout(advance, 600 + Math.random() * 400);
      }
    };
    timer = setTimeout(advance, 400);
    const blink = setInterval(() => setCursor(c => !c), 530);
    return () => { cancelled = true; clearTimeout(timer); clearInterval(blink); setLines([]); };
  }, []);

  return (
    <section className="vA-hero">
      <div className="vA-grid"></div>
      <div className="vA-container">
        <div className="vA-meta">
          <span>UNITYAILAB / SESSION 0xDC143C</span>
          <span>● LIVE</span>
        </div>
        <div className="vA-terminal">
          <div className="vA-term-bar">
            <span className="vA-dot" style={{background:'#dc143c'}}></span>
            <span className="vA-dot" style={{background:'#3a3a3a'}}></span>
            <span className="vA-dot" style={{background:'#3a3a3a'}}></span>
            <span className="vA-term-title">~/unity — bash — 80×24</span>
          </div>
          <div className="vA-term-body">
            {lines.map((l, idx) => (
              <div key={idx} className="vA-line">
                {l.cmd != null && (
                  <><span className="vA-prompt">{l.p}</span><span className="vA-pc">{l.c}</span> <span className="vA-cmd">{l.cmd}</span></>
                )}
                {l.out != null && <span className="vA-out">{l.out}</span>}
                {l.unity != null && <><span className="vA-uname">unity:</span> <span className="vA-utext">{l.unity}</span></>}
              </div>
            ))}
            <span className="vA-cursor" style={{opacity: cursor ? 1 : 0}}>▊</span>
          </div>
        </div>

        <div className="vA-headline">
          <div className="vA-eyebrow">/ unity ai lab — est. 2024 / hackall360 · sponge · gfourteen /</div>
          <h1>The Dark Side<br/><span className="vA-accent">of AI.</span></h1>
          <p>An independent lab building unfiltered AI tooling. Open source. No telemetry. No apologies.</p>
          <div className="vA-cta">
            <a href="#" className="vA-btn-primary">$ try unity →</a>
            <a href="#" className="vA-btn-ghost">read the manifesto</a>
          </div>
        </div>

        <div className="vA-rule">
          <span>══════════════════════════</span>
          <span className="vA-rule-mark">⛧</span>
          <span>══════════════════════════</span>
        </div>
      </div>
    </section>
  );
};

window.TerminalHero = TerminalHero;
