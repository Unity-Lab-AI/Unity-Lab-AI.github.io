# Saved stubs

Two component stubs preserved here for future use, separate from the main D direction.

## terminal-section.jsx (from Variation A)
Live-typing terminal where Unity introduces itself. Self-contained React component.
- Mount as `<TerminalHero />` after loading the script
- Styles live in `variations-stubs.css` under the `.vA-*` prefix
- StrictMode-safe (cancelled flag + bounds check)

## chatbot-section.jsx (from Variation C)
Embedded Unity chat with streaming responses. Calls `window.claude.complete`, falls back to stock replies on error.
- Mount as `<LiveDemoHero />` (despite the name, the right-side chat panel is the reusable artifact)
- Styles live in `variations-stubs.css` under the `.vC-*` prefix
- For embedding outside this canvas, you'd extract just the `vC-right` chrome+stream+input section into its own component

## To revive
Copy the relevant `.vA-*` or `.vC-*` blocks from `variations-stubs.css` into your active stylesheet and load the JSX file with `<script type="text/babel" src="...">`.
