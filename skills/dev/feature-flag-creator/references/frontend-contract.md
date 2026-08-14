# Frontend flag contract (Next.js — thoven/frontend)

All edits center on `lib/feature-flags.ts`. The admin panel (`app/admin/settings/page.tsx`) is data-driven from the backend, so there is nothing to register there — a remote flag appears automatically once its backend row exists.

## Remote flag (default path)

Touch these, in order:

### 1. `lib/feature-flags.ts` — `RemoteFlags` interface
Add the key (keep alphabetical-ish with the neighbors; the `[key: string]: boolean` index stays last):
```ts
export interface RemoteFlags {
  teacher_classroom_enabled: boolean
  // ...existing...
  <key>: boolean            // ← add, with a short trailing comment on what it gates
  [key: string]: boolean
}
```

### 2. `lib/feature-flags.ts` — `DEFAULT_FLAGS`
Ships dark. This default is the production failsafe if the backend fetch fails:
```ts
export const DEFAULT_FLAGS: RemoteFlags = {
  teacher_classroom_enabled: false,
  // ...existing...
  <key>: false,            // ← add
}
```

### 3. (Optional) `ACCOUNT_OVERRIDES` — targeted early access
Only if a specific person needs it before global rollout:
```ts
const ACCOUNT_OVERRIDES: Record<string, Partial<RemoteFlags>> = {
  'someone@thoven.co': { <key>: true },
}
```

### 4. Consumption idiom (show the operator; don't invent call sites)
In a client component (`'use client'`):
```ts
const { flags, loading } = useFeatureFlags()   // from '@/lib/use-feature-flags'
if (!loading && !flags.<key>) return null      // gate
```

### 5. `lib/feature-flags.test.ts` — guard test
Assert the dark default (this is the failsafe invariant the suite protects):
```ts
it('<key> ships dark by default', () => {
  expect(DEFAULT_FLAGS.<key>).toBe(false)
})
```
For a consuming component's test, mock the hook:
```ts
vi.mock('@/lib/use-feature-flags', () => ({
  useFeatureFlags: () => ({ flags: { <key>: true }, loading: false }),
}))
```

### 6. `.claude/docs/API_AND_AUTH.md` — flag inventory
Bump the remote-flag count and add the row to the flag table. Keeping the count current is how drift gets caught.

### Dev override (mention, no code change)
`localStorage.setItem('ff_<key>', 'true')` (or `'false'`) — dev mode only, wins over everything.

## Local flag (exception only — must be justified)

Only for a build-time/SSR concern with no runtime-toggle need. State clearly that it will NOT appear in the admin panel. Follow the existing pattern:
```ts
/** <what it gates>. Default: true in dev, false in prod. Override: NEXT_PUBLIC_FEATURE_<KEY>. */
export const is<Key>Enabled = (): boolean => {
  const envOverride = process.env.NEXT_PUBLIC_FEATURE_<KEY>
  if (envOverride !== undefined) return envOverride === 'true'
  const isProduction = process.env.REPLIT_DEPLOYMENT === '1'
  return !isProduction
}
```
Still update `.claude/docs/API_AND_AUTH.md` (local-flag count + row).

## Verify
- `npm run type-check`
- `npm run test:run -- lib/feature-flags.test.ts`

## Then print the cross-repo reminder
> ⚠️ `<key>` is inert until a backend `feature_flags` row with the same key exists. Run this skill in the Rails repo (`thoven/backend`) to create the row (+ any server-side gating). Backend checklist: `references/backend-contract.md`.
