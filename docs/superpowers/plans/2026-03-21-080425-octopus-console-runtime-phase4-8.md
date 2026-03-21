# Octopus Console Runtime Phase 4-8 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current hybrid dashboard/settings shell with a single-entry `/console` runtime that behaves like a half-SPA operator console while preserving server-side auth, locale routing, deep links, and backend semantics.

**Architecture:** Add a new App Router entrypoint at `/[locale]/console/[[...slug]]`, bootstrap a client-side `ConsoleApp` from the server, and migrate existing operator surfaces into lazy-loaded console screens. Keep current business logic and data semantics where possible, but move shell ownership, toolbar ownership, and screen lifecycle into the new runtime. Existing `/dashboard/*` and `/settings/*` routes become compatibility shims after the new runtime is stable.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl, Tailwind CSS v4, framer-motion, TanStack Query, Vitest, happy-dom

---

## Chunk 1: Console Runtime Foundation

### Task 1: Define the `/console` route model, legacy mappings, and bootstrap contract

**Files:**
- Create: `src/lib/console/runtime-route-map.ts`
- Create: `src/lib/console/legacy-route-map.ts`
- Create: `src/lib/console/console-bootstrap.ts`
- Modify: `src/lib/console/module-registry.ts`
- Test: `tests/unit/lib/console/runtime-route-map.test.ts`

- [ ] **Step 1: Write the failing runtime route map test**

Cover these behaviors:

- `/console/overview` resolves to the overview home screen
- `/console/traffic/logs` resolves to the traffic logs screen
- `/dashboard/logs` maps to `/console/traffic/logs`
- `/settings/client-versions` maps to `/console/policy/client-versions`
- `/dashboard/sessions/[id]/messages` remains `fullBleed: true`
- role-aware screen defaults stay valid

- [ ] **Step 2: Run the route map test to verify failure**

Run:

```bash
pnpm test -- tests/unit/lib/console/runtime-route-map.test.ts
```

Expected: FAIL because the runtime route map, legacy map, and bootstrap contract do not exist yet.

- [ ] **Step 3: Implement the minimal route map, legacy route map, and bootstrap helpers**

Implementation notes:

- keep data serializable from server entry to client shell
- avoid mixing translated labels into the structural registry
- preserve existing module ids from `module-registry.ts`

- [ ] **Step 4: Re-run the route map test**

Run:

```bash
pnpm test -- tests/unit/lib/console/runtime-route-map.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the route foundation slice**

Run:

```bash
git add src/lib/console/runtime-route-map.ts src/lib/console/legacy-route-map.ts src/lib/console/console-bootstrap.ts src/lib/console/module-registry.ts tests/unit/lib/console/runtime-route-map.test.ts
git commit -m "feat(console): add runtime route map and bootstrap contract"
```

### Task 2: Add the new `/console` server entrypoint

**Files:**
- Create: `src/app/[locale]/console/[[...slug]]/page.tsx`
- Create: `src/app/[locale]/console/_lib/get-console-bootstrap.ts`
- Test: `tests/unit/console/console-entry-page.test.tsx`

- [ ] **Step 1: Write the failing server entry test**

Cover these behaviors:

- unauthenticated visitors are redirected to login
- non-admin users retain current web-ui admission behavior
- valid console slugs produce a bootstrap payload for the client app
- invalid console slugs normalize to the default allowed screen

- [ ] **Step 2: Run the server entry test to verify failure**

Run:

```bash
pnpm test -- tests/unit/console/console-entry-page.test.tsx
```

Expected: FAIL because the `/console` route and bootstrap helper do not exist yet.

- [ ] **Step 3: Implement the server entrypoint and bootstrap builder**

Implementation notes:

- keep auth logic server-side
- reuse `getSession()` and locale-aware redirects
- do not mount the old `DashboardHeader` or `SettingsNav` in this path

- [ ] **Step 4: Re-run the server entry test**

Run:

```bash
pnpm test -- tests/unit/console/console-entry-page.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit the `/console` entry slice**

Run:

```bash
git add 'src/app/[locale]/console/[[...slug]]/page.tsx' 'src/app/[locale]/console/_lib/get-console-bootstrap.ts' tests/unit/console/console-entry-page.test.tsx
git commit -m "feat(console): add single-entry console route"
```

## Chunk 2: Client Console App And Shell

### Task 3: Build the client `ConsoleApp` runtime and lazy screen loader

**Files:**
- Create: `src/components/console-app/console-app.tsx`
- Create: `src/components/console-app/console-shell.tsx`
- Create: `src/components/console-app/console-header.tsx`
- Create: `src/components/console-app/console-sidebar.tsx`
- Create: `src/components/console-app/console-screen-loader.tsx`
- Create: `src/components/console-app/hooks/use-console-route.ts`
- Create: `src/components/console-app/hooks/use-screen-preload.ts`
- Create: `src/lib/console/lazy-screen.ts`
- Create: `src/lib/console/runtime-screen-registry.ts`
- Test: `tests/unit/console/console-app.test.tsx`

- [ ] **Step 1: Write the failing client console app test**

Cover these behaviors:

- the shell renders primary module navigation from bootstrap props
- the active screen is derived from the console slug
- switching screens renders the matching lazy screen loader
- full-bleed screens bypass the normal padded stage
- hover or focus on a nav item triggers screen preload

- [ ] **Step 2: Run the client console app test to verify failure**

Run:

```bash
pnpm test -- tests/unit/console/console-app.test.tsx
```

Expected: FAIL because the client runtime and screen registry do not exist yet.

- [ ] **Step 3: Implement the minimal client console app, shell, and lazy loader**

Implementation notes:

- keep URL-derived state as the canonical active-screen source
- do not introduce a second router abstraction
- make the screen registry expose `load()` / `preload()` semantics similar to Octopus

- [ ] **Step 4: Re-run the client console app test**

Run:

```bash
pnpm test -- tests/unit/console/console-app.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit the client runtime slice**

Run:

```bash
git add src/components/console-app src/lib/console/lazy-screen.ts src/lib/console/runtime-screen-registry.ts tests/unit/console/console-app.test.tsx
git commit -m "feat(console): add client console runtime shell"
```

### Task 4: Add a shell-owned toolbar contract and persisted screen preferences

**Files:**
- Create: `src/components/console-app/console-toolbar-host.tsx`
- Create: `src/components/console-app/hooks/use-console-preferences.ts`
- Create: `src/components/console-app/hooks/use-screen-toolbar.ts`
- Test: `tests/unit/console/console-toolbar-host.test.tsx`

- [ ] **Step 1: Write the failing toolbar host test**

Cover these behaviors:

- screens can register toolbar content declaratively
- toolbar content swaps when the active screen changes
- screen preferences persist grid/list or sort choices across screen switches
- screens without toolbar config leave the host empty without shell breakage

- [ ] **Step 2: Run the toolbar host test to verify failure**

Run:

```bash
pnpm test -- tests/unit/console/console-toolbar-host.test.tsx
```

Expected: FAIL because the toolbar host and preference hooks do not exist yet.

- [ ] **Step 3: Implement the toolbar host and preference hooks**

Implementation notes:

- keep preferences keyed by screen id
- persist only lightweight UI preferences, not fetched business data
- avoid coupling toolbar behavior to individual route page components

- [ ] **Step 4: Re-run the toolbar host test**

Run:

```bash
pnpm test -- tests/unit/console/console-toolbar-host.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit the toolbar slice**

Run:

```bash
git add src/components/console-app/console-toolbar-host.tsx src/components/console-app/hooks/use-console-preferences.ts src/components/console-app/hooks/use-screen-toolbar.ts tests/unit/console/console-toolbar-host.test.tsx
git commit -m "feat(console): add shell-owned toolbar host"
```

## Chunk 3: Migrate First-Class Client Screens

### Task 5: Migrate `Providers` and `System` screens into the new console runtime

**Files:**
- Create: `src/components/console-app/screens/providers/providers-inventory-screen.tsx`
- Create: `src/components/console-app/screens/providers/providers-pricing-screen.tsx`
- Create: `src/components/console-app/screens/system/system-config-screen.tsx`
- Create: `src/components/console-app/screens/system/system-data-screen.tsx`
- Create: `src/components/console-app/screens/system/system-notifications-screen.tsx`
- Create: `src/components/console-app/screens/system/system-logs-screen.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/provider-manager.tsx`
- Modify: `src/app/[locale]/settings/config/_components/system-settings-form.tsx`
- Modify: `src/lib/console/runtime-screen-registry.ts`
- Test: `tests/unit/console/screens/providers-system-screens.test.tsx`

- [ ] **Step 1: Write the failing providers/system screen test**

Cover these behaviors:

- providers inventory and pricing render in the new console runtime
- notifications, data, config, and logs render without the old settings shell
- embedded providers no longer duplicate top-level hero framing
- toolbar actions can be surfaced from screen config instead of page-local headers

- [ ] **Step 2: Run the providers/system screen test to verify failure**

Run:

```bash
pnpm test -- tests/unit/console/screens/providers-system-screens.test.tsx
```

Expected: FAIL because these screens are not yet mounted from the new console app.

- [ ] **Step 3: Implement the migrated providers/system screens**

Implementation notes:

- reuse existing business components whenever possible
- strip duplicated page hero ownership from embedded components
- keep existing query/mutation behavior intact

- [ ] **Step 4: Re-run the providers/system screen test**

Run:

```bash
pnpm test -- tests/unit/console/screens/providers-system-screens.test.tsx
pnpm test -- tests/unit/console/console-app.test.tsx
pnpm test -- tests/unit/console/console-toolbar-host.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit the first migrated screens**

Run:

```bash
git add src/components/console-app/screens/providers src/components/console-app/screens/system 'src/app/[locale]/settings/providers/_components/provider-manager.tsx' 'src/app/[locale]/settings/config/_components/system-settings-form.tsx' src/lib/console/runtime-screen-registry.ts tests/unit/console/screens/providers-system-screens.test.tsx
git commit -m "feat(console): migrate providers and system screens"
```

## Chunk 4: Migrate Overview And Traffic

### Task 6: Move overview, leaderboard, availability, logs, users, sessions, and quota flows into console screens

**Files:**
- Create: `src/components/console-app/screens/overview/overview-home-screen.tsx`
- Create: `src/components/console-app/screens/overview/overview-leaderboard-screen.tsx`
- Create: `src/components/console-app/screens/overview/overview-availability-screen.tsx`
- Create: `src/components/console-app/screens/traffic/traffic-logs-screen.tsx`
- Create: `src/components/console-app/screens/traffic/traffic-users-screen.tsx`
- Create: `src/components/console-app/screens/traffic/traffic-sessions-screen.tsx`
- Create: `src/components/console-app/screens/traffic/traffic-quota-screen.tsx`
- Create: `src/components/console-app/screens/traffic/traffic-session-messages-screen.tsx`
- Create: `src/components/console-app/adapters/dashboard-bootstrap.ts`
- Modify: `src/lib/console/runtime-screen-registry.ts`
- Test: `tests/unit/console/screens/overview-traffic-screens.test.tsx`

- [ ] **Step 1: Write the failing overview/traffic migration test**

Cover these behaviors:

- overview and traffic screens render from `/console/*` slugs
- leaderboard permission gating still matches current behavior
- the logs screen retains active sessions plus logs data sections
- session message detail screens still render in full-bleed mode
- quota and my-quota routes remain role-aware

- [ ] **Step 2: Run the overview/traffic migration test to verify failure**

Run:

```bash
pnpm test -- tests/unit/console/screens/overview-traffic-screens.test.tsx
```

Expected: FAIL because overview and traffic flows are still route-owned.

- [ ] **Step 3: Implement overview/traffic console screens and bootstrap adapters**

Implementation notes:

- prefer adapter components over business logic rewrites
- move page framing into console screens, not route pages
- keep full-bleed message detail handling explicit in registry metadata

- [ ] **Step 4: Re-run the overview/traffic migration test**

Run:

```bash
pnpm test -- tests/unit/console/screens/overview-traffic-screens.test.tsx
pnpm test -- tests/unit/console/console-app.test.tsx
pnpm test -- tests/unit/lib/console/runtime-route-map.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the overview/traffic migration**

Run:

```bash
git add src/components/console-app/screens/overview src/components/console-app/screens/traffic src/components/console-app/adapters/dashboard-bootstrap.ts src/lib/console/runtime-screen-registry.ts tests/unit/console/screens/overview-traffic-screens.test.tsx
git commit -m "feat(console): migrate overview and traffic screens"
```

## Chunk 5: Migrate Policy Screens

### Task 7: Move policy pages into `/console` screens with client-friendly adapters

**Files:**
- Create: `src/components/console-app/screens/policy/policy-sensitive-words-screen.tsx`
- Create: `src/components/console-app/screens/policy/policy-error-rules-screen.tsx`
- Create: `src/components/console-app/screens/policy/policy-request-filters-screen.tsx`
- Create: `src/components/console-app/screens/policy/policy-client-versions-screen.tsx`
- Create: `src/components/console-app/adapters/policy-bootstrap.ts`
- Modify: `src/lib/console/runtime-screen-registry.ts`
- Test: `tests/unit/console/screens/policy-screens.test.tsx`

- [ ] **Step 1: Write the failing policy migration test**

Cover these behaviors:

- all policy destinations render from `/console/policy/*`
- client versions retains settings + stats sections
- policy tab navigation is shell-owned rather than page-owned
- admin-only gating still holds

- [ ] **Step 2: Run the policy migration test to verify failure**

Run:

```bash
pnpm test -- tests/unit/console/screens/policy-screens.test.tsx
```

Expected: FAIL because policy destinations are still route page entrypoints.

- [ ] **Step 3: Implement the policy console screens and data adapters**

Implementation notes:

- reuse existing content sections where possible
- move page-level wrappers out of current route pages
- convert server-shaped inputs into bootstrap props or query hooks as needed

- [ ] **Step 4: Re-run the policy migration test**

Run:

```bash
pnpm test -- tests/unit/console/screens/policy-screens.test.tsx
pnpm test -- tests/unit/console/console-app.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit the policy migration**

Run:

```bash
git add src/components/console-app/screens/policy src/components/console-app/adapters/policy-bootstrap.ts src/lib/console/runtime-screen-registry.ts tests/unit/console/screens/policy-screens.test.tsx
git commit -m "feat(console): migrate policy screens"
```

## Chunk 6: Legacy Route Compatibility And Hybrid Shell Retirement

### Task 8: Convert existing dashboard/settings routes into compatibility redirects

**Files:**
- Modify: `src/app/[locale]/dashboard/layout.tsx`
- Modify: `src/app/[locale]/settings/layout.tsx`
- Modify: `src/app/[locale]/dashboard/page.tsx`
- Modify: `src/app/[locale]/dashboard/leaderboard/page.tsx`
- Modify: `src/app/[locale]/dashboard/availability/page.tsx`
- Modify: `src/app/[locale]/dashboard/logs/page.tsx`
- Modify: `src/app/[locale]/dashboard/users/page.tsx`
- Modify: `src/app/[locale]/dashboard/sessions/page.tsx`
- Modify: `src/app/[locale]/dashboard/quotas/layout.tsx`
- Modify: `src/app/[locale]/dashboard/my-quota/page.tsx`
- Modify: `src/app/[locale]/dashboard/providers/page.tsx`
- Modify: `src/app/[locale]/settings/providers/page.tsx`
- Modify: `src/app/[locale]/settings/prices/page.tsx`
- Modify: `src/app/[locale]/settings/config/page.tsx`
- Modify: `src/app/[locale]/settings/data/page.tsx`
- Modify: `src/app/[locale]/settings/notifications/page.tsx`
- Modify: `src/app/[locale]/settings/logs/page.tsx`
- Modify: `src/app/[locale]/settings/sensitive-words/page.tsx`
- Modify: `src/app/[locale]/settings/error-rules/page.tsx`
- Modify: `src/app/[locale]/settings/request-filters/page.tsx`
- Modify: `src/app/[locale]/settings/client-versions/page.tsx`
- Test: `tests/integration/console/legacy-route-redirects.test.ts`

- [ ] **Step 1: Write the failing legacy redirect integration test**

Cover these behaviors:

- legacy dashboard and settings URLs redirect to the matching `/console/*` URL
- locale is preserved
- screen-specific params such as session ids survive redirect normalization
- forbidden roles still receive the correct redirect outcome

- [ ] **Step 2: Run the legacy redirect integration test to verify failure**

Run:

```bash
pnpm test -- tests/integration/console/legacy-route-redirects.test.ts
```

Expected: FAIL because the old routes still own rendering.

- [ ] **Step 3: Implement legacy compatibility redirects and retire the hybrid shell path**

Implementation notes:

- keep `/console` as the only operator rendering runtime
- do not remove old route files until redirect coverage is explicit
- preserve special handling for session message full-bleed routes

- [ ] **Step 4: Re-run the legacy redirect integration test**

Run:

```bash
pnpm test -- tests/integration/console/legacy-route-redirects.test.ts
pnpm test -- tests/unit/lib/console/runtime-route-map.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the compatibility cleanup**

Run:

```bash
git add 'src/app/[locale]/dashboard/layout.tsx' 'src/app/[locale]/settings/layout.tsx' 'src/app/[locale]/dashboard/page.tsx' 'src/app/[locale]/dashboard/leaderboard/page.tsx' 'src/app/[locale]/dashboard/availability/page.tsx' 'src/app/[locale]/dashboard/logs/page.tsx' 'src/app/[locale]/dashboard/users/page.tsx' 'src/app/[locale]/dashboard/sessions/page.tsx' 'src/app/[locale]/dashboard/quotas/layout.tsx' 'src/app/[locale]/dashboard/my-quota/page.tsx' 'src/app/[locale]/dashboard/providers/page.tsx' 'src/app/[locale]/settings/providers/page.tsx' 'src/app/[locale]/settings/prices/page.tsx' 'src/app/[locale]/settings/config/page.tsx' 'src/app/[locale]/settings/data/page.tsx' 'src/app/[locale]/settings/notifications/page.tsx' 'src/app/[locale]/settings/logs/page.tsx' 'src/app/[locale]/settings/sensitive-words/page.tsx' 'src/app/[locale]/settings/error-rules/page.tsx' 'src/app/[locale]/settings/request-filters/page.tsx' 'src/app/[locale]/settings/client-versions/page.tsx' tests/integration/console/legacy-route-redirects.test.ts
git commit -m "refactor(console): route dashboard and settings through console runtime"
```

## Chunk 7: Final Verification

### Task 9: Verify the new console runtime end to end

**Files:**
- Review only

- [ ] **Step 1: Run targeted console unit tests**

Run:

```bash
pnpm test -- tests/unit/lib/console/runtime-route-map.test.ts
pnpm test -- tests/unit/console/console-entry-page.test.tsx
pnpm test -- tests/unit/console/console-app.test.tsx
pnpm test -- tests/unit/console/console-toolbar-host.test.tsx
pnpm test -- tests/unit/console/screens/providers-system-screens.test.tsx
pnpm test -- tests/unit/console/screens/overview-traffic-screens.test.tsx
pnpm test -- tests/unit/console/screens/policy-screens.test.tsx
```

Expected: all targeted unit tests PASS.

- [ ] **Step 2: Run compatibility and integration coverage**

Run:

```bash
pnpm test -- tests/integration/console/legacy-route-redirects.test.ts
```

Expected: PASS

- [ ] **Step 3: Run repo quality checks**

Run:

```bash
pnpm lint
pnpm typecheck
```

Expected: exit 0, or exact baseline failures documented.

- [ ] **Step 4: Run a production build**

Run:

```bash
pnpm build
```

Expected: build completes successfully with the new `/console` route and compatibility redirects.

- [ ] **Step 5: Inspect final worktree**

Run:

```bash
git status --short
```

Expected: only intended console-runtime changes are present.
