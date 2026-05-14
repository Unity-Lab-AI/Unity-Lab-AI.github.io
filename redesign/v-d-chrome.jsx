// Variation D — Navbar & Visitor Counter

const NAV_LINKS = [
  { href: './ai', label: 'AI' },
  { href: './about', label: 'About' },
  { href: './apps', label: 'Apps' },
  { href: './services', label: 'Services' },
  { href: './projects', label: 'Projects' },
  { href: './downloads', label: 'Downloads' },
  { href: './contact', label: 'Contact' },
];

const GothicNavbar = () => {
  const { Sigils } = window;
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={'vD-nav' + (scrolled ? ' vD-nav-scrolled' : '')} role="navigation" aria-label="Main navigation">
      <div className="vD-nav-inner">
        <a href="./" className="vD-nav-brand" aria-label="Unity AI Lab home">
          <span className="vD-nav-mark"><Sigils.Unity size={26} stroke={1.4} /></span>
          <span className="vD-nav-name">UNITYAILAB</span>
        </a>

        <button
          className={'vD-nav-toggle' + (open ? ' on' : '')}
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span></span><span></span><span></span>
        </button>

        <ul className={'vD-nav-list' + (open ? ' open' : '')}>
          {NAV_LINKS.map((l) => {
            // Mark active link based on current path so each page's nav highlights itself.
            const path = (typeof window !== 'undefined' && window.location)
              ? window.location.pathname.replace(/\/+$/, '').toLowerCase()
              : '';
            const slug = l.href.replace(/^\.\//, '').toLowerCase();
            const isActive = slug && (path.endsWith('/' + slug) || path.endsWith('/' + slug + '.html'));
            return (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={isActive ? 'is-active' : undefined}
                >{l.label}</a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};

// Visitor counter
// - Public count uses abacus.jasoncameron.dev (free, no auth, simple GET)
// - Falls back to localStorage if the API is unreachable
// - Each browser only counts once per session via sessionStorage
const COUNTER_NAMESPACE = 'unityailab';
const COUNTER_KEY = 'gothic-landing';
const HIT_URL = `https://abacus.jasoncameron.dev/hit/${COUNTER_NAMESPACE}/${COUNTER_KEY}`;
const GET_URL = `https://abacus.jasoncameron.dev/get/${COUNTER_NAMESPACE}/${COUNTER_KEY}`;

const fetchCount = async () => {
  // Bump the count once per browser session, otherwise just read.
  const sessionKey = 'unity-counted-' + COUNTER_KEY;
  const alreadyCounted = sessionStorage.getItem(sessionKey);
  const url = alreadyCounted ? GET_URL : HIT_URL;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('counter http ' + res.status);
    const json = await res.json();
    if (typeof json.value === 'number') {
      if (!alreadyCounted) sessionStorage.setItem(sessionKey, '1');
      localStorage.setItem('unity-last-count', String(json.value));
      return json.value;
    }
    throw new Error('counter shape');
  } catch (err) {
    // fallback — last known value
    const last = parseInt(localStorage.getItem('unity-last-count') || '0', 10);
    return Number.isFinite(last) && last > 0 ? last : null;
  }
};

const formatCount = (n) => {
  if (n == null) return '———';
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (abs >= 1e3) return (n / 1e3).toFixed(2).replace(/\.?0+$/, '') + 'K';
  return n.toLocaleString('en-US');
};

const GothicVisitorCounter = () => {
  const { Sigils } = window;
  const [count, setCount] = React.useState(null);
  const [state, setState] = React.useState('loading'); // loading | live | offline
  const [displayed, setDisplayed] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    fetchCount().then((n) => {
      if (cancelled) return;
      if (n == null) {
        setState('offline');
        setCount(null);
      } else {
        setState('live');
        setCount(n);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Roll-up animation when the count resolves (only for small numbers — abbreviations snap)
  React.useEffect(() => {
    if (count == null) { setDisplayed(0); return; }
    if (count >= 1000) { setDisplayed(count); return; }
    const start = performance.now();
    const duration = 1400;
    const from = 0;
    const to = count;
    let raf;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplayed(Math.round(from + (to - from) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [count]);

  const label =
    state === 'loading' ? 'CONJURING' :
    state === 'offline' ? 'OFFLINE' :
    'WITNESSED BY';

  return (
    <div className="vD-counter" role="status" aria-live="polite">
      <div className="vD-counter-rule"><span></span><Sigils.Cross size={10} /><span></span></div>
      <div className="vD-counter-label">{label}</div>
      <div className={'vD-counter-num' + (state === 'live' ? ' on' : '')}>
        {state === 'loading' ? '———' : formatCount(displayed)}
      </div>
      <div className="vD-counter-suffix">souls</div>
      <div className="vD-counter-sub">unique visitors to the lab · all time</div>
    </div>
  );
};

window.GothicNavbar = GothicNavbar;
window.GothicVisitorCounter = GothicVisitorCounter;
