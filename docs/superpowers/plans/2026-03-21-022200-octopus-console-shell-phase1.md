# Octopus Console Shell Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the first executable slice of the Octopus-inspired console redesign by introducing a shared `ConsoleShell` foundation for `dashboard + settings` and making `Providers` the first fully adapted module.

**Architecture:** Keep the existing App Router and auth/layout boundaries intact, but mount a new shared shell system from both `dashboard/layout.tsx` and `settings/layout.tsx`. Drive the shell with a module registry plus route adapters, preserve full-bleed route exceptions, and make the providers pages render through a shared module page wrapper instead of two independently framed route pages.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl, Tailwind CSS v4, framer-motion, TanStack Query, Vitest, happy-dom

---

## File Structure

### New code units

- `src/lib/console/module-registry.ts`
  Purpose: single source of truth for module ids, labels, active-route matching, page-level access metadata, and full-bleed escape hatches.

- `src/lib/console/console-shell-flag.ts`
  Purpose: server-safe feature flag helper for phased rollout, using `ENABLE_OCTOPUS_CONSOLE_SHELL`.

- `src/components/console/console-shell.tsx`
  Purpose: shared shell frame that renders header, module navigation, hero slot, toolbar slot, and content stage.

- `src/components/console/console-nav.tsx`
  Purpose: desktop rail plus mobile navigation for the shared shell.

- `src/components/console/console-stage.tsx`
  Purpose: route-aware content staging that can choose padded vs full-bleed framing.

- `src/app/[locale]/settings/providers/_components/providers-module-page.tsx`
  Purpose: module-level wrapper for providers routes, responsible for shared hero, secondary tabs, and shell-compatible embedding of provider surfaces.

### Modified code units

- `src/app/[locale]/dashboard/layout.tsx`
  Responsibility change: keep current dashboard auth semantics, but mount shared console primitives instead of the current dashboard-only shell.

- `src/app/[locale]/settings/layout.tsx`
  Responsibility change: keep current admin-only guard, but mount the same shared console primitives from the settings tree.

- `src/app/[locale]/dashboard/_components/dashboard-main.tsx`
  Responsibility change: hand route framing to shared stage logic while preserving the existing full-bleed session messages exception.

- `src/app/[locale]/settings/_components/page-transition.tsx`
  Responsibility change: align settings content staging with the shared shell/page-stage contract.

- `src/app/[locale]/dashboard/providers/page.tsx`
  Responsibility change: route through the shared providers module wrapper while preserving its current admin-only gate.

- `src/app/[locale]/settings/providers/page.tsx`
  Responsibility change: route through the same providers module wrapper used by dashboard.

- `src/app/[locale]/settings/prices/page.tsx`
  Responsibility change: expose module metadata/tabs so pricing is visibly part of the `Providers` module.

- `src/app/[locale]/settings/providers/_components/provider-manager.tsx`
  Responsibility change: support embedded rendering inside the new module wrapper instead of always owning the top-level page hero.

### Test units

- `tests/unit/lib/console/module-registry.test.ts`
- `tests/unit/console/console-shell.test.tsx`
- `tests/unit/console/console-layouts.test.tsx`
- `tests/unit/settings/providers/providers-module-page.test.tsx`
- `src/app/[locale]/settings/providers/_components/provider-manager.test.tsx`

### i18n units

- `messages/en/dashboard.json`
- `messages/ja/dashboard.json`
- `messages/ru/dashboard.json`
- `messages/zh-CN/dashboard.json`
- `messages/zh-TW/dashboard.json`

These locale files should hold the new console module labels, shared shell copy, and providers module tab labels introduced in this slice.

## Chunk 1: Module Registry And Rollout Switch

### Task 1: Add a route/module registry with explicit permission and full-bleed metadata

**Files:**
- Create: `src/lib/console/module-registry.ts`
- Create: `src/lib/console/console-shell-flag.ts`
- Test: `tests/unit/lib/console/module-registry.test.ts`

- [ ] **Step 1: Write the failing registry test**

Cover these cases explicitly:

- `/dashboard` resolves to `overview`
- `/dashboard/providers` and `/settings/providers` resolve to `providers`
- `/settings/config` resolves to `system`
- `/dashboard/sessions/abc/messages` is marked `fullBleed: true`
- non-admin visibility excludes admin-only child routes even when the parent module is visible

- [ ] **Step 2: Run the registry test to verify failure**

Run:

```bash
pnpm test -- tests/unit/lib/console/module-registry.test.ts
```

Expected: FAIL because the registry and flag helper do not exist yet.

- [ ] **Step 3: Implement the minimal registry and rollout flag helper**

Implementation notes:

- registry output should be serializable and usable from both layouts
- permission metadata must distinguish top-level module visibility from page-level route visibility
- the flag helper should read `process.env.ENABLE_OCTOPUS_CONSOLE_SHELL`

- [ ] **Step 4: Re-run the registry test**

Run:

```bash
pnpm test -- tests/unit/lib/console/module-registry.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the registry slice**

Run:

```bash
git add src/lib/console/module-registry.ts src/lib/console/console-shell-flag.ts tests/unit/lib/console/module-registry.test.ts
git commit -m "feat(console): add module registry and shell flag"
```

## Chunk 2: Shared Console Shell Primitives

### Task 2: Build a reusable shell that can be mounted from both route trees

**Files:**
- Create: `src/components/console/console-shell.tsx`
- Create: `src/components/console/console-nav.tsx`
- Create: `src/components/console/console-stage.tsx`
- Test: `tests/unit/console/console-shell.test.tsx`

- [ ] **Step 1: Write the failing shell render test**

Cover these behaviors:

- active module is highlighted from registry metadata
- desktop and mobile navigation surfaces both render
- admin-only module entries are omitted for non-admin shell props
- `console-stage` can switch between standard padded mode and full-bleed mode

- [ ] **Step 2: Run the shell render test to verify failure**

Run:

```bash
pnpm test -- tests/unit/console/console-shell.test.tsx
```

Expected: FAIL because the shared shell components do not exist yet.

- [ ] **Step 3: Implement the minimal shell primitives**

Implementation notes:

- keep shell inputs declarative: current user role, active route metadata, hero slot, toolbar slot, content slot
- do not move auth or route fetching into the client shell
- keep `console-stage` generic so it can replace the current `dashboard-main`/`page-transition` framing logic

- [ ] **Step 4: Re-run the shell render test**

Run:

```bash
pnpm test -- tests/unit/console/console-shell.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit the shell primitive slice**

Run:

```bash
git add src/components/console/console-shell.tsx src/components/console/console-nav.tsx src/components/console/console-stage.tsx tests/unit/console/console-shell.test.tsx
git commit -m "feat(console): add shared shell primitives"
```

## Chunk 3: Mount The Shared Shell In Dashboard And Settings

### Task 3: Replace split route shells without changing current auth semantics

**Files:**
- Modify: `src/app/[locale]/dashboard/layout.tsx`
- Modify: `src/app/[locale]/settings/layout.tsx`
- Modify: `src/app/[locale]/dashboard/_components/dashboard-main.tsx`
- Modify: `src/app/[locale]/settings/_components/page-transition.tsx`
- Test: `tests/unit/console/console-layouts.test.tsx`

- [ ] **Step 1: Write the failing layout smoke test**

Cover these behaviors:

- dashboard layout still admits the current dashboard audience and mounts shared shell props
- settings layout remains admin-only
- dashboard full-bleed session-messages path still bypasses the normal padded stage
- settings pages still animate through the shared stage contract

- [ ] **Step 2: Run the layout smoke test to verify failure**

Run:

```bash
pnpm test -- tests/unit/console/console-layouts.test.tsx
```

Expected: FAIL because the route layouts still use split dashboard/settings shell components.

- [ ] **Step 3: Implement the layout migration**

Implementation notes:

- keep `getSession()` and redirect checks in the existing server layouts
- pass shell metadata into shared console components instead of moving auth into client code
- preserve the current pathname-based full-bleed escape hatch from `dashboard-main.tsx`

- [ ] **Step 4: Re-run layout and shell tests**

Run:

```bash
pnpm test -- tests/unit/console/console-layouts.test.tsx
pnpm test -- tests/unit/console/console-shell.test.tsx
pnpm test -- tests/unit/lib/console/module-registry.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the layout migration slice**

Run:

```bash
git add 'src/app/[locale]/dashboard/layout.tsx' 'src/app/[locale]/settings/layout.tsx' 'src/app/[locale]/dashboard/_components/dashboard-main.tsx' 'src/app/[locale]/settings/_components/page-transition.tsx' tests/unit/console/console-layouts.test.tsx
git commit -m "refactor(console): mount shared shell from dashboard and settings"
```

## Chunk 4: Providers Module Reference Implementation

### Task 4: Adapt providers routes to the shared module model

**Files:**
- Create: `src/app/[locale]/settings/providers/_components/providers-module-page.tsx`
- Test: `tests/unit/settings/providers/providers-module-page.test.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/provider-manager.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/provider-manager.test.tsx`
- Modify: `src/app/[locale]/dashboard/providers/page.tsx`
- Modify: `src/app/[locale]/settings/providers/page.tsx`
- Modify: `src/app/[locale]/settings/prices/page.tsx`
- Modify: `messages/en/dashboard.json`
- Modify: `messages/ja/dashboard.json`
- Modify: `messages/ru/dashboard.json`
- Modify: `messages/zh-CN/dashboard.json`
- Modify: `messages/zh-TW/dashboard.json`

- [ ] **Step 1: Write the failing providers module page test**

Cover these behaviors:

- dashboard providers and settings providers render the same module hero/tabs wrapper
- providers routes expose shared module tabs such as inventory and pricing
- embedded `ProviderManager` mode does not render a second top-level hero
- pricing route is grouped under the `providers` module metadata

- [ ] **Step 2: Run the providers module tests to verify failure**

Run:

```bash
pnpm test -- tests/unit/settings/providers/providers-module-page.test.tsx
pnpm test -- 'src/app/[locale]/settings/providers/_components/provider-manager.test.tsx'
```

Expected: FAIL because there is no shared providers module wrapper and `ProviderManager` still owns the standalone hero.

- [ ] **Step 3: Implement the providers reference module**

Implementation notes:

- `providers-module-page.tsx` should own the shared module framing: hero, secondary tabs, shared actions
- `ProviderManager` should gain an embedded/standalone mode or equivalent explicit prop so shell-owned framing does not duplicate
- `dashboard/providers/page.tsx` must preserve its current admin-only redirect behavior
- `settings/prices/page.tsx` only needs module grouping/tabs in this slice; do not rewrite pricing internals yet

- [ ] **Step 4: Re-run providers tests**

Run:

```bash
pnpm test -- tests/unit/settings/providers/providers-module-page.test.tsx
pnpm test -- 'src/app/[locale]/settings/providers/_components/provider-manager.test.tsx'
```

Expected: PASS

- [ ] **Step 5: Commit the providers module slice**

Run:

```bash
git add 'src/app/[locale]/settings/providers/_components/providers-module-page.tsx' 'src/app/[locale]/settings/providers/_components/provider-manager.tsx' 'src/app/[locale]/settings/providers/_components/provider-manager.test.tsx' 'src/app/[locale]/dashboard/providers/page.tsx' 'src/app/[locale]/settings/providers/page.tsx' 'src/app/[locale]/settings/prices/page.tsx' tests/unit/settings/providers/providers-module-page.test.tsx messages/en/dashboard.json messages/ja/dashboard.json messages/ru/dashboard.json messages/zh-CN/dashboard.json messages/zh-TW/dashboard.json
git commit -m "feat(console): adapt providers module to shared shell"
```

## Chunk 5: Verification

### Task 5: Verify the phase 1 slice end-to-end

**Files:**
- Review only

- [ ] **Step 1: Run targeted tests for the new shell and providers slice**

Run:

```bash
pnpm test -- tests/unit/lib/console/module-registry.test.ts
pnpm test -- tests/unit/console/console-shell.test.tsx
pnpm test -- tests/unit/console/console-layouts.test.tsx
pnpm test -- tests/unit/settings/providers/providers-module-page.test.tsx
pnpm test -- 'src/app/[locale]/settings/providers/_components/provider-manager.test.tsx'
```

Expected: all targeted tests PASS.

- [ ] **Step 2: Run repo quality checks**

Run:

```bash
pnpm lint
pnpm typecheck
```

Expected: exit 0. If there are unrelated baseline failures, document them exactly before proceeding.

- [ ] **Step 3: Inspect final worktree and confirm isolation**

Run:

```bash
git status --short
```

Expected: only intended console-shell phase-1 files are changed in the isolated worktree.
