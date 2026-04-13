Premium Glass UI — Usage & Integration (Design-only)
===============================================

Files added (design assets only):
- `premium-glass-theme.css` — main theme (glassmorphism + dark futuristic background)
- `particles-fx.js` — lightweight canvas particle background (mouse-reactive)
- `reflection.css` — helper for glass reflection sheen (`.glass-shine`)

How to test (non-destructive)
1. Open any frontend HTML page (for example `Frontend/LoginPage/login.html`).
2. Inject the assets from the browser console (temporary):

```js
// inject CSS
var l = document.createElement('link'); l.rel='stylesheet'; l.href='../premium-glass-theme.css'; document.head.appendChild(l);
var r = document.createElement('link'); r.rel='stylesheet'; r.href='../reflection.css'; document.head.appendChild(r);
// inject particles script
var s = document.createElement('script'); s.src='../particles-fx.js'; s.defer=true; document.body.appendChild(s);
```

If you prefer permanent linking, add these lines inside the page `<head>` (after existing CSS links):

```html
<link rel="stylesheet" href="../premium-glass-theme.css">
<link rel="stylesheet" href="../reflection.css">
```

And before `</body>` (optional, particles):

```html
<script defer src="../particles-fx.js"></script>
```

How to apply glass sheen to a panel
----------------------------------
Add the class `glass-shine` to any container you want to have the reflective sweep on hover.

Example:
```html
<div class="login-card glass-shine"> ... </div>
```

Performance & Accessibility
- The particle script respects `prefers-reduced-motion` and will not run for users who prefer reduced motion.
- The CSS uses `backdrop-filter`; older browsers may not support this — the panels will still be translucent and functional.

Design notes
- The theme uses layered radial gradients for depth and a subtle sheen animation. Buttons and inputs follow glass style with soft purple glows.
- The cracked-overlay is extremely subtle and purely decorative; you can add `class="cracked-overlay"` inside any panel to enable it.

Rollout suggestion
1. Test pages locally by injecting assets (console method above).
2. If satisfied, add the `<link>` and `<script>` tags to the pages you want to style (or import into your React client styles).
3. Keep original CSS files in place; these theme files override visuals and are non-destructive.

If you'd like, I can now:
- Inject the theme links automatically into all `Frontend/*.html` pages (I will only add `<link>` and `<script>` tags), or
- Import the theme into `EvalTrack_System/client` (React) so the new React site matches this design.
