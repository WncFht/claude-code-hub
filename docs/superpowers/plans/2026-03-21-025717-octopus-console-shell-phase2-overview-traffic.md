# Octopus Console Shell Phase 2 Overview Traffic Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the `Overview` and `Traffic` operator surfaces so the highest-traffic dashboard routes feel like one coherent module-first console instead of unrelated route pages.

**Architecture:** Build two shared module wrappers on top of the Phase 1 shell: one for `Overview`, one for `Traffic`. Keep the current App Router boundaries, auth checks, and nested route layouts, but move page hero/tab composition into shared wrappers and extend the console registry with route-level secondary tab metadata so landing, logs, users, quotas, sessions, leaderboard, and availability all render under one interaction contract.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl, Tailwind CSS v4, framer-motion, Vitest, happy-dom

---

## File Structure

### New code units

- `src/app/[locale]/dashboard/_components/overview-module-page.tsx`
  Purpose: shared module framing for dashboard landing, leaderboard, and availability surfaces.

- `src/app/[locale]/dashboard/_components/traffic-module-page.tsx`
  Purpose: shared module framing for logs, users, quota, and session-oriented surfaces.

- `tests/unit/console/overview-traffic-route-metadata.test.ts`
  Purpose: verifies secondary tab metadata, active route mapping, and role-aware tab visibility for `Overview` and `Traffic`.

- `tests/unit/console/overview-module-page.test.tsx`
  Purpose: verifies shared hero/tab framing for `Overview` pages.

- `tests/unit/console/traffic-module-page.test.tsx`
  Purpose: verifies shared hero/tab framing for `Traffic` pages, including quota nesting and session-related routes.

### Modified code units

- `src/lib/console/module-registry.ts`
  Responsibility change: extend route metadata so `Overview` and `Traffic` have secondary tabs, default destinations, and page-level visibility rules that can drive shared wrappers.

- `src/app/[locale]/dashboard/page.tsx`
  Responsibility change: mount the overview landing content inside the shared `Overview` module page.

- `src/app/[locale]/dashboard/leaderboard/page.tsx`
  Responsibility change: render leaderboard under the `Overview` module frame rather than as a free-floating dashboard page.

- `src/app/[locale]/dashboard/availability/page.tsx`
  Responsibility change: render availability under the same `Overview` frame while preserving its admin-only route rule.

- `src/app/[locale]/dashboard/logs/page.tsx`
  Responsibility change: render logs and active-session strips inside the `Traffic` module frame with shared toolbar/header composition.

- `src/app/[locale]/dashboard/users/page.tsx`
  Responsibility change: render the users surface inside the `Traffic` frame.

- `src/app/[locale]/dashboard/sessions/page.tsx`
  Responsibility change: render the active sessions list inside the `Traffic` frame while preserving the full-bleed session-message detail route handled in Phase 1.

- `src/app/[locale]/dashboard/my-quota/page.tsx`
  Responsibility change: align the non-admin quota surface with the `Traffic` module framing.

- `src/app/[locale]/dashboard/quotas/layout.tsx`
  Responsibility change: convert the existing route-local quota tabs into shell-compatible secondary content inside the `Traffic` module instead of a standalone page header.

- `src/app/[locale]/dashboard/quotas/page.tsx`
  Responsibility change: keep redirect semantics intact while treating `/dashboard/quotas/*` as `Traffic` sub-routes.

- `src/app/[locale]/dashboard/_components/dashboard-bento-sections.tsx`
  Responsibility change: expose landing content that can be embedded under the shared `Overview` wrapper without duplicating top-level headers.

- `messages/en/dashboard.json`
- `messages/ja/dashboard.json`
- `messages/ru/dashboard.json`
- `messages/zh-CN/dashboard.json`
- `messages/zh-TW/dashboard.json`
  Responsibility change: add shared `Overview`/`Traffic` hero copy, tab labels, and any new module wrapper strings.

- `messages/en/quota.json`
- `messages/ja/quota.json`
- `messages/ru/quota.json`
- `messages/zh-CN/quota.json`
- `messages/zh-TW/quota.json`
  Responsibility change: if quota tabs or descriptions move into shared traffic framing, keep their labels in i18n.

## Chunk 1: Overview And Traffic Route Metadata

### Task 1: Extend the console registry with secondary tab metadata for the busiest dashboard routes

**Files:**
- Modify: `src/lib/console/module-registry.ts`
- Test: `tests/unit/console/overview-traffic-route-metadata.test.ts`

- [ ] **Step 1: Write the failing route metadata test**

Cover these behaviors:

- `/dashboard/leaderboard` resolves to the `overview` module with the `leaderboard` tab active
- `/dashboard/availability` resolves to the `overview` module with an admin-only tab
- `/dashboard/logs`, `/dashboard/users`, `/dashboard/sessions`, `/dashboard/my-quota`, and `/dashboard/quotas/users` resolve to the `traffic` module with correct secondary tab ids
- non-admin traffic tab visibility excludes admin-only destinations such as `/dashboard/sessions` or `/dashboard/quotas/*` if they remain restricted
- the full-bleed `/dashboard/sessions/[sessionId]/messages` route keeps its `traffic` module identity and `fullBleed: true`

- [ ] **Step 2: Run the route metadata test to verify failure**

Run:

```bash
pnpm test -- tests/unit/console/overview-traffic-route-metadata.test.ts
```

Expected: FAIL because the registry does not yet expose secondary tab metadata for `Overview` and `Traffic`.

- [ ] **Step 3: Implement the minimal metadata extension**

Implementation notes:

- keep metadata serializable for server-to-client shell props
- preserve the Phase 1 role/page visibility split instead of flattening permissions into top-level module visibility
- do not alter current route auth logic in page files during this task

- [ ] **Step 4: Re-run the route metadata test**

Run:

```bash
pnpm test -- tests/unit/console/overview-traffic-route-metadata.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the metadata slice**

Run:

```bash
git add src/lib/console/module-registry.ts tests/unit/console/overview-traffic-route-metadata.test.ts
git commit -m "feat(console): add overview and traffic route metadata"
```

## Chunk 2: Overview Module Wrapper

### Task 2: Build the shared `Overview` module page and adapt landing, leaderboard, and availability

**Files:**
- Create: `src/app/[locale]/dashboard/_components/overview-module-page.tsx`
- Modify: `src/app/[locale]/dashboard/page.tsx`
- Modify: `src/app/[locale]/dashboard/leaderboard/page.tsx`
- Modify: `src/app/[locale]/dashboard/availability/page.tsx`
- Modify: `src/app/[locale]/dashboard/_components/dashboard-bento-sections.tsx`
- Modify: `messages/en/dashboard.json`
- Modify: `messages/ja/dashboard.json`
- Modify: `messages/ru/dashboard.json`
- Modify: `messages/zh-CN/dashboard.json`
- Modify: `messages/zh-TW/dashboard.json`
- Test: `tests/unit/console/overview-module-page.test.tsx`

- [ ] **Step 1: Write the failing overview module test**

Cover these behaviors:

- dashboard landing, leaderboard, and availability all render the same `Overview` wrapper slot
- `Overview` secondary tabs are rendered consistently, with availability highlighted only on the availability route
- the admin-only availability tab is hidden for non-admin module props while overview landing and leaderboard remain visible
- existing landing content renders below the module frame instead of duplicating a second page hero

- [ ] **Step 2: Run the overview module test to verify failure**

Run:

```bash
pnpm test -- tests/unit/console/overview-module-page.test.tsx
```

Expected: FAIL because there is no shared `Overview` module wrapper yet.

- [ ] **Step 3: Implement the overview module wrapper and route integration**

Implementation notes:

- use the Phase 1 Providers pattern: shared hero + secondary tabs + embedded page body
- preserve the `/settings/prices?required=true` redirect from `dashboard/page.tsx`
- do not rework landing data fetch semantics yet; wrap existing bento/statistics content as-is
- keep availability’s admin-only redirect or guard behavior intact

- [ ] **Step 4: Re-run overview tests**

Run:

```bash
pnpm test -- tests/unit/console/overview-module-page.test.tsx
pnpm test -- tests/unit/console/overview-traffic-route-metadata.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the overview slice**

Run:

```bash
git add 'src/app/[locale]/dashboard/_components/overview-module-page.tsx' 'src/app/[locale]/dashboard/page.tsx' 'src/app/[locale]/dashboard/leaderboard/page.tsx' 'src/app/[locale]/dashboard/availability/page.tsx' 'src/app/[locale]/dashboard/_components/dashboard-bento-sections.tsx' messages/en/dashboard.json messages/ja/dashboard.json messages/ru/dashboard.json messages/zh-CN/dashboard.json messages/zh-TW/dashboard.json tests/unit/console/overview-module-page.test.tsx
git commit -m "feat(console): add overview module framing"
```

## Chunk 3: Traffic Module Wrapper

### Task 3: Build the shared `Traffic` module page and adapt logs, users, sessions, and quota surfaces

**Files:**
- Create: `src/app/[locale]/dashboard/_components/traffic-module-page.tsx`
- Modify: `src/app/[locale]/dashboard/logs/page.tsx`
- Modify: `src/app/[locale]/dashboard/users/page.tsx`
- Modify: `src/app/[locale]/dashboard/sessions/page.tsx`
- Modify: `src/app/[locale]/dashboard/my-quota/page.tsx`
- Modify: `src/app/[locale]/dashboard/quotas/layout.tsx`
- Modify: `src/app/[locale]/dashboard/quotas/page.tsx`
- Modify: `messages/en/dashboard.json`
- Modify: `messages/ja/dashboard.json`
- Modify: `messages/ru/dashboard.json`
- Modify: `messages/zh-CN/dashboard.json`
- Modify: `messages/zh-TW/dashboard.json`
- Modify: `messages/en/quota.json`
- Modify: `messages/ja/quota.json`
- Modify: `messages/ru/quota.json`
- Modify: `messages/zh-CN/quota.json`
- Modify: `messages/zh-TW/quota.json`
- Test: `tests/unit/console/traffic-module-page.test.tsx`

- [ ] **Step 1: Write the failing traffic module test**

Cover these behaviors:

- logs, users, sessions, and quota pages render inside the same `Traffic` module frame
- secondary tabs correctly distinguish logs, users, sessions, and quota destinations
- quota route-local tabs remain usable inside the module frame without rendering a second top-level hero
- the full-bleed session-message detail route still bypasses padded stage framing from Phase 1

- [ ] **Step 2: Run the traffic module test to verify failure**

Run:

```bash
pnpm test -- tests/unit/console/traffic-module-page.test.tsx
```

Expected: FAIL because there is no shared `Traffic` wrapper yet.

- [ ] **Step 3: Implement the traffic module wrapper and route integration**

Implementation notes:

- keep logs filters, users tables, sessions tables, and quota nested layout bodies intact
- if logs/users/sessions pages currently own their own page title region, move that framing into the shared wrapper and keep business widgets below it
- preserve admin-only route gates for active sessions and quota management
- keep non-admin `my-quota` routing inside `Traffic` without exposing admin-only tabs

- [ ] **Step 4: Re-run traffic and console tests**

Run:

```bash
pnpm test -- tests/unit/console/traffic-module-page.test.tsx
pnpm test -- tests/unit/console/overview-traffic-route-metadata.test.ts
pnpm test -- tests/unit/console/console-layouts.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit the traffic slice**

Run:

```bash
git add 'src/app/[locale]/dashboard/_components/traffic-module-page.tsx' 'src/app/[locale]/dashboard/logs/page.tsx' 'src/app/[locale]/dashboard/users/page.tsx' 'src/app/[locale]/dashboard/sessions/page.tsx' 'src/app/[locale]/dashboard/my-quota/page.tsx' 'src/app/[locale]/dashboard/quotas/layout.tsx' 'src/app/[locale]/dashboard/quotas/page.tsx' messages/en/dashboard.json messages/ja/dashboard.json messages/ru/dashboard.json messages/zh-CN/dashboard.json messages/zh-TW/dashboard.json messages/en/quota.json messages/ja/quota.json messages/ru/quota.json messages/zh-CN/quota.json messages/zh-TW/quota.json tests/unit/console/traffic-module-page.test.tsx
git commit -m "feat(console): adapt overview and traffic modules"
```

## Chunk 4: Verification

### Task 4: Verify the Phase 2 slice end-to-end

**Files:**
- Review only

- [ ] **Step 1: Run targeted shell and module tests**

Run:

```bash
pnpm test -- tests/unit/console/overview-traffic-route-metadata.test.ts tests/unit/console/overview-module-page.test.tsx tests/unit/console/traffic-module-page.test.tsx tests/unit/console/console-layouts.test.tsx tests/unit/console/console-shell.test.tsx
```

Expected: all targeted tests PASS.

- [ ] **Step 2: Run repo quality checks**

Run:

```bash
pnpm lint
pnpm typecheck
```

Expected: exit 0. If baseline failures appear, document them exactly before proceeding.

- [ ] **Step 3: Inspect the final worktree**

Run:

```bash
git status --short
```

Expected: only intended Phase 2 files are changed in the isolated worktree.
