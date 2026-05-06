// uwd-helpers.jsx — small reusable docs primitives.

const UwdSection = ({ id, num, title, lede, children }) => (
  <section id={id} className="uwd-section uwd-anchor">
    <header className="uwd-section-head">
      <div className="uwd-section-num">{num}</div>
      <h2>{title}</h2>
      {lede && <p className="uwd-section-lede">{lede}</p>}
    </header>
    {children}
  </section>
);

const UwdSubHead = ({ title, meta, note }) => (
  <>
    <div className="uwd-sub-head">
      <h3>{title}</h3>
      {meta && <span className="uwd-sub-meta">{meta}</span>}
    </div>
    {note && <p className="uwd-sub-note">{note}</p>}
  </>
);

const UwdDemo = ({ tag, padTight, flex, stack, style, children }) => {
  const classes = ['uwd-demo'];
  if (padTight) classes.push('uwd-demo-pad-tight');
  if (flex) classes.push('uwd-demo-flex');
  if (stack) classes.push('uwd-demo-stack');
  return (
    <div className={classes.join(' ')} style={style}>
      {tag && <span className="uwd-demo-tag">{tag}</span>}
      {children}
    </div>
  );
};

// Code block with click-to-copy. Children should be the raw code as a string;
// children rendered visually can use spans for syntax tinting.
const UwdCode = ({ raw, children }) => {
  const [copied, setCopied] = React.useState(false);
  const onCopy = () => {
    const text = raw != null ? raw : (typeof children === 'string' ? children : '');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      });
    }
  };
  return (
    <div className="uwd-code">
      <button className={'uwd-copy' + (copied ? ' copied' : '')} onClick={onCopy} type="button">
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre><code>{children}</code></pre>
    </div>
  );
};

const UwdSwatch = ({ name, token, hex, css }) => (
  <div className="uwd-swatch">
    <div className="uwd-swatch-chip" style={{ background: css || hex }}></div>
    <div className="uwd-swatch-meta">
      <div className="uwd-swatch-name">{name}</div>
      <div className="uwd-swatch-token">--{token}</div>
      {hex && <div className="uwd-swatch-hex">{hex}</div>}
    </div>
  </div>
);

const UwdComponent = ({ name, tags, desc, children }) => (
  <div className="uwd-component">
    <div className="uwd-component-head">
      <div className="uwd-component-name">{name}</div>
      {tags && tags.length > 0 && (
        <div className="uwd-component-tags">
          {tags.map((t) => <span key={t} className="uwd-tag">{t}</span>)}
        </div>
      )}
    </div>
    {desc && <p className="uwd-component-desc">{desc}</p>}
    {children}
  </div>
);

const UwdDoDont = ({ doItems = [], dontItems = [] }) => (
  <div className="uwd-do-dont">
    <div className="uwd-do">
      <div className="uwd-do-k">⁘ Do</div>
      <ul>{doItems.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
    <div className="uwd-dont">
      <div className="uwd-dont-k">× Don't</div>
      <ul>{dontItems.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
  </div>
);

const UwdBullets = ({ items }) => (
  <ul className="uwd-bullets">
    {items.map((it, i) => (
      <li key={i}>
        <span className="uwd-bullets-k">{it.k}</span>
        <span className="uwd-bullets-v">{it.v}</span>
      </li>
    ))}
  </ul>
);

const UwdVersion = ({ num, date, tag, items }) => (
  <article className="uwd-version">
    <header className="uwd-version-head">
      <span className="uwd-version-num">{num}</span>
      <span className="uwd-version-date">{date}</span>
      {tag && <span className="uwd-version-tag">{tag}</span>}
    </header>
    <ul>
      {items.map((it, i) => (
        <li key={i}>
          {it.kind && <span className="uwd-version-kind">{it.kind}</span>}
          {it.text}
        </li>
      ))}
    </ul>
  </article>
);

Object.assign(window, {
  UwdSection, UwdSubHead, UwdDemo, UwdCode,
  UwdSwatch, UwdComponent, UwdDoDont, UwdBullets, UwdVersion,
});
