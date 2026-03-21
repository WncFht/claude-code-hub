# Provider Octopus Motion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the provider settings dialogs so edit and clone transitions follow the Octopus morphing-dialog model, then verify, merge, and deploy the result.

**Architecture:** Replace the provider-specific multi-stage dialog sequence with a single shared-layout morph primitive, remove nested frame entrance animation, and unify desktop/mobile dialog flows around the same content path. Keep provider row actions and form business logic intact while tightening tests around the new motion structure.

**Tech Stack:** Next.js 16 App Router, React 19, Framer Motion, next-intl, TanStack Query, Vitest, happy-dom

---

## Chunk 1: Lock In The Motion Contract

### Task 1: Add failing provider animation tests

**Files:**
- Modify: `src/app/[locale]/settings/providers/_components/provider-dialog-frame.test.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/provider-morph-dialog.test.tsx`
- Create: `src/app/[locale]/settings/providers/_components/provider-rich-list-item.test.tsx`

- [ ] **Step 1: Write the failing tests**

Cover these behaviors:

- `ProviderDialogFrame` no longer declares its own entrance animation props
- opening provider edit renders real form content without the delayed skeleton handoff
- clone actions use the provider morph dialog path instead of a separate mobile `Dialog`

- [ ] **Step 2: Run the targeted tests to verify failure**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/settings/providers/_components/provider-dialog-frame.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-morph-dialog.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-rich-list-item.test.tsx'
```

Expected: FAIL because the current implementation still has nested frame motion, deferred form mount, and mixed dialog paths.

- [ ] **Step 3: Implement the minimal test scaffolding or mocks needed for provider row coverage**

Implementation notes:

- reuse existing provider test helpers where possible
- mock the heavy provider form dependencies only as much as needed to detect whether real content mounts immediately
- keep assertions focused on dialog structure and flow selection

- [ ] **Step 4: Re-run the targeted tests**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/settings/providers/_components/provider-dialog-frame.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-morph-dialog.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-rich-list-item.test.tsx'
```

Expected: still FAIL on production behavior gaps, but pass any new test harness setup.

- [ ] **Step 5: Commit the red test slice**

Run:

```bash
git add 'src/app/[locale]/settings/providers/_components/provider-dialog-frame.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-morph-dialog.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-rich-list-item.test.tsx'
git commit -m "test(providers): cover octopus-style dialog motion"
```

## Chunk 2: Collapse Provider Dialog Motion Into One Chain

### Task 2: Refactor the provider dialog primitive and frame

**Files:**
- Modify: `src/app/[locale]/settings/providers/_components/provider-morph-dialog.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/provider-dialog-frame.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/provider-dialog-frame.test.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/provider-morph-dialog.test.tsx`

- [ ] **Step 1: Re-run the targeted motion tests to confirm red**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/settings/providers/_components/provider-dialog-frame.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-morph-dialog.test.tsx'
```

Expected: FAIL because the frame still animates independently and the dialog primitive still reflects the old structure.

- [ ] **Step 2: Implement the Octopus-style dialog primitive**

Implementation notes:

- keep trigger placeholder and portal behavior
- keep focus lock, escape close, and return focus
- remove frame-owned entry motion so the morph surface is singular
- keep provider-specific chrome inside the static frame shell

- [ ] **Step 3: Re-run the dialog primitive tests**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/settings/providers/_components/provider-dialog-frame.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-morph-dialog.test.tsx'
```

Expected: PASS

- [ ] **Step 4: Commit the dialog primitive slice**

Run:

```bash
git add 'src/app/[locale]/settings/providers/_components/provider-morph-dialog.tsx' 'src/app/[locale]/settings/providers/_components/provider-dialog-frame.tsx' 'src/app/[locale]/settings/providers/_components/provider-dialog-frame.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-morph-dialog.test.tsx'
git commit -m "refactor(providers): unify provider dialog motion"
```

## Chunk 3: Unify Provider Edit And Clone Flows

### Task 3: Remove delayed form mounting and the extra mobile dialog path

**Files:**
- Modify: `src/app/[locale]/settings/providers/_components/provider-rich-list-item.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/provider-rich-list-item.test.tsx`

- [ ] **Step 1: Re-run the provider row tests to confirm red**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/settings/providers/_components/provider-rich-list-item.test.tsx'
```

Expected: FAIL because provider edit/clone still rely on delayed form readiness and a separate mobile clone dialog.

- [ ] **Step 2: Implement the provider row refactor**

Implementation notes:

- remove the `requestAnimationFrame`-based form readiness state
- mount `ProviderForm` immediately inside the dialog body
- keep edit and clone using `ProviderMorphDialog` on both desktop and mobile
- preserve existing action handlers, close behavior, and accessibility labels

- [ ] **Step 3: Re-run the provider row tests**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/settings/providers/_components/provider-rich-list-item.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-dialog-frame.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-morph-dialog.test.tsx'
```

Expected: PASS

- [ ] **Step 4: Commit the provider row slice**

Run:

```bash
git add 'src/app/[locale]/settings/providers/_components/provider-rich-list-item.tsx' 'src/app/[locale]/settings/providers/_components/provider-rich-list-item.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-dialog-frame.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-morph-dialog.test.tsx'
git commit -m "feat(providers): match octopus-style edit and clone flows"
```

## Chunk 4: Reduce List-Level Rendering Pressure

### Task 4: Tighten provider list rendering around the refactor

**Files:**
- Modify: `src/app/[locale]/settings/providers/_components/provider-list.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/provider-manager.test.tsx`

- [ ] **Step 1: Write or extend a failing list-level regression test**

Cover these behaviors:

- provider list still renders the provider rows correctly with the refactored item component
- provider manager behavior remains unchanged at the page level

- [ ] **Step 2: Run the manager/list tests to verify failure if coverage is new**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/settings/providers/_components/provider-manager.test.tsx'
```

Expected: either FAIL on the new assertion or expose any page-level regression from the dialog refactor.

- [ ] **Step 3: Implement the minimal list-layer cleanup**

Implementation notes:

- keep vendor lookup stable
- preserve current list layout unless a low-risk windowing improvement is obvious
- avoid broad provider page rewrites in this slice

- [ ] **Step 4: Re-run the manager/list tests**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/settings/providers/_components/provider-manager.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-rich-list-item.test.tsx'
```

Expected: PASS

- [ ] **Step 5: Commit the list cleanup slice**

Run:

```bash
git add 'src/app/[locale]/settings/providers/_components/provider-list.tsx' 'src/app/[locale]/settings/providers/_components/provider-manager.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-rich-list-item.test.tsx'
git commit -m "perf(providers): stabilize provider list rendering"
```

## Chunk 5: Verification, Merge, And Deploy

### Task 5: Run the provider frontend gate and ship it

**Files:**
- Review only

- [ ] **Step 1: Run the targeted provider test suite**

Run:

```bash
pnpm exec vitest run 'src/app/[locale]/settings/providers/_components/provider-dialog-frame.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-morph-dialog.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-rich-list-item.test.tsx' 'src/app/[locale]/settings/providers/_components/provider-manager.test.tsx'
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

Expected: build completes successfully with the provider motion refactor

- [ ] **Step 4: Merge back to `main` locally**

Run:

```bash
git checkout main
git merge feat/provider-motion-octopus
```

Expected: clean local merge

- [ ] **Step 5: Deploy the merged frontend locally**

Run:

```bash
pnpm build
rsync -a --delete .next/ /Users/fanghaotian/Applications/claude-code-hub/local-build-context/.next/
rsync -a --delete public/ /Users/fanghaotian/Applications/claude-code-hub/local-build-context/public/
rsync -a --delete messages/ /Users/fanghaotian/Applications/claude-code-hub/local-build-context/messages/
docker compose -f /Users/fanghaotian/Applications/claude-code-hub/docker-compose.yaml --project-directory /Users/fanghaotian/Applications/claude-code-hub up -d --build --force-recreate app
curl -fsS http://127.0.0.1:23000/api/actions/health
```

Expected: the app container recreates successfully and the health endpoint returns success
