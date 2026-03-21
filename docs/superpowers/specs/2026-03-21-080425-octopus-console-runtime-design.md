# Octopus Console Runtime Design

## Goal

Replace the current hybrid `dashboard + settings` shell migration with a true single-entry operator console runtime that feels structurally like Octopus, while still preserving Claude Code Hub's server-side auth, locale routing, deep links, and backend semantics.

The target experience is:

- one console entrypoint
- one app shell
- one navigation rhythm
- screen-level lazy loading and preloading
- toolbar-driven module workflows
- URL-addressable deep links

This is intentionally a larger runtime change than the existing Phase 1-3 shell work.

## Scope

This design covers all admin/operator work currently under:

- `src/app/[locale]/dashboard/**`
- `src/app/[locale]/settings/**`

It does not cover:

- `login`
- `my-usage`
- `usage-doc`
- proxy runtime / request pipeline semantics
- public marketing or documentation surfaces

## Why The Current Hybrid Is Not Enough

The current console work improved framing, but it still keeps the old runtime model:

- `dashboard` and `settings` remain separate App Router trees
- route pages still own most page composition
- the top shell is still the old dashboard header
- the new module wrappers only unify hero and tab framing

That means the deployed UI is visually closer to Octopus, but not behaviorally close:

- navigation is still route-first, not console-first
- toolbar ownership is still page-local
- runtime preloading is still route-centric
- the shell cannot coordinate screen lifecycle the way Octopus does

If the goal is to actually "bring Octopus frontend over", the next step cannot be more wrapper work. It must be a runtime cut.

## Chosen Direction

Adopt a **single-entry, URL-driven, half-SPA console**.

Concretely:

1. Add a new App Router entrypoint under `/[locale]/console/[[...slug]]`
2. Make that route the main operator runtime
3. Mount a client-side `ConsoleApp` that owns shell, navigation, toolbar, screen loading, and transitions
4. Keep the URL as the source of truth for active screen and screen params
5. Gradually convert existing `dashboard/*` and `settings/*` routes into legacy compatibility redirects to `/console/*`

This is **not** a pure SPA:

- auth and locale still come from App Router
- the server still performs initial gating and bootstrap
- URLs remain canonical
- deep links remain first-class

This is also **not** the current hybrid:

- the client console app becomes the primary runtime
- route pages stop being the true owners of operator page composition

## Non-Goals

- Replacing all backend data access with a new API surface in one shot
- Rewriting every page body before the runtime migration lands
- Preserving current internal component ownership exactly as-is
- Reusing the old `dashboard/layout.tsx` and `settings/layout.tsx` as permanent shell roots

## Runtime Architecture

The new console is organized into five layers.

### 1. Server Entry Layer

New route:

- `src/app/[locale]/console/[[...slug]]/page.tsx`

Responsibilities:

- resolve locale
- enforce auth
- determine operator role
- normalize the requested console slug
- derive bootstrap payload needed by the client shell
- redirect unsupported visitors (`my-usage`, login, forbidden admin screens)

This layer should stay thin. It replaces the current split between `dashboard/layout.tsx` and `settings/layout.tsx` as the main console runtime boundary.

### 2. Console Route Registry

The existing `module-registry.ts` should evolve into a broader runtime registry.

It must describe:

- module ids
- screen ids
- URL slugs
- legacy route mappings
- role visibility
- full-bleed requirements
- preload targets
- default landing screen per role
- whether a screen is implemented as:
  - native client screen
  - legacy route adapter
  - special transition / escape hatch

The registry becomes the source of truth for both:

- the shell navigation model
- compatibility between old URLs and new `/console/*` URLs

### 3. Client Console App

New client runtime:

- `ConsoleApp`
- `ConsoleShell`
- `ConsoleHeader`
- `ConsoleSidebar`
- `ConsoleToolbarHost`
- `ConsoleScreenLoader`

This layer is the Octopus-like core.

Responsibilities:

- render the shared shell
- derive active screen from URL
- switch modules/screens with client navigation
- coordinate transitions
- host screen-specific toolbar controls
- preload adjacent or hovered screens
- persist view preferences per screen

The shell owns lifecycle. Individual screens no longer behave like top-level pages.

### 4. Screen Adapter Layer

Each operator destination becomes a console screen.

There are three categories.

#### A. Direct client screens

These are already close to the target runtime and should migrate first:

- providers inventory
- provider pricing
- notifications
- data
- most config form sections

These screens can usually be mounted directly under `ConsoleApp` with minimal server glue.

#### B. Hybrid screens with server-shaped inputs

These need a data adapter or bootstrap bridge before they fit naturally:

- overview dashboard landing
- leaderboard
- availability
- client versions
- policy screens that still depend on server action entrypoints

These should move toward explicit query/mutation hooks or server bootstrap payloads plus client rendering.

#### C. Special escape-hatch screens

These retain special layout behavior:

- session message detail views
- other full-bleed or intentionally immersive routes

They still live inside the new console runtime, but bypass the default padded stage.

### 5. Legacy Compatibility Layer

Existing `/dashboard/*` and `/settings/*` URLs remain valid during migration, but should eventually become compatibility shims.

Compatibility behavior:

- old URL requested
- server normalizes to a console screen
- server redirects to `/[locale]/console/...`

This keeps:

- bookmarks
- existing documentation links
- external references
- human muscle memory

while letting `/console` become the actual product surface.

## URL Model

The URL remains canonical.

Examples:

- `/zh-CN/console/overview`
- `/zh-CN/console/overview/leaderboard`
- `/zh-CN/console/traffic/logs`
- `/zh-CN/console/traffic/sessions`
- `/zh-CN/console/providers/inventory`
- `/zh-CN/console/providers/pricing`
- `/zh-CN/console/policy/client-versions`
- `/zh-CN/console/system/config`

Special cases:

- `/zh-CN/console/traffic/sessions/[sessionId]/messages`

The slug format should mirror the product model, not legacy filesystem folders.

## Permission Model

Permissions remain server-backed and screen-specific.

Rules:

- non-authenticated visitors are redirected before `ConsoleApp` mounts
- non-admin web users still follow current web-ui admission rules
- admin-only screens remain inaccessible even if the module is visible at a higher level
- module visibility and screen visibility stay distinct

This is already partially encoded in the current registry and must be preserved.

## Navigation Model

The shell becomes module-first.

### Primary navigation

Global modules:

1. `Overview`
2. `Traffic`
3. `Providers`
4. `Policy`
5. `System`

### Secondary navigation

Each module exposes screen tabs from registry metadata.

Examples:

- `Overview`: home, leaderboard, availability
- `Traffic`: logs, users, sessions, quotas, my quota
- `Providers`: inventory, pricing
- `Policy`: sensitive words, error rules, request filters, client versions
- `System`: config, data, notifications, logs

### Toolbar

Toolbar ownership moves to the shell.

Each screen may optionally register toolbar controls such as:

- search
- sort
- view mode
- filter chips
- create actions
- bulk actions

The shell decides where toolbar content lives. Screens supply configuration and callbacks.

This is the biggest interaction gap between current CCH and Octopus, and it is the primary reason to do the runtime cut.

## State Model

The new runtime uses four classes of state.

### 1. URL state

Source of truth for:

- active module
- active screen
- detail screen params
- shareable filters that should survive reload or copy-paste

### 2. Shell UI state

Client-only state for:

- nav expansion
- mobile rail visibility
- current transition direction
- pending screen navigation

### 3. Screen preference state

Persisted client state for:

- grid/list choice
- sort field/order
- local search text when it should survive module switching
- screen-specific presentation preferences

This is the runtime analogue of Octopus's toolbar stores.

### 4. Data cache state

Managed through existing query or adapter hooks.

The console runtime should avoid inventing a second business-state layer. Query caches remain the right place for fetched data.

## Data Access Strategy

The runtime migration should avoid a backend rewrite. Instead, each screen adopts one of these patterns:

### Pattern A: Reuse existing client hook directly

Example candidates:

- notifications
- provider manager internals
- data page widgets

### Pattern B: Add a thin client adapter around existing server action endpoints

Example candidates:

- client versions
- system forms that still enter from server pages

### Pattern C: Create a dedicated bootstrap payload for the initial screen, then hydrate client widgets

Example candidates:

- overview landing
- leaderboard
- availability

The target is not "everything must be CSR-only". The target is that `ConsoleApp` owns screen composition while data can still originate from server-friendly sources.

## Migration Strategy

The runtime cut should happen in staged phases.

### Phase 4: Runtime foundation

- add `/console` entry route
- add new runtime registry and slug normalization
- add `ConsoleApp` shell, loader, transitions, toolbar host
- keep old routes working

Exit condition:

- `/console/*` can render at least a minimal shell and one migrated screen

### Phase 5: First migrated client screens

Migrate the most client-ready screens first:

- providers inventory
- providers pricing
- notifications
- data
- config

Exit condition:

- the new console is usable for real admin work in at least `Providers` and `System`

### Phase 6: Overview and traffic migration

Migrate:

- dashboard landing
- leaderboard
- availability
- logs
- users
- sessions
- quota views

Exit condition:

- the most-used operator flows are running in `/console`

### Phase 7: Policy migration

Migrate:

- sensitive words
- error rules
- request filters
- client versions

Exit condition:

- all in-scope modules are accessible in the new runtime

### Phase 8: Compatibility cleanup

- convert old `dashboard/settings` routes into redirects
- remove obsolete hybrid shell entrypoints
- retire duplicated page framing components where no longer needed

Exit condition:

- `/console` is the primary operator runtime
- legacy URLs are compatibility shims only

## Special Cases

### Full-bleed session messages

The current session-message view is intentionally different. It should stay special.

Requirement:

- preserve full-bleed behavior
- preserve direct deep links
- preserve message-detail performance characteristics

### Locale-aware navigation

The console runtime must continue using locale-prefixed URLs and the existing `next-intl` navigation helpers.

### Role-sensitive module defaults

The default screen for a module may differ by role.

Examples:

- `Traffic` may default to `logs` for admin and `my-quota` for restricted users
- `Overview` must hide admin-only availability when not permitted

## Risks

### 1. Runtime split-brain during migration

If both the old hybrid shell and the new `/console` shell evolve in parallel for too long, the product will fragment again.

Mitigation:

- once `/console` foundation lands, stop adding major UX work to the old hybrid shell

### 2. Server-page coupling slows migration

Several current pages still assume server-page ownership.

Mitigation:

- classify screens by migration difficulty
- migrate client-ready screens first
- use adapters instead of rewriting business logic immediately

### 3. Redirect churn breaks expected links

Mitigation:

- define legacy route mappings centrally
- test slug normalization and redirect coverage explicitly

### 4. Toolbar contracts become inconsistent

Mitigation:

- define a single screen-to-toolbar contract early
- do not let each screen invent ad hoc toolbar APIs

## Testing Strategy

Tests should be added at three layers.

### Registry and routing

- console slug resolution
- role-aware visibility
- legacy URL to `/console` mapping
- full-bleed route metadata

### Shell runtime

- shell mounts from server bootstrap payload
- module nav highlights active module
- screen loader renders the correct screen
- toolbar host swaps screen controls
- preloading hooks are called for expected targets

### Screen migration regression

- migrated screens render under the new shell
- old route compatibility redirects land on equivalent `/console` screens
- special full-bleed session views preserve layout mode

## Exit Criteria

The redesign is complete when:

- `/[locale]/console/*` is the primary admin/operator runtime
- all current `dashboard + settings` operator screens are reachable from that runtime
- old `dashboard/settings` URLs resolve via compatibility redirects
- toolbar behavior is shell-owned rather than page-owned
- the current hybrid shell path is removable without losing functionality

## Decision Summary

The project is no longer pursuing "Octopus-inspired shell wrappers" as the main path.

It is now pursuing:

- a server-bootstrapped
- URL-driven
- single-entry
- half-SPA operator console

That is the cleanest way to actually import the useful runtime qualities of Octopus without discarding Claude Code Hub's existing server-side strengths.
