# Octopus-Inspired Frontend Refresh Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the dashboard/settings visual shell and the providers page so CCH feels closer to an operator cockpit, borrowing Octopus's stronger theme cohesion and card hierarchy without changing CCH's product structure.

**Architecture:** Keep the existing Next.js multi-page layout and replace only the shared presentation layer: global theme tokens, dashboard/settings wrappers, and provider-page composition. Introduce a reusable hero surface and a provider operator summary so the providers page becomes the first complete example of the new shell.

**Tech Stack:** Next.js 16, React 19, next-intl, Tailwind CSS v4, framer-motion, Vitest, happy-dom

---

## Chunk 1: Shared Primitives And Operator Summary

### Task 1: Lock down new shared primitives

**Files:**
- Create: `src/components/page-hero.tsx`
- Test: `src/components/page-hero.test.tsx`
- Create: `src/app/[locale]/settings/providers/_components/provider-operator-overview.ts`
- Test: `src/app/[locale]/settings/providers/_components/provider-operator-overview.test.ts`

- [ ] **Step 1: Write the failing tests for the hero and provider summary utility**

- [ ] **Step 2: Run targeted tests to verify failure**

Run:

```bash
pnpm test -- src/components/page-hero.test.tsx
pnpm test -- 'src/app/[locale]/settings/providers/_components/provider-operator-overview.test.ts'
```

Expected: both tests fail for missing components/utility.

- [ ] **Step 3: Implement the minimal hero component and provider summary helper**

- [ ] **Step 4: Run targeted tests to verify pass**

Run:

```bash
pnpm test -- src/components/page-hero.test.tsx
pnpm test -- 'src/app/[locale]/settings/providers/_components/provider-operator-overview.test.ts'
```

Expected: both tests PASS.

## Chunk 2: Providers Operator View

### Task 2: Add a providers-page regression test for operator summary framing

**Files:**
- Create: `src/app/[locale]/settings/providers/_components/provider-manager.test.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/provider-manager.tsx`
- Modify: `src/app/[locale]/settings/providers/page.tsx`
- Modify: `messages/en/settings/providers/strings.json`
- Modify: `messages/zh-CN/settings/providers/strings.json`
- Modify: `messages/zh-TW/settings/providers/strings.json`
- Modify: `messages/ja/settings/providers/strings.json`
- Modify: `messages/ru/settings/providers/strings.json`

- [ ] **Step 1: Write a failing UI test for the operator hero and toolbar summary**

Cover:

- operator hero renders overview metrics
- current result count and active filter count are visible
- list and vendor views remain switchable

- [ ] **Step 2: Run targeted test to verify failure**

Run: `pnpm test -- 'src/app/[locale]/settings/providers/_components/provider-manager.test.tsx'`
Expected: FAIL because the page does not yet expose the operator hero layout.

- [ ] **Step 3: Implement the provider operator hero, overview metrics, and cleaner toolbar framing**

Keep existing filtering and batch-edit behavior intact.

- [ ] **Step 4: Run targeted test to verify pass**

Run: `pnpm test -- 'src/app/[locale]/settings/providers/_components/provider-manager.test.tsx'`
Expected: PASS

### Task 3: Restyle provider list surfaces without changing behavior

**Files:**
- Modify: `src/app/[locale]/settings/providers/_components/provider-list.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/provider-rich-list-item.tsx`
- Test: `tests/unit/settings/providers/provider-rich-list-item-endpoints.test.tsx`

- [ ] **Step 1: Write a failing row-surface test if a suitable one does not already cover the new hierarchy**

Cover:

- card-style list surface renders
- model/status badges remain visible
- empty state remains intact

- [ ] **Step 2: Run targeted test to verify failure**

Run: `pnpm test -- tests/unit/settings/providers/provider-rich-list-item-endpoints.test.tsx`
Expected: FAIL because the row surface/hierarchy does not yet match the refreshed layout.

- [ ] **Step 3: Implement the list card treatment and cleaner metadata grouping**

- [ ] **Step 4: Run targeted test to verify pass**

Run: `pnpm test -- tests/unit/settings/providers/provider-rich-list-item-endpoints.test.tsx`
Expected: PASS

## Chunk 3: Shared Shell Refresh

### Task 4: Refresh global theme and dashboard/settings shells

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/[locale]/dashboard/_components/dashboard-header.tsx`
- Modify: `src/app/[locale]/dashboard/_components/dashboard-main.tsx`
- Modify: `src/components/section.tsx`
- Modify: `src/app/[locale]/settings/_components/settings-page-header.tsx`

- [ ] **Step 1: Add or update targeted render tests if needed for changed shell wrappers**

- [ ] **Step 2: Run the focused tests that cover touched shared components**

Run:

```bash
pnpm test -- src/components/page-hero.test.tsx
pnpm test -- 'src/app/[locale]/settings/providers/_components/provider-manager.test.tsx'
```

Expected: current tests stay green before shell edits.

- [ ] **Step 3: Implement the warm background, larger rounded surfaces, and stronger navigation shell**

Keep session messages fullscreen behavior unchanged.

- [ ] **Step 4: Re-run focused tests**

Run:

```bash
pnpm test -- src/components/page-hero.test.tsx
pnpm test -- 'src/app/[locale]/settings/providers/_components/provider-manager.test.tsx'
```

Expected: PASS

## Chunk 4: Final Verification

### Task 5: Verify the first-round frontend refresh

**Files:**
- Review only

- [ ] **Step 1: Run targeted frontend tests**

Run:

```bash
pnpm test -- src/components/page-hero.test.tsx
pnpm test -- 'src/app/[locale]/settings/providers/_components/provider-operator-overview.test.ts'
pnpm test -- 'src/app/[locale]/settings/providers/_components/provider-manager.test.tsx'
pnpm test -- tests/unit/settings/providers/provider-rich-list-item-endpoints.test.tsx
```

Expected: all targeted tests PASS.

- [ ] **Step 2: Run repo quality checks**

Run:

```bash
pnpm lint
pnpm typecheck
```

Expected: exit 0, or exact baseline failures documented.

- [ ] **Step 3: Inspect final worktree**

Run: `git status --short`
Expected: only intended frontend-refresh changes are present.
