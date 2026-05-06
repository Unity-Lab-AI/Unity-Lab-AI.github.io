// Shared SVG sigils & glyphs — custom marks for Unity, CodeWringer, Lab, etc.
// Drop-in inline SVGs that scale with currentColor.

const Sigils = {
  // Ouroboros — serpent eating its tail; unfiltered AI / cycle of knowledge
  Unity: ({ size = 64, stroke = 1.5 }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {/* serpent body — open ring, head meets tail */}
      <path d="M 36 12 A 22 22 0 1 0 50 22" />
      {/* inner detail along body */}
      <path d="M 16 22 Q 14 32 16 42" strokeOpacity="0.45" />
      <path d="M 22 14 Q 32 12 42 14" strokeOpacity="0.45" />
      <path d="M 48 24 Q 52 32 48 42" strokeOpacity="0.45" />
      <path d="M 22 50 Q 32 52 42 50" strokeOpacity="0.45" />
      {/* head — angled, biting tail */}
      <path d="M 50 22 L 42 18 L 38 24 L 36 12 Z" fill="currentColor" stroke="none" />
      {/* eye */}
      <circle cx="44" cy="20" r="1" fill="#0a0a0a" stroke="none" />
      {/* scales — small ticks around the body */}
      <line x1="13" y1="32" x2="10" y2="32" strokeOpacity="0.4" />
      <line x1="32" y1="13" x2="32" y2="10" strokeOpacity="0.4" />
      <line x1="51" y1="32" x2="54" y2="32" strokeOpacity="0.4" />
      <line x1="32" y1="51" x2="32" y2="54" strokeOpacity="0.4" />
    </svg>
  ),
  // Computer with binary matrix — code optimization
  Wringer: ({ size = 64, stroke = 1.5 }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {/* monitor frame */}
      <rect x="8" y="10" width="48" height="34" rx="2" />
      <rect x="12" y="14" width="40" height="26" strokeOpacity="0.45" />
      {/* stand */}
      <line x1="32" y1="44" x2="32" y2="52" />
      <line x1="22" y1="54" x2="42" y2="54" strokeLinecap="round" />
      {/* binary matrix glyphs on screen */}
      <g fontFamily="ui-monospace, Menlo, monospace" fontSize="6.5" fill="currentColor" stroke="none" letterSpacing="0.5">
        <text x="15" y="22">1</text>
        <text x="22" y="22" opacity="0.55">0</text>
        <text x="29" y="22">1</text>
        <text x="36" y="22" opacity="0.55">1</text>
        <text x="43" y="22">0</text>
        <text x="15" y="30" opacity="0.55">0</text>
        <text x="22" y="30">1</text>
        <text x="29" y="30">0</text>
        <text x="36" y="30" opacity="0.55">1</text>
        <text x="43" y="30">1</text>
        <text x="15" y="38">1</text>
        <text x="22" y="38" opacity="0.55">1</text>
        <text x="29" y="38">0</text>
        <text x="36" y="38">1</text>
        <text x="43" y="38" opacity="0.55">0</text>
      </g>
    </svg>
  ),
  // Lab flask with pour — experimental edge
  Flask: ({ size = 64, stroke = 1.5 }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={stroke}>
      <path d="M24 8 L24 24 L12 50 Q12 56 18 56 L46 56 Q52 56 52 50 L40 24 L40 8" strokeLinejoin="round" />
      <line x1="20" y1="8" x2="44" y2="8" strokeLinecap="round" />
      <path d="M16 42 L48 42" strokeOpacity="0.5" />
      <circle cx="26" cy="46" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="36" cy="48" r="1" fill="currentColor" stroke="none" />
      <circle cx="32" cy="44" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  // Octagonal seal — used as section ornament
  Seal: ({ size = 80, stroke = 1 }) => (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth={stroke}>
      <polygon points="40,4 60,12 70,28 70,52 60,68 40,76 20,68 10,52 10,28 20,12" />
      <polygon points="40,12 54,18 62,30 62,50 54,62 40,68 26,62 18,50 18,30 26,18" strokeOpacity="0.5" />
      <circle cx="40" cy="40" r="6" />
      <line x1="40" y1="22" x2="40" y2="58" strokeOpacity="0.4" />
      <line x1="22" y1="40" x2="58" y2="40" strokeOpacity="0.4" />
    </svg>
  ),
  // Cross-pattée — gothic decorative divider element
  Cross: ({ size = 24, stroke = 1.2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}>
      <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="currentColor" />
    </svg>
  ),
  // Pentagonal node — for stat/metric displays
  Node: ({ size = 32, stroke = 1.2 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={stroke}>
      <polygon points="16,2 30,12 24,28 8,28 2,12" />
      <circle cx="16" cy="16" r="3" fill="currentColor" stroke="none" />
    </svg>
  ),
  // Security camera — secure systems
  Shield: ({ size = 64, stroke = 1.5 }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {/* camera body */}
      <rect x="14" y="18" width="32" height="16" rx="2" transform="rotate(-12 30 26)" />
      {/* lens cylinder protruding from front */}
      <rect x="40" y="20" width="10" height="12" rx="1" transform="rotate(-12 45 26)" />
      <circle cx="48" cy="26" r="3" fill="currentColor" stroke="none" transform="rotate(-12 45 26)" />
      {/* mounting arm + ceiling plate */}
      <line x1="22" y1="22" x2="22" y2="10" />
      <line x1="14" y1="10" x2="32" y2="10" />
      {/* recording light */}
      <circle cx="20" cy="28" r="1.4" fill="currentColor" stroke="none" />
      {/* field-of-view cone */}
      <path d="M 50 30 L 60 42 L 56 50 L 46 36 Z" strokeOpacity="0.4" />
      <path d="M 50 30 L 56 50" strokeOpacity="0.25" strokeDasharray="2 2" />
    </svg>
  ),
  // Robot head — agentic frameworks
  Robot: ({ size = 64, stroke = 1.5 }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {/* antenna */}
      <line x1="32" y1="4" x2="32" y2="12" />
      <circle cx="32" cy="4" r="2" fill="currentColor" stroke="none" />
      {/* head — boxy with chamfered top corners */}
      <path d="M 14 18 L 18 14 L 46 14 L 50 18 L 50 50 L 14 50 Z" />
      {/* face plate */}
      <rect x="20" y="22" width="24" height="14" strokeOpacity="0.4" />
      {/* eyes — square sensors */}
      <rect x="23" y="25" width="6" height="6" fill="currentColor" stroke="none" />
      <rect x="35" y="25" width="6" height="6" fill="currentColor" stroke="none" />
      {/* mouth grille */}
      <line x1="22" y1="42" x2="42" y2="42" />
      <line x1="22" y1="46" x2="42" y2="46" strokeOpacity="0.5" />
      {/* side bolts / ports */}
      <circle cx="14" cy="32" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="50" cy="32" r="1.5" fill="currentColor" stroke="none" />
      {/* ear-mount sensors */}
      <line x1="14" y1="26" x2="10" y2="26" />
      <line x1="14" y1="38" x2="10" y2="38" />
      <line x1="50" y1="26" x2="54" y2="26" />
      <line x1="50" y1="38" x2="54" y2="38" />
    </svg>
  ),
  // Tetris cubes — full stacks
  Stack: ({ size = 64, stroke = 1.5 }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinejoin="round">
      {/* L-piece bottom-left (3 cells stacked + 1 right) */}
      <rect x="8" y="44" width="12" height="12" />
      <rect x="20" y="44" width="12" height="12" />
      <rect x="8" y="32" width="12" height="12" />
      {/* T-piece top-right (3 horizontal + 1 down) */}
      <rect x="32" y="20" width="12" height="12" />
      <rect x="44" y="20" width="12" height="12" />
      <rect x="32" y="32" width="12" height="12" />
      <rect x="44" y="32" width="12" height="12" />
      {/* I-piece floating top-left */}
      <rect x="20" y="8" width="12" height="12" />
      <rect x="20" y="20" width="12" height="12" strokeOpacity="0.5" />
      {/* inner detail dots */}
      <circle cx="14" cy="50" r="1" fill="currentColor" stroke="none" />
      <circle cx="38" cy="38" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  // GitHub octocat — simplified mark
  GitHub: ({ size = 26, stroke = 0 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12c0 4.6 3 8.5 7.2 9.9.5.1.7-.2.7-.5v-1.9c-2.9.6-3.6-1.2-3.6-1.2-.5-1.2-1.2-1.5-1.2-1.5-1-.7.1-.7.1-.7 1.1.1 1.6 1.1 1.6 1.1 1 1.6 2.5 1.2 3.1.9.1-.7.4-1.2.7-1.5-2.3-.3-4.7-1.1-4.7-5.1 0-1.1.4-2 1.1-2.7-.1-.3-.5-1.4.1-2.8 0 0 .9-.3 2.9 1.1.8-.2 1.7-.3 2.6-.3.9 0 1.8.1 2.6.3 2-1.4 2.9-1.1 2.9-1.1.6 1.4.2 2.5.1 2.8.7.7 1.1 1.6 1.1 2.7 0 4-2.4 4.8-4.7 5.1.4.3.7.9.7 1.8v2.7c0 .3.2.6.7.5 4.2-1.4 7.2-5.3 7.2-9.9C22.5 6.2 17.8 1.5 12 1.5z" />
    </svg>
  ),
  // Discord — wordmark logo silhouette
  Discord: ({ size = 26, stroke = 0 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.2.4a18.4 18.4 0 0 0-6.4 0L8.6 3a19.8 19.8 0 0 0-4.9 1.4C.6 9 0 13.3.3 17.6a20 20 0 0 0 6 3l.5-.7c-.7-.2-1.4-.5-2-.9l.2-.1c4 1.8 8.3 1.8 12.2 0l.2.1c-.7.4-1.3.7-2 .9l.5.7a20 20 0 0 0 6-3c.3-5.1-.5-9.4-1.6-13.2zM8.5 14.8c-1.2 0-2.1-1.1-2.1-2.4S7.4 10 8.5 10s2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4zm7 0c-1.2 0-2.1-1.1-2.1-2.4S14.3 10 15.5 10s2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4z" />
    </svg>
  ),
  // Crossed wrenches — current build / tooling
  Wrenches: ({ size = 26, stroke = 1.6 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* wrench A — top-left to bottom-right */}
      <path d="M5 4.5a3 3 0 0 0 3.6 4.2l8.8 8.8a1.6 1.6 0 1 0 2.3-2.3L10.9 6.4A3 3 0 0 0 6.7 2.8L9 5.1 7.5 6.6 5.2 4.3z" />
      {/* wrench B — top-right to bottom-left, slightly smaller */}
      <path d="M19 4.5a3 3 0 0 1-3.6 4.2l-8.8 8.8a1.6 1.6 0 1 1-2.3-2.3L13.1 6.4A3 3 0 0 1 17.3 2.8L15 5.1l1.5 1.5 2.3-2.3z" strokeOpacity="0.55" />
    </svg>
  ),
};

window.Sigils = Sigils;
