# Octopus Console Runtime Phase 9 Completion Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the single-entry `/console` runtime by moving the remaining operator deep links and diagnostics into the console shell, while making module secondary navigation shell-owned instead of screen-specific.

**Architecture:** Extend the console route registry so it can describe shell navigation metadata plus the remaining dynamic/detail screens. Keep `/[locale]/console/[[...slug]]` as the only rendering runtime, add small screen adapters for the remaining leaderboard/rate-limit/quota flows, and convert the last legacy dashboard routes into redirect shims.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl, TanStack Query, Vitest, happy-dom

---

## Chunk 1: Shell-Owned Module Navigation

### Task 1: Promote module secondary tabs into the console shell

**Files:**
- Modify: `src/lib/console/runtime-route-map.ts`
- Modify: `src/lib/console/module-registry.ts`
- Modify: `src/components/console-app/console-app.tsx`
- Modify: `src/components/console-app/console-shell.tsx`
- Modify: `src/components/console-app/console-header.tsx`
- Create: `src/components/console-app/console-module-tabs.tsx`
- Modify: `src/components/console-app/screens/policy/policy-sensitive-words-screen.tsx`
- Modify: `src/components/console-app/screens/policy/policy-error-rules-screen.tsx`
- Modify: `src/components/console-app/screens/policy/policy-request-filters-screen.tsx`
- Modify: `src/components/console-app/screens/policy/policy-client-versions-screen.tsx`
- Delete: `src/components/console-app/screens/policy/policy-console-tabs.tsx`
- Test: `tests/unit/console/console-app.test.tsx`

- [ ] **Step 1: Write the failing shell navigation test**

Cover these behaviors:

- `/console/policy/*` renders shell-owned secondary tabs from route metadata
- the active secondary tab follows the current slug
- shell header can show the active screen label instead of only the module label
- policy screens no longer need to inject module tabs through `useScreenToolbar`

- [ ] **Step 2: Run the console app test to verify failure**

Run:

```bash
pnpm test -- tests/unit/console/console-app.test.tsx
```

Expected: FAIL because the shell does not yet render module tabs or route-level titles.

- [ ] **Step 3: Implement the generic module tab contract**

Implementation notes:

- derive visible secondary tabs from the runtime route registry, not from screen-local wrappers
- keep screen-local toolbar content for actions/forms, but move module tab ownership into `ConsoleShell`
- keep the shell route/title data serializable and role-aware

- [ ] **Step 4: Re-run the console app test**

Run:

```bash
pnpm test -- tests/unit/console/console-app.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit the shell navigation slice**

Run:

```bash
git add src/lib/console/runtime-route-map.ts src/lib/console/module-registry.ts src/components/console-app/console-app.tsx src/components/console-app/console-shell.tsx src/components/console-app/console-header.tsx src/components/console-app/console-module-tabs.tsx src/components/console-app/screens/policy/policy-sensitive-words-screen.tsx src/components/console-app/screens/policy/policy-error-rules-screen.tsx src/components/console-app/screens/policy/policy-request-filters-screen.tsx src/components/console-app/screens/policy/policy-client-versions-screen.tsx tests/unit/console/console-app.test.tsx
git rm src/components/console-app/screens/policy/policy-console-tabs.tsx
git commit -m "feat(console): move module tabs into shell navigation"
```

## Chunk 2: Remaining Detail And Diagnostic Screens

### Task 2: Add runtime support for leaderboard user insights, rate limits, and key quotas

**Files:**
- Modify: `src/lib/console/runtime-route-map.ts`
- Modify: `src/lib/console/legacy-route-map.ts`
- Modify: `src/lib/console/console-bootstrap.ts`
- Modify: `src/app/[locale]/console/_lib/get-console-bootstrap.ts`
- Modify: `src/lib/console/runtime-screen-registry.ts`
- Modify: `src/components/console-app/adapters/dashboard-bootstrap.ts`
- Create: `src/components/console-app/screens/overview/overview-user-insights-screen.tsx`
- Create: `src/components/console-app/screens/traffic/traffic-rate-limits-screen.tsx`
- Modify: `src/components/console-app/screens/traffic/traffic-quota-screen.tsx`
- Test: `tests/unit/lib/console/runtime-route-map.test.ts`
- Test: `tests/unit/console/screens/overview-traffic-screens.test.tsx`

- [ ] **Step 1: Write the failing route-map and screen migration tests**

Cover these behaviors:

- `/console/overview/leaderboard/users/[userId]` resolves to a dedicated overview detail screen
- `/dashboard/leaderboard/user/[userId]` normalizes to that console deep link
- `/console/traffic/rate-limits` resolves inside the traffic module
- `/dashboard/rate-limits` normalizes to `/console/traffic/rate-limits`
- `/console/traffic/quotas/keys` renders the key quota view instead of collapsing to users/providers

- [ ] **Step 2: Run the route and screen tests to verify failure**

Run:

```bash
pnpm test -- tests/unit/lib/console/runtime-route-map.test.ts tests/unit/console/screens/overview-traffic-screens.test.tsx
```

Expected: FAIL because the remaining deep-link screens are not described or mounted in the runtime.

- [ ] **Step 3: Implement the missing runtime screens and bootstrap support**

Implementation notes:

- keep `UserInsightsView` and `RateLimitDashboard` as reused business components
- extend bootstrap only as much as needed to validate and pass user-insight context safely
- preserve `/console/traffic/quotas/*` as one screen family, but add the missing `keys` subview explicitly

- [ ] **Step 4: Re-run the route and screen tests**

Run:

```bash
pnpm test -- tests/unit/lib/console/runtime-route-map.test.ts tests/unit/console/screens/overview-traffic-screens.test.tsx tests/unit/console/console-app.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit the remaining runtime screens**

Run:

```bash
git add src/lib/console/runtime-route-map.ts src/lib/console/legacy-route-map.ts src/lib/console/console-bootstrap.ts 'src/app/[locale]/console/_lib/get-console-bootstrap.ts' src/lib/console/runtime-screen-registry.ts src/components/console-app/adapters/dashboard-bootstrap.ts src/components/console-app/screens/overview/overview-user-insights-screen.tsx src/components/console-app/screens/traffic/traffic-rate-limits-screen.tsx src/components/console-app/screens/traffic/traffic-quota-screen.tsx tests/unit/lib/console/runtime-route-map.test.ts tests/unit/console/screens/overview-traffic-screens.test.tsx tests/unit/console/console-app.test.tsx
git commit -m "feat(console): migrate remaining detail and diagnostic screens"
```

## Chunk 3: Final Legacy Redirect Cleanup

### Task 3: Convert the last old dashboard pages into console redirects

**Files:**
- Modify: `src/app/[locale]/dashboard/leaderboard/user/[userId]/page.tsx`
- Modify: `src/app/[locale]/dashboard/rate-limits/page.tsx`
- Modify: `src/app/[locale]/dashboard/quotas/keys/page.tsx`
- Test: `tests/integration/console/legacy-route-redirects.test.ts`

- [ ] **Step 1: Write the failing legacy redirect integration test**

Cover these behaviors:

- `/dashboard/leaderboard/user/[userId]` redirects to `/console/overview/leaderboard/users/[userId]`
- `/dashboard/rate-limits` redirects to `/console/traffic/rate-limits`
- `/dashboard/quotas/keys` redirects to `/console/traffic/quotas/keys`
- locale and admin gating are still preserved

- [ ] **Step 2: Run the integration test to verify failure**

Run:

```bash
pnpm test -- tests/integration/console/legacy-route-redirects.test.ts
```

Expected: FAIL because these pages still render or redirect to non-console destinations.

- [ ] **Step 3: Replace the remaining page owners with compatibility shims**

Implementation notes:

- keep page-level auth/role normalization inside `redirectLegacyConsoleRoute`
- do not leave any dashboard route rendering business UI when an equivalent console screen now exists
- correct the current `/dashboard/quotas/keys` redirect target while making it a console path

- [ ] **Step 4: Re-run the integration and targeted regression tests**

Run:

```bash
pnpm test -- tests/integration/console/legacy-route-redirects.test.ts tests/unit/lib/console/runtime-route-map.test.ts tests/unit/console/screens/overview-traffic-screens.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit the redirect cleanup**

Run:

```bash
git add 'src/app/[locale]/dashboard/leaderboard/user/[userId]/page.tsx' 'src/app/[locale]/dashboard/rate-limits/page.tsx' 'src/app/[locale]/dashboard/quotas/keys/page.tsx' tests/integration/console/legacy-route-redirects.test.ts tests/unit/lib/console/runtime-route-map.test.ts tests/unit/console/screens/overview-traffic-screens.test.tsx
git commit -m "refactor(console): retire remaining dashboard runtime entrypoints"
```

## Chunk 4: Verification

### Task 4: Re-run the console runtime gate

**Files:**
- Review only

- [ ] **Step 1: Run targeted console coverage**

Run:

```bash
pnpm test -- tests/unit/lib/console/runtime-route-map.test.ts tests/unit/console/console-entry-page.test.tsx tests/unit/console/console-app.test.tsx tests/unit/console/console-toolbar-host.test.tsx tests/unit/console/screens/providers-system-screens.test.tsx tests/unit/console/screens/overview-traffic-screens.test.tsx tests/unit/console/screens/policy-screens.test.tsx tests/integration/console/legacy-route-redirects.test.ts
```

Expected: PASS

- [ ] **Step 2: Run repo quality checks**

Run:

```bash
pnpm lint
pnpm typecheck
```

Expected: exit 0

- [ ] **Step 3: Run a production build**

Run:

```bash
pnpm build
```

Expected: build completes successfully with the expanded `/console` runtime

- [ ] **Step 4: Inspect final worktree**

Run:

```bash
git status --short --branch
```

Expected: clean branch except for intended uncommitted plan/doc changes
