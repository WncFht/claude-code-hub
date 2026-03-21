# Octopus Dashboard Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CCH feel closer to Octopus by adding the dashboard heatmap panel, switching the shared color system to the Octopus green palette, and introducing smoother page/dialog transitions without changing backend behavior.

**Architecture:** Keep the current Next.js dashboard/settings structure and layer the Octopus look through shared primitives only: global theme tokens, a reusable dashboard activity panel, and animated shell/dialog wrappers. Reuse existing statistics data and provider form flows so the visual upgrade stays low risk and deployable in small slices.

**Tech Stack:** Next.js 16, React 19, next-intl, Tailwind CSS v4, framer-motion, Radix UI, Vitest, happy-dom

---

## Chunk 1: Dashboard Heatmap Panel

### Task 1: Add failing coverage for the new dashboard activity panel

**Files:**
- Modify: `tests/unit/dashboard/dashboard-home-layout.test.tsx`
- Create: `src/app/[locale]/dashboard/_components/dashboard-activity-panel.tsx`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run `pnpm test -- tests/unit/dashboard/dashboard-home-layout.test.tsx` and verify failure**
- [ ] **Step 3: Implement the minimal heatmap panel using existing dashboard statistics data**
- [ ] **Step 4: Re-run `pnpm test -- tests/unit/dashboard/dashboard-home-layout.test.tsx` and verify pass**

## Chunk 2: Octopus Green Theme

### Task 2: Apply the Octopus palette to the shared shell

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/[locale]/dashboard/_components/bento/bento-grid.tsx`
- Modify: `src/components/page-hero.tsx`
- Modify: `src/components/section.tsx`

- [ ] **Step 1: Keep existing shell tests green before changing tokens**
- [ ] **Step 2: Implement Octopus-style green tokens, background atmosphere, and card surfaces**
- [ ] **Step 3: Run focused frontend tests plus `pnpm lint`**

## Chunk 3: Page And Dialog Motion

### Task 3: Introduce Octopus-style page transitions and provider dialog animation

**Files:**
- Create: `src/components/page-stage.tsx`
- Modify: `src/app/[locale]/dashboard/_components/dashboard-main.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/add-provider-dialog.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/provider-rich-list-item.tsx`
- Modify: `src/components/ui/dialog.tsx`

- [ ] **Step 1: Add failing UI coverage for page shell and provider dialog motion hooks where practical**
- [ ] **Step 2: Implement lightweight staggered page transitions and dialog open/close motion**
- [ ] **Step 3: Re-run targeted tests and verify no provider workflow regressions**

## Chunk 4: Verification And Deployment

### Task 4: Verify and deploy safely

**Files:**
- Review only

- [ ] **Step 1: Run focused tests**

```bash
pnpm test -- tests/unit/dashboard/dashboard-home-layout.test.tsx
```

- [ ] **Step 2: Run repo checks**

```bash
pnpm lint
pnpm typecheck
pnpm build
```

- [ ] **Step 3: Deploy through the local Docker overlay**

```bash
rsync -a --delete .next/ /Users/fanghaotian/Applications/claude-code-hub/local-build-context/.next/
rsync -a --delete public/ /Users/fanghaotian/Applications/claude-code-hub/local-build-context/public/
rsync -a --delete messages/ /Users/fanghaotian/Applications/claude-code-hub/local-build-context/messages/
docker compose -f /Users/fanghaotian/Applications/claude-code-hub/docker-compose.yaml build app
docker compose -f /Users/fanghaotian/Applications/claude-code-hub/docker-compose.yaml up -d --force-recreate app
curl --fail --silent http://127.0.0.1:23000/api/actions/health
```
