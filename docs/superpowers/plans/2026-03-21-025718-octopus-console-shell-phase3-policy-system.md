# Octopus Console Shell Phase 3 Policy System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fold the remaining governance and instance-administration routes into explicit `Policy` and `System` modules so the entire `dashboard + settings` scope reads like one product model.

**Architecture:** Extend the shared shell and route registry with `Policy`/`System` secondary tab metadata, then replace the current page-local `SettingsPageHeader` framing with two shared module wrappers. Preserve all existing settings auth rules, server actions, and data semantics, and postpone route alias cleanup until after the module wrappers and regression tests are stable.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl, Tailwind CSS v4, framer-motion, TanStack Query, Vitest, happy-dom

---

## File Structure

### New code units

- `src/app/[locale]/settings/_components/policy-module-page.tsx`
  Purpose: shared module framing for sensitive words, error rules, request filters, and client versions.

- `src/app/[locale]/settings/_components/system-module-page.tsx`
  Purpose: shared module framing for config, data, notifications, and logs.

- `tests/unit/console/policy-system-route-metadata.test.ts`
  Purpose: verifies secondary tab metadata, role-aware visibility, and route grouping for `Policy` and `System`.

- `tests/unit/settings/policy-module-page.test.tsx`
  Purpose: verifies shared policy framing across governance pages.

- `tests/unit/settings/system-module-page.test.tsx`
  Purpose: verifies shared system framing across configuration and maintenance pages.

### Modified code units

- `src/lib/console/module-registry.ts`
  Responsibility change: extend route metadata so `Policy` and `System` pages expose stable secondary tabs and module-level defaults.

- `src/app/[locale]/settings/request-filters/page.tsx`
- `src/app/[locale]/settings/sensitive-words/page.tsx`
- `src/app/[locale]/settings/error-rules/page.tsx`
- `src/app/[locale]/settings/client-versions/page.tsx`
  Responsibility change: render governance surfaces under the shared `Policy` module frame.

- `src/app/[locale]/settings/config/page.tsx`
- `src/app/[locale]/settings/data/page.tsx`
- `src/app/[locale]/settings/notifications/page.tsx`
- `src/app/[locale]/settings/logs/page.tsx`
  Responsibility change: render system-administration surfaces under the shared `System` module frame.

- `src/app/[locale]/settings/page.tsx`
  Responsibility change: keep the settings index redirect aligned with the preferred module default after `Policy` and `System` wrappers are introduced.

- `messages/en/settings/nav.json`
- `messages/ja/settings/nav.json`
- `messages/ru/settings/nav.json`
- `messages/zh-CN/settings/nav.json`
- `messages/zh-TW/settings/nav.json`
  Responsibility change: add or refine any `Policy`/`System` tab labels that differ from current left-nav wording.

- `messages/en/settings/strings.json`
- `messages/ja/settings/strings.json`
- `messages/ru/settings/strings.json`
- `messages/zh-CN/settings/strings.json`
- `messages/zh-TW/settings/strings.json`
  Responsibility change: add shared module hero copy for `Policy` and `System`.

### Existing content units expected to stay intact initially

- `src/app/[locale]/settings/notifications/_components/**`
- `src/app/[locale]/settings/data/_components/**`
- `src/app/[locale]/settings/config/_components/**`
- `src/app/[locale]/settings/request-filters/_components/**`
- `src/app/[locale]/settings/sensitive-words/_components/**`
- `src/app/[locale]/settings/error-rules/_components/**`
- `src/app/[locale]/settings/client-versions/_components/**`

These should be wrapped, not rewritten, unless a page-level title or tab region must move into the module wrapper.

## Chunk 1: Policy And System Route Metadata

### Task 1: Add secondary tab metadata for governance and system routes

**Files:**
- Modify: `src/lib/console/module-registry.ts`
- Test: `tests/unit/console/policy-system-route-metadata.test.ts`

- [ ] **Step 1: Write the failing metadata test**

Cover these behaviors:

- `/settings/sensitive-words`, `/settings/error-rules`, `/settings/request-filters`, and `/settings/client-versions` resolve to the `policy` module with distinct secondary tab ids
- `/settings/config`, `/settings/data`, `/settings/notifications`, and `/settings/logs` resolve to the `system` module with distinct secondary tab ids
- module defaults stay stable for admin users
- non-admin users still do not gain access to any admin-only settings route, even if shell vocabulary now includes the module names

- [ ] **Step 2: Run the metadata test to verify failure**

Run:

```bash
pnpm test -- tests/unit/console/policy-system-route-metadata.test.ts
```

Expected: FAIL because the registry does not yet expose `Policy` and `System` secondary tab metadata.

- [ ] **Step 3: Implement the minimal registry extension**

Implementation notes:

- keep route metadata serializable and consistent with the Phase 1/2 shell contracts
- do not change auth guards in page files during this task
- keep the existing `/settings/page.tsx` redirect behavior stable until wrapper defaults are ready

- [ ] **Step 4: Re-run the metadata test**

Run:

```bash
pnpm test -- tests/unit/console/policy-system-route-metadata.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the metadata slice**

Run:

```bash
git add src/lib/console/module-registry.ts tests/unit/console/policy-system-route-metadata.test.ts
git commit -m "feat(console): add policy and system route metadata"
```

## Chunk 2: Policy Module Wrapper

### Task 2: Build the shared `Policy` module page and adapt governance routes

**Files:**
- Create: `src/app/[locale]/settings/_components/policy-module-page.tsx`
- Modify: `src/app/[locale]/settings/request-filters/page.tsx`
- Modify: `src/app/[locale]/settings/sensitive-words/page.tsx`
- Modify: `src/app/[locale]/settings/error-rules/page.tsx`
- Modify: `src/app/[locale]/settings/client-versions/page.tsx`
- Modify: `messages/en/settings/nav.json`
- Modify: `messages/ja/settings/nav.json`
- Modify: `messages/ru/settings/nav.json`
- Modify: `messages/zh-CN/settings/nav.json`
- Modify: `messages/zh-TW/settings/nav.json`
- Modify: `messages/en/settings/strings.json`
- Modify: `messages/ja/settings/strings.json`
- Modify: `messages/ru/settings/strings.json`
- Modify: `messages/zh-CN/settings/strings.json`
- Modify: `messages/zh-TW/settings/strings.json`
- Test: `tests/unit/settings/policy-module-page.test.tsx`

- [ ] **Step 1: Write the failing policy module test**

Cover these behaviors:

- sensitive words, error rules, request filters, and client versions all render the same `Policy` wrapper slots
- module tabs highlight the correct governance surface
- existing page-local section bodies render inside the wrapper without duplicating a second top-level hero

- [ ] **Step 2: Run the policy module test to verify failure**

Run:

```bash
pnpm test -- tests/unit/settings/policy-module-page.test.tsx
```

Expected: FAIL because there is no shared `Policy` module wrapper yet.

- [ ] **Step 3: Implement the policy module wrapper and page integration**

Implementation notes:

- follow the Providers pattern: shared hero, shared secondary tabs, existing page content below
- preserve each page’s current data loading and error handling
- prefer reusing existing `SettingsPageHeader` copy strings only if they still match the module narrative; otherwise add shared module copy to settings i18n

- [ ] **Step 4: Re-run policy tests**

Run:

```bash
pnpm test -- tests/unit/settings/policy-module-page.test.tsx
pnpm test -- tests/unit/console/policy-system-route-metadata.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit the policy slice**

Run:

```bash
git add 'src/app/[locale]/settings/_components/policy-module-page.tsx' 'src/app/[locale]/settings/request-filters/page.tsx' 'src/app/[locale]/settings/sensitive-words/page.tsx' 'src/app/[locale]/settings/error-rules/page.tsx' 'src/app/[locale]/settings/client-versions/page.tsx' messages/en/settings/nav.json messages/ja/settings/nav.json messages/ru/settings/nav.json messages/zh-CN/settings/nav.json messages/zh-TW/settings/nav.json messages/en/settings/strings.json messages/ja/settings/strings.json messages/ru/settings/strings.json messages/zh-CN/settings/strings.json messages/zh-TW/settings/strings.json tests/unit/settings/policy-module-page.test.tsx
git commit -m "feat(console): adapt policy module to shared shell"
```

## Chunk 3: System Module Wrapper

### Task 3: Build the shared `System` module page and adapt configuration and maintenance routes

**Files:**
- Create: `src/app/[locale]/settings/_components/system-module-page.tsx`
- Modify: `src/app/[locale]/settings/config/page.tsx`
- Modify: `src/app/[locale]/settings/data/page.tsx`
- Modify: `src/app/[locale]/settings/notifications/page.tsx`
- Modify: `src/app/[locale]/settings/logs/page.tsx`
- Modify: `src/app/[locale]/settings/page.tsx`
- Modify: `messages/en/settings/nav.json`
- Modify: `messages/ja/settings/nav.json`
- Modify: `messages/ru/settings/nav.json`
- Modify: `messages/zh-CN/settings/nav.json`
- Modify: `messages/zh-TW/settings/nav.json`
- Modify: `messages/en/settings/strings.json`
- Modify: `messages/ja/settings/strings.json`
- Modify: `messages/ru/settings/strings.json`
- Modify: `messages/zh-CN/settings/strings.json`
- Modify: `messages/zh-TW/settings/strings.json`
- Test: `tests/unit/settings/system-module-page.test.tsx`

- [ ] **Step 1: Write the failing system module test**

Cover these behaviors:

- config, data, notifications, and logs render inside the same `System` wrapper
- tabs highlight the current destination correctly
- client-side notifications still render within the shared module frame without breaking loading/error states
- `/settings` continues redirecting to the intended default system destination

- [ ] **Step 2: Run the system module test to verify failure**

Run:

```bash
pnpm test -- tests/unit/settings/system-module-page.test.tsx
```

Expected: FAIL because there is no shared `System` module wrapper yet.

- [ ] **Step 3: Implement the system module wrapper and page integration**

Implementation notes:

- preserve the client-side notifications page as a wrapped client surface rather than rewriting its hook orchestration
- preserve config/data/logs page sections and forms; only move top-level framing into the shared wrapper
- keep `settings/page.tsx` as a redirect until a deliberate landing page exists

- [ ] **Step 4: Re-run system and console tests**

Run:

```bash
pnpm test -- tests/unit/settings/system-module-page.test.tsx
pnpm test -- tests/unit/console/policy-system-route-metadata.test.ts
pnpm test -- tests/unit/console/console-layouts.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit the system slice**

Run:

```bash
git add 'src/app/[locale]/settings/_components/system-module-page.tsx' 'src/app/[locale]/settings/config/page.tsx' 'src/app/[locale]/settings/data/page.tsx' 'src/app/[locale]/settings/notifications/page.tsx' 'src/app/[locale]/settings/logs/page.tsx' 'src/app/[locale]/settings/page.tsx' messages/en/settings/nav.json messages/ja/settings/nav.json messages/ru/settings/nav.json messages/zh-CN/settings/nav.json messages/zh-TW/settings/nav.json messages/en/settings/strings.json messages/ja/settings/strings.json messages/ru/settings/strings.json messages/zh-CN/settings/strings.json messages/zh-TW/settings/strings.json tests/unit/settings/system-module-page.test.tsx
git commit -m "feat(console): adapt system module to shared shell"
```

## Chunk 4: Optional Route Cleanup

### Task 4: Only after wrappers are stable, evaluate low-risk alias and redirect cleanup

**Files:**
- Review first; modify only if needed after validation

- [ ] **Step 1: Review whether any shell-facing redirects are now misleading**

Check:

- `src/app/[locale]/settings/page.tsx`
- any shell nav defaults in `src/lib/console/module-registry.ts`

Decision gate:

- if existing redirects already align with the new module defaults, do nothing
- if they do not, add the minimal redirect/default-href cleanup needed for consistency

- [ ] **Step 2: If cleanup is needed, write the failing regression test first**

Run the smallest relevant page or metadata test before changing the redirect/default behavior.

- [ ] **Step 3: Apply the minimal cleanup and re-run the regression test**

Expected: redirect/default behavior stays explicit and predictable.

- [ ] **Step 4: Commit only if code actually changed**

Run:

```bash
git add <changed-files>
git commit -m "refactor(console): align settings redirects with module defaults"
```

## Chunk 5: Verification

### Task 5: Verify the Phase 3 slice end-to-end

**Files:**
- Review only

- [ ] **Step 1: Run targeted shell and module tests**

Run:

```bash
pnpm test -- tests/unit/console/policy-system-route-metadata.test.ts tests/unit/settings/policy-module-page.test.tsx tests/unit/settings/system-module-page.test.tsx tests/unit/console/console-layouts.test.tsx
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

Expected: only intended Phase 3 files are changed in the isolated worktree.
