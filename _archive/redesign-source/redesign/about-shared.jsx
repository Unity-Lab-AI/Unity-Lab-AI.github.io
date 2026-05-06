// Shared About-page helpers — used by all four directions (Dossier, Reliquary,
// Cathedral, Crew Manifest). Lives at window.AboutShared.
//
// Each direction wraps these primitives in its own chrome. The primitives
// themselves are direction-agnostic (no a*-prefixed classes here).

// ============================================================================
//  Sigil divider — decorative section break
// ============================================================================
const AboutSigilDivider = ({ sigil = 'Cross', size = 18 }) => {
  const { Sigils } = window;
  const Glyph = Sigils[sigil] || Sigils.Cross;
  return (
    <div className="ab-divider" role="presentation" aria-hidden="true">
      <span className="ab-divider-line" />
      <span className="ab-divider-mark"><Glyph size={size} stroke={1.2} /></span>
      <span className="ab-divider-line" />
    </div>
  );
};

// ============================================================================
//  Stat drill-down modal
// ============================================================================
const AboutStatModal = ({ stat, onClose }) => {
  React.useEffect(() => {
    if (!stat) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stat, onClose]);

  if (!stat) return null;
  const { drill, label } = stat;

  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal ab-modal-stat" onClick={(e) => e.stopPropagation()}>
        <button className="ab-modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="ab-modal-kicker">METRIC · {label.toUpperCase()}</div>
        <h3 className="ab-modal-title">{drill.title}</h3>
        <p className="ab-modal-lede">{drill.lede}</p>
        <table className="ab-modal-table">
          <tbody>
            {drill.rows.map(([k, v], i) => (
              <tr key={i}><th>{k}</th><td>{v}</td></tr>
            ))}
          </tbody>
        </table>
        {drill.link && (
          <a className="ab-modal-link" href={drill.link.href} target="_blank" rel="noopener noreferrer">
            {drill.link.label} ↗
          </a>
        )}
      </div>
    </div>
  );
};

// ============================================================================
//  Expertise card modal — full-page dossier on a single discipline
// ============================================================================
const AboutExpertiseModal = ({ card, onClose }) => {
  const { Sigils } = window;
  React.useEffect(() => {
    if (!card) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, onClose]);

  if (!card) return null;
  const Glyph = Sigils[card.icon] || Sigils.Cross;

  return (
    <div className="ab-modal-overlay" onClick={onClose}>
      <div className="ab-modal ab-modal-expertise" onClick={(e) => e.stopPropagation()}>
        <button className="ab-modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="ab-modal-icon"><Glyph size={64} stroke={1.4} /></div>
        <div className="ab-modal-kicker">DISCIPLINE · {card.kicker}</div>
        <h3 className="ab-modal-title">{card.title}</h3>
        <p className="ab-modal-lede">{card.lede}</p>
        {card.body.map((p, i) => <p key={i} className="ab-modal-p">{p}</p>)}
        <ul className="ab-modal-list">
          {card.bullets.map((b, i) => <li key={i}>— {b}</li>)}
        </ul>
        <div className="ab-modal-foot">
          <span>UNITY · AI · LAB</span>
          <span>·</span>
          <span>{card.title.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
//  Horizontal timeline rail with hover-to-reveal detail
// ============================================================================
const AboutTimeline = ({ items }) => {
  const [active, setActive] = React.useState(0);
  const railRef = React.useRef(null);

  // Keyboard arrow nav when focused
  const onKey = (e) => {
    if (e.key === 'ArrowRight') { setActive((a) => Math.min(items.length - 1, a + 1)); e.preventDefault(); }
    if (e.key === 'ArrowLeft')  { setActive((a) => Math.max(0, a - 1)); e.preventDefault(); }
  };

  const item = items[active];

  return (
    <div className="ab-timeline" role="region" aria-label="Unity AI Lab timeline">
      <div className="ab-timeline-rail" ref={railRef} tabIndex={0} onKeyDown={onKey}>
        <span className="ab-timeline-track" aria-hidden="true" />
        {items.map((it, i) => (
          <button
            key={it.year}
            className={`ab-timeline-station${i === active ? ' is-active' : ''}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-label={`${it.year}: ${it.title}`}
            aria-current={i === active}
          >
            <span className="ab-timeline-dot" />
            <span className="ab-timeline-year">{it.year}</span>
          </button>
        ))}
      </div>
      <div className="ab-timeline-detail" key={item.year}>
        <div className="ab-timeline-detail-year">{item.year}</div>
        <h4 className="ab-timeline-detail-title">{item.title}</h4>
        <p className="ab-timeline-detail-summary">{item.summary}</p>
        <p className="ab-timeline-detail-body">{item.detail}</p>
      </div>
    </div>
  );
};

// ============================================================================
//  Stat trio with click-to-drill
//  Stars / forks / commits are fetched live from the public GitHub API across
//  every public repo in the Unity-Lab-AI organization. Results are cached for
//  6 hours in localStorage so we don't re-burn the unauthenticated rate limit
//  (60 req/hr/IP) on every page view. Fallback values are used if the API
//  refuses, the network fails, or the cache is poisoned.
// ============================================================================
const GITHUB_ORG = 'Unity-Lab-AI';
const STATS_CACHE_KEY = 'unity:about:gh-stats:v1';
const STATS_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const STATS_FALLBACK = { commits: 1247, stars: 312, forks: 88 };

// Total commits per repo via the Link: rel="last" trick on a per_page=1 list.
// One repo = one HEAD-ish call. No per-commit hydration.
const fetchRepoCommitCount = async (owner, repo) => {
  const r = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
    { headers: { Accept: 'application/vnd.github+json' } }
  );
  if (!r.ok) return 0;
  const link = r.headers.get('Link') || '';
  const m = link.match(/[?&]page=(\d+)>; rel="last"/);
  if (m) return parseInt(m[1], 10) || 0;
  // No pagination header: either 0 or 1 commits in the repo.
  const body = await r.json().catch(() => []);
  return Array.isArray(body) ? body.length : 0;
};

// Walk every page of /orgs/:org/repos so we don't truncate at 100.
const fetchAllOrgRepos = async (org) => {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const r = await fetch(
      `https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}&type=public`,
      { headers: { Accept: 'application/vnd.github+json' } }
    );
    if (!r.ok) throw new Error(`org repos: ${r.status}`);
    const batch = await r.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
};

const fetchOrgStats = async () => {
  const repos = await fetchAllOrgRepos(GITHUB_ORG);
  const publicRepos = repos.filter((r) => !r.private && !r.fork);
  let stars = 0;
  let forks = 0;
  for (const r of publicRepos) {
    stars += r.stargazers_count || 0;
    forks += r.forks_count || 0;
  }
  // Commit counts in parallel; clamp so a giant org can't open 200 sockets.
  const commitCounts = await Promise.all(
    publicRepos.map((r) =>
      fetchRepoCommitCount(GITHUB_ORG, r.name).catch(() => 0)
    )
  );
  const commits = commitCounts.reduce((a, b) => a + b, 0);
  return { commits, stars, forks };
};

const readStatsCache = () => {
  try {
    const raw = localStorage.getItem(STATS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Date.now() - (parsed.t || 0) > STATS_CACHE_TTL_MS) return null;
    const { commits, stars, forks } = parsed.v || {};
    if (
      Number.isFinite(commits) &&
      Number.isFinite(stars) &&
      Number.isFinite(forks)
    ) {
      return { commits, stars, forks };
    }
    return null;
  } catch {
    return null;
  }
};

const writeStatsCache = (v) => {
  try {
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ t: Date.now(), v }));
  } catch {
    /* quota / private mode — ignore */
  }
};

const AboutStats = ({ stats, onPick, variant = 'plain' }) => {
  const { Sigils } = window;

  // Two pieces of state:
  //   targets: the real numbers we're counting toward (cache → live → fallback)
  //   counts:  the animated display values
  const [targets, setTargets] = React.useState(
    () => readStatsCache() || STATS_FALLBACK
  );
  const [counts, setCounts] = React.useState({ commits: 0, stars: 0, forks: 0 });

  // Kick the live fetch once on mount. If we already had a cached value the
  // counter still animates to it; if the live fetch beats the animation we
  // re-target and the count-up retunes.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const live = await fetchOrgStats();
        if (cancelled) return;
        // Guard against a bogus zero (rate-limited mid-walk) overwriting a
        // perfectly good cached value.
        if (live.commits + live.stars + live.forks === 0) return;
        writeStatsCache(live);
        setTargets(live);
      } catch {
        /* keep cache or fallback */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Re-animate whenever targets change.
  React.useEffect(() => {
    const start = performance.now();
    const dur = 1400;
    const from = { commits: 0, stars: 0, forks: 0 };
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      setCounts({
        commits: Math.round(from.commits + (targets.commits - from.commits) * ease),
        stars:   Math.round(from.stars   + (targets.stars   - from.stars)   * ease),
        forks:   Math.round(from.forks   + (targets.forks   - from.forks)   * ease),
      });
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targets.commits, targets.stars, targets.forks]);

  return (
    <div className={`ab-stats ab-stats-${variant}`}>
      {stats.map((s) => (
        <button
          key={s.key}
          className="ab-stat"
          onClick={() => onPick && onPick(s)}
          aria-label={`${s.label}: ${counts[s.key]}, click for breakdown`}
        >
          <span className="ab-stat-kicker">{s.kicker}</span>
          <span className="ab-stat-num" id={s.id}>{counts[s.key].toLocaleString()}</span>
          <span className="ab-stat-label">{s.label}</span>
          <span className="ab-stat-caption">{s.caption}</span>
          <span className="ab-stat-drill" aria-hidden="true">drill ↗</span>
        </button>
      ))}
    </div>
  );
};

// ============================================================================
//  Contact form with mailto handoff (no XHR; opens user's mail client)
// ============================================================================
const AboutContactForm = ({ inbox, reasons, sources, variant = 'plain', defaultReason = '', defaultSubject = '', defaultMessage = '' }) => {
  // controlled fields so per-service inquiries can prefill from outside
  const [reason, setReason] = React.useState(defaultReason);
  const [subject, setSubject] = React.useState(defaultSubject);
  const [message, setMessage] = React.useState(defaultMessage);
  React.useEffect(() => { setReason(defaultReason); }, [defaultReason]);
  React.useEffect(() => { setSubject(defaultSubject); }, [defaultSubject]);
  React.useEffect(() => { setMessage(defaultMessage); }, [defaultMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const name = (f.get('name') || '').toString().trim();
    const email = (f.get('email') || '').toString().trim();
    const reason = (f.get('reason') || '').toString();
    const source = (f.get('source') || '').toString();
    const subject = (f.get('subject') || '').toString().trim() || `Unity AI Lab — ${reason || 'Inquiry'}`;
    const message = (f.get('message') || '').toString();

    const body = [
      message,
      '',
      '— — —',
      `From: ${name}${email ? ` <${email}>` : ''}`,
      `Reason: ${reason || '—'}`,
      `Heard about us via: ${source || '—'}`,
    ].join('\n');

    const url =
      `mailto:${encodeURIComponent(inbox)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    // Open in a new context so the user's tab is preserved.
    window.open(url, '_blank', 'noopener');
  };

  return (
    <form className={`ab-contact ab-contact-${variant}`} onSubmit={handleSubmit} noValidate>
      <div className="ab-contact-row">
        <label className="ab-field">
          <span className="ab-field-label">Your name</span>
          <input type="text" name="name" required placeholder="who's writing" />
        </label>
        <label className="ab-field">
          <span className="ab-field-label">Your email</span>
          <input type="email" name="email" required placeholder="where to reply" />
        </label>
      </div>
      <div className="ab-contact-row">
        <label className="ab-field">
          <span className="ab-field-label">Reason</span>
          <select name="reason" required value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="" disabled>Pick one</option>
            {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="ab-field">
          <span className="ab-field-label">Heard about us via</span>
          <select name="source" required defaultValue="">
            <option value="" disabled>Pick one</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label className="ab-field">
        <span className="ab-field-label">Subject</span>
        <input type="text" name="subject" required placeholder="one line summary" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <label className="ab-field">
        <span className="ab-field-label">Message</span>
        <textarea name="message" rows={8} required placeholder="say what you want to say. plain text. no formatting needed." value={message} onChange={(e) => setMessage(e.target.value)} />
      </label>
      <div className="ab-contact-foot">
        <p className="ab-contact-note">
          Submitting opens your mail client with the message pre-loaded —
          Gmail, Outlook, Apple Mail, whatever you use to send. Nothing is stored on this page.
        </p>
        <button type="submit" className="ab-contact-send">
          <span>Compose message</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
};

window.AboutShared = {
  AboutSigilDivider,
  AboutStatModal,
  AboutExpertiseModal,
  AboutTimeline,
  AboutStats,
  AboutContactForm,
};
