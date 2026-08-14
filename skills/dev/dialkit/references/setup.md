# DialKit setup

Already done in this repo — `dialkit@^1.4.3` is a devDependency and
`components/dev/DialKitRoot.tsx` is mounted in `app/layout.tsx`. Read this when the mount
breaks, or when setting DialKit up somewhere else.

## Install

```bash
npm install --save-dev dialkit
```

`motion` is already here at `^12.23.14`, so the upstream `npm install dialkit motion` is half
redundant.

`--save-dev` is load-bearing: the package is 3.8MB unpacked and hides itself in production at
*runtime*, not by tree-shaking. Thoven runs on kids' laptops.

## Mount

Upstream says put `'use client'` and `<DialRoot />` directly in the root layout. **That fails
here** — `app/layout.tsx` calls `headers()` for the CSP nonce, which makes it a server
component, and `'use client'` on it breaks the build.

The panel gets a client wrapper instead, split across two files:

```tsx
// components/dev/DialKitPanel.tsx — the only module that touches the package
'use client'
import 'dialkit/styles.css'
import { DialRoot } from 'dialkit'
export default function DialKitPanel() { return <DialRoot /> }
```

```tsx
// components/dev/DialKitRoot.tsx — what the layout mounts
'use client'
import dynamic from 'next/dynamic'

const DialKitPanel = dynamic(() => import('./DialKitPanel'), { ssr: false })

export function DialKitRoot() {
  if (process.env.NODE_ENV !== 'development') return null
  return <DialKitPanel />
}
```

Three details carry the weight:

- **The split.** A static `import { DialRoot } from 'dialkit'` ships all 3.8MB plus the
  stylesheet to every visitor, because the package's own production hiding happens at runtime.
  Isolating both in a module reached only through `dynamic()` is what keeps them in a lazy
  chunk. Importing the CSS *inside* the `dynamic()` factory instead looks tidier but fails
  typecheck — TS can't resolve a stylesheet through `await import()`.
- **`{ ssr: false }`** — the panel is browser-only.
- **`process.env.NODE_ENV`** — a compile-time constant, so the whole branch is eliminated from
  a production build.

`productionEnabled` stays unset; leaving it alone is what keeps the panel dev-only.

In `app/layout.tsx` it mounts at body level as a **sibling** of `{children}`, beside `<Toaster />`
and `<CookieConsentBanner />`. A `DialRoot` that wraps `{children}` remounts the tree on every
panel change.

`DialRoot` props, if the wrapper needs them: `position` (`'top-right'`), `defaultOpen` (`true`),
`mode` (`'popover' | 'inline'`), `theme` (`'system'`), `onOpenChange`.

## Confirm it works

`npm run dev`, load any page, and the panel appears in the top-right. It renders empty until a
component calls `useDialKit` — an empty panel means the mount is correct and there is nothing to
dial yet.

If the panel mounts but renders unstyled, check the CSP in `middleware.ts`: the nonce covers
scripts, and DialKit injects its own inline styles.
