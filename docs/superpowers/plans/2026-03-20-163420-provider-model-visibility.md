# Provider Model Visibility Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist upstream model discovery per provider and surface both discovered models and routing whitelist state in provider list/detail UI.

**Architecture:** Add provider-level discovery snapshot fields in Drizzle, expose them through repository/action DTOs, then build a manual sync action and UI summaries/diffs on top of the persisted snapshot. `allowedModels` remains the routing allowlist while discovered models become read-mostly metadata.

**Tech Stack:** Next.js 16, React 19, next-intl, Drizzle ORM, Vitest, happy-dom

---

## Chunk 1: Docs And Schema Surface

### Task 1: Create runbook/spec/plan artifacts

**Files:**
- Create: `.codex/napkin.md`
- Create: `docs/superpowers/specs/2026-03-20-163420-provider-model-visibility-design.md`
- Create: `docs/superpowers/plans/2026-03-20-163420-provider-model-visibility.md`

- [ ] **Step 1: Write the documentation files**

- [ ] **Step 2: Review docs for repo-specific constraints**

Run: `sed -n '1,220p' .codex/napkin.md && sed -n '1,220p' docs/superpowers/specs/2026-03-20-163420-provider-model-visibility-design.md`
Expected: files exist and describe preserved `allowedModels` semantics plus persisted discovery fields.

- [ ] **Step 3: Commit docs**

```bash
git add .codex/napkin.md docs/superpowers/specs/2026-03-20-163420-provider-model-visibility-design.md docs/superpowers/plans/2026-03-20-163420-provider-model-visibility.md
git commit -m "docs: add provider model visibility design"
```

### Task 2: Extend provider schema/types

**Files:**
- Modify: `src/drizzle/schema.ts`
- Modify: `src/types/provider.ts`
- Modify: `src/repository/_shared/transformers.ts`
- Modify: `src/repository/provider.ts`
- Test: `tests/unit/repository/provider-batch-update-advanced-fields.test.ts`

- [ ] **Step 1: Write failing repository test for discovery field persistence**

Add a test that calls `updateProvidersBatch()` with discovery metadata and expects the update payload to include:

```ts
{
  discoveredModels: ["m1", "m2"],
  modelDiscoveryStatus: "success",
  lastModelSyncAt: expect.any(Date),
  lastModelSyncError: null,
}
```

- [ ] **Step 2: Run targeted test to verify failure**

Run: `pnpm test tests/unit/repository/provider-batch-update-advanced-fields.test.ts`
Expected: FAIL because batch update typings/implementation do not yet include discovery fields.

- [ ] **Step 3: Implement minimal schema/type/repository support**

Add:

- `discoveredModels`
- `modelDiscoveryStatus`
- `lastModelSyncAt`
- `lastModelSyncError`

to Drizzle schema, provider types, `toProvider()`, repository select lists, update payloads, and batch update typings.

- [ ] **Step 4: Generate migration**

Run: `pnpm exec drizzle-kit generate`
Expected: new generated SQL under `drizzle/`.

- [ ] **Step 5: Run targeted test to verify pass**

Run: `pnpm test tests/unit/repository/provider-batch-update-advanced-fields.test.ts`
Expected: PASS

- [ ] **Step 6: Commit schema layer**

```bash
git add src/drizzle/schema.ts src/types/provider.ts src/repository/_shared/transformers.ts src/repository/provider.ts drizzle tests/unit/repository/provider-batch-update-advanced-fields.test.ts
git commit -m "feat: persist provider model discovery snapshots"
```

## Chunk 2: Sync Action

### Task 3: Add sync action contract

**Files:**
- Modify: `src/actions/providers.ts`
- Test: `tests/unit/actions/providers-model-sync.test.ts`

- [ ] **Step 1: Write failing action tests**

Cover:

- success path stores sorted discovered models, status `success`, sync timestamp, cleared error
- failure path keeps old `discoveredModels` but writes status `error` and the new error message

- [ ] **Step 2: Run targeted test to verify failure**

Run: `pnpm test tests/unit/actions/providers-model-sync.test.ts`
Expected: FAIL because `syncProviderModels()` does not exist.

- [ ] **Step 3: Implement minimal sync action**

Use `findProviderById()`, `fetchUpstreamModels()`, repository update, and provider cache invalidation.

- [ ] **Step 4: Run targeted test to verify pass**

Run: `pnpm test tests/unit/actions/providers-model-sync.test.ts`
Expected: PASS

- [ ] **Step 5: Commit action layer**

```bash
git add src/actions/providers.ts tests/unit/actions/providers-model-sync.test.ts
git commit -m "feat: add provider model discovery sync action"
```

## Chunk 3: List And Form UI

### Task 4: Show discovery summary in provider list rows

**Files:**
- Modify: `src/app/[locale]/settings/providers/_components/provider-rich-list-item.tsx`
- Modify: `messages/en/settings/providers/list.json`
- Modify: `messages/zh-CN/settings/providers/list.json`
- Modify: `messages/zh-TW/settings/providers/list.json`
- Modify: `messages/ja/settings/providers/list.json`
- Modify: `messages/ru/settings/providers/list.json`
- Test: `tests/unit/settings/providers/provider-rich-list-item-endpoints.test.tsx`

- [ ] **Step 1: Write failing UI tests for row summary**

Cover:

- discovered count + whitelist count render together
- allow-all renders when whitelist is empty/null
- stale mismatch warning renders when whitelist-only entries exist

- [ ] **Step 2: Run targeted test to verify failure**

Run: `pnpm test tests/unit/settings/providers/provider-rich-list-item-endpoints.test.tsx`
Expected: FAIL because current row does not render discovery summary.

- [ ] **Step 3: Implement row summary + i18n**

- [ ] **Step 4: Run targeted test to verify pass**

Run: `pnpm test tests/unit/settings/providers/provider-rich-list-item-endpoints.test.tsx`
Expected: PASS

### Task 5: Show full comparison in provider form routing section

**Files:**
- Modify: `src/app/[locale]/settings/providers/_components/forms/provider-form/sections/routing-section.tsx`
- Modify: `src/app/[locale]/settings/providers/_components/model-multi-select.tsx`
- Modify: `messages/en/settings/providers/form/sections.json`
- Modify: `messages/en/settings/providers/form/modelSelect.json`
- Modify: same locale files under `zh-CN`, `zh-TW`, `ja`, `ru`
- Test: `tests/unit/settings/providers/provider-routing-model-visibility.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Cover:

- discovered models section renders existing snapshot
- whitelist-only and discovered-only groups are separated
- sync button state/metadata renders for success and error cases

- [ ] **Step 2: Run targeted test to verify failure**

Run: `pnpm test tests/unit/settings/providers/provider-routing-model-visibility.test.tsx`
Expected: FAIL because routing section lacks discovery comparison UI.

- [ ] **Step 3: Implement comparison panel and sync trigger**

Keep `ModelMultiSelect` as whitelist editor. Use provider snapshot for detail UI; optionally allow refresh callback from sync action to update local display.

- [ ] **Step 4: Run targeted test to verify pass**

Run: `pnpm test tests/unit/settings/providers/provider-routing-model-visibility.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit UI layer**

```bash
git add src/app/[locale]/settings/providers/_components/provider-rich-list-item.tsx src/app/[locale]/settings/providers/_components/forms/provider-form/sections/routing-section.tsx src/app/[locale]/settings/providers/_components/model-multi-select.tsx messages tests/unit/settings/providers
git commit -m "feat: show discovered and allowed provider models"
```

## Chunk 4: Final Verification

### Task 6: Run quality checks and record known baseline gaps

**Files:**
- Review only

- [ ] **Step 1: Run targeted feature tests**

Run:

```bash
pnpm test tests/unit/repository/provider-batch-update-advanced-fields.test.ts
pnpm test tests/unit/actions/providers-model-sync.test.ts
pnpm test tests/unit/settings/providers/provider-rich-list-item-endpoints.test.tsx
pnpm test tests/unit/settings/providers/provider-routing-model-visibility.test.tsx
```

Expected: all targeted tests PASS.

- [ ] **Step 2: Run broader checks**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Expected: exit 0, or clearly documented unrelated baseline issue.

- [ ] **Step 3: Run full test suite**

Run: `pnpm test`
Expected: feature-specific tests stay green; if the suite still fails on known baseline issues, record the exact files/errors.

- [ ] **Step 4: Final status commit if needed**

```bash
git status --short
```

Expected: clean worktree or only intentionally uncommitted notes.
