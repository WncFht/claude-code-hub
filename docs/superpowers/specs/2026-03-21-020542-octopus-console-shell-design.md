# Octopus-Inspired Console Shell Design

## Goal

Rebuild the `dashboard + settings` experience in Claude Code Hub into a unified, octopus-inspired operator console shell that feels module-first instead of route-first, while preserving the current Next.js App Router structure, auth semantics, locale routing, and business data flows.

This work is explicitly scoped to:

- `src/app/[locale]/dashboard/**`
- `src/app/[locale]/settings/**`

It does **not** cover:

- `login`
- `my-usage`
- `usage-doc`
- proxy runtime or backend business semantics

## Problem

Claude Code Hub already has strong operational features, but the frontend experience is split across two mental models:

- `dashboard` behaves like one admin area
- `settings` behaves like a second admin area

This produces three practical problems.

### 1. The product feels structurally fragmented

Operators are navigating filesystem groupings instead of product modules. Provider-related work is spread across dashboard pages, settings pages, prices, and related actions. The user is forced to reconstruct the information architecture in their head.

### 2. Navigation rhythm is inconsistent

The current UI mixes:

- dashboard header navigation
- settings sidebar navigation
- mobile sheet navigation
- page-local controls and actions

As a result, the operator experience does not have the fast, module-switching feel that makes Octopus effective.

### 3. The wrong layer would be expensive to rewrite

The CCH frontend is not a thin SPA shell. It depends heavily on:

- App Router layouts and route segmentation
- server-side auth and redirects
- locale-prefixed routing
- server actions plus selected `react-query` live queries

A literal port of Octopus frontend runtime structure would create avoidable risk by rewriting route/runtime boundaries that are already working.

## Constraints

- Keep the existing App Router structure as the runtime foundation.
- Preserve auth and redirect semantics for admin and non-admin users.
- Preserve current locale routing and `next-intl` behavior.
- Preserve server action behavior and business semantics.
- Do not scope creep into `login`, `my-usage`, or `usage-doc`.
- Allow moderate information architecture reorganization for `dashboard + settings`.
- Prefer staged migration with rollback points over a big-bang rewrite.
- Preserve current role-based visibility semantics, including admin-only settings pages and non-admin dashboard access where already supported.
- Preserve page-level permission semantics inside modules; module grouping must not flatten route-specific access rules into coarse top-level visibility only.
- Preserve special full-bleed route behavior for pages that intentionally bypass the normal content container.
- All new user-facing strings must stay inside i18n.
- Ship with tests around new shell, navigation mapping, and module adapters.

## Chosen Approach

Adopt an **architecture-level UI migration**, not a theme swap and not a runtime rewrite.

The chosen cut line is:

- **Rewrite** the shell, navigation model, module grouping, page composition contracts, and responsive navigation behavior.
- **Add** a module registry plus page adapters that map existing route pages into a unified console model.
- **Preserve** existing business pages, server actions, auth boundaries, and route semantics underneath as much as possible in phase 1.

This approach aims to capture the best parts of Octopus frontend:

- one shell
- one navigation rhythm
- module-first scanning
- toolbar-driven operator workflows
- stronger mobile behavior

without paying the cost of replacing the underlying Next.js route runtime with a new SPA architecture.

The phrase "one unified console shell" means a **shared shell system and shared module model**, not necessarily a single physical layout file in phase 0. Because current auth boundaries differ between `dashboard` and `settings`, the first implementation may mount the same shell primitives from both route layouts while preserving their existing access rules.

## Target Product Model

The new console should be perceived as a single operator product, not two separate backends.

### Primary modules

The target top-level module model is:

1. `Overview`
2. `Traffic`
3. `Providers`
4. `Policy`
5. `System`

### Module mapping

#### Overview

Owns high-level operational awareness:

- dashboard landing page
- leaderboard
- availability summary
- live sessions and top-level operator attention

#### Traffic

Owns usage and actor-level inspection:

- usage logs
- quotas
- users
- session-level inspection flows

#### Providers

Owns supply-side operations:

- provider inventory
- vendor grouping
- endpoint health
- testing tools
- pricing

This is the highest-priority module for Octopus-inspired interaction design and should become the flagship sample of the new shell.

#### Policy

Owns request governance:

- sensitive words
- error rules
- request filters
- client version controls

#### System

Owns instance-wide administration:

- config
- notifications
- data import/export/backup
- log maintenance

## Shell Architecture

The frontend should be reorganized into three layers.

### Layer 1: New shared console shell

Introduce a shared shell responsible for:

- global header
- desktop module rail
- mobile bottom navigation or compact sheet navigation
- shell-level responsive layout
- global quick actions
- shared toolbar slots
- page hero slots
- secondary module tab slots
- page transition choreography

This replaces the current split between dashboard nav/header components and settings nav components.

In phase 0, this shell should be implemented as shared primitives that can be mounted from both existing route layouts, instead of forcing both trees into one new root layout immediately.

### Layer 2: Module registry and page adapters

Add a middle layer that translates route-level pages into product-level modules.

This layer should answer:

- which top-level module a pathname belongs to
- which secondary tabs are visible for that module
- which toolbar controls exist on the current page
- what hero title, description, and metrics the page exposes
- how route-local content should be staged inside the shell
- what page-level access rules or role gates still apply inside a visible module
- whether the current route uses the standard content stage or a full-bleed escape hatch

This adapter layer is the core mechanism that lets CCH feel like Octopus without rewriting every page body.

### Layer 3: Existing business page/content layer

Keep most current route pages and business logic in place at first:

- auth and redirect logic
- server actions
- repository-backed data semantics
- existing complex forms and operational tables

This content layer is wrapped by the new shell rather than replaced immediately.

This layer also retains route-specific escape hatches such as full-screen session/message views that should not be forced through the standard padded content stage.

Existing nested route layouts, such as route-local tab layouts, remain valid in phase 0 and phase 1. The shell migration should wrap them, not erase them, until a later module-specific cleanup deliberately replaces them.

## Route Strategy

### Phase 1 route policy

Keep existing URLs first.

The navigation should be reorganized so that users experience a single console, but the route runtime should remain close to the current layout structure during the initial migration.

Route grouping must respect current visibility rules:

- admin users see all console modules
- non-admin users only see the subset already allowed by current dashboard/session rules
- admin-only settings destinations remain inaccessible to non-admins even if the shell presents a unified module vocabulary

Within a visible module, page-level route permissions still apply. For example, a module may be visible to a broader audience while selected child pages inside that module remain admin-only.

Examples:

- `/dashboard` and `/dashboard/leaderboard` appear under `Overview`
- `/dashboard/logs`, `/dashboard/quotas/*`, `/dashboard/users` appear under `Traffic`
- `/dashboard/providers`, `/settings/providers`, `/settings/prices` appear under `Providers`
- `/settings/sensitive-words`, `/settings/error-rules`, `/settings/request-filters` appear under `Policy`
- `/settings/config`, `/settings/data`, `/settings/notifications`, `/settings/logs` appear under `System`

### Why not rewrite URLs first

Changing information architecture and URL runtime at the same time would:

- increase rollback cost
- complicate permission regression debugging
- blur whether failures came from shell migration or route migration

Route aliases and redirects can be introduced later, after the shell and module system are stable.

## UI Direction

The visual and interaction direction should explicitly borrow from Octopus, but not blindly clone it.

### Borrow directly

- module-first navigation rhythm
- compact left rail on desktop
- stronger mobile navigation behavior
- integrated toolbar for search/filter/sort/view mode
- dense, operational card/list layouts
- smooth shell-level transitions
- consistent page load choreography

### Preserve or extend from current CCH strengths

- current card vocabulary
- current chart and hero patterns
- current responsive data-heavy pages
- current theme variables and surface language where already compatible

### Avoid

- a superficial recolor that leaves old page structure intact
- a full SPA runtime rewrite
- giant modal-heavy workflows when inline operator actions are clearer

## Priority Module: Providers

`Providers` should be the first fully migrated module and the visual reference implementation for the rest of the console.

This module should unify the operator experience across:

- provider inventory
- provider vendor view
- endpoint inspection
- pricing
- testing and maintenance actions

Why this comes first:

- it is the closest area to Octopus's strengths
- it already has rich operational UI in CCH
- it offers the clearest return on shell, toolbar, and module-tab investments

## Migration Phases

### Phase 0: Build the shell, keep page bodies mostly in place

Deliverables:

- shared `ConsoleShell`
- unified navigation config / module registry
- responsive desktop and mobile nav
- toolbar and page hero contracts
- shell-level page transitions
- role-aware module visibility rules
- page-level permission support inside modules
- explicit escape-hatch handling for full-bleed routes
- compatibility with existing nested route layouts

Outcome:

Existing dashboard and settings content starts rendering inside the new shell, but underlying business pages remain mostly unchanged.

### Phase 1: Fully shape the Providers module

Deliverables:

- module landing experience for `Providers`
- secondary tabs or submodule navigation
- toolbar controls for search/filter/sort/view mode
- more consistent card/list layouts
- unified experience across current provider- and pricing-related pages

Outcome:

One complete module proves the architecture works and establishes the visual standard for subsequent phases.

### Phase 2: Rework Overview and Traffic

Deliverables:

- dashboard landing page composition inside the shell
- stronger module grouping for logs, quotas, users, sessions
- consistent hero, toolbar, and content staging rules

Outcome:

The most frequently visited operational surfaces now share one coherent interaction model.

### Phase 3: Rework Policy and System

Deliverables:

- governance pages folded into `Policy`
- configuration/maintenance pages folded into `System`
- optional route alias or redirect cleanup only if shell is already stable

Outcome:

The full `dashboard + settings` scope lives inside one product model.

## What Gets Rewritten First

- top-level shell components
- navigation components
- module registry / route metadata
- page adapter contracts
- toolbar primitives
- responsive shell behavior
- page hero and staging composition

## What Stays Intact First

- App Router runtime shape
- server-side auth and redirects
- existing server actions
- locale setup
- complex business tables and forms
- data semantics for providers, overview, statistics, quotas, filters, notifications

## Error Handling And Fault Isolation

The shell migration should fail soft wherever possible.

### Principles

- A broken module adapter should not break the whole console.
- Missing module metadata should degrade to safe defaults.
- Existing route pages should remain recoverable even if new shell composition fails for one module.
- Business data errors should stay local to the content region rather than collapsing shell navigation.

### Operational fallback

Phase 0 and Phase 1 should be gated behind a feature flag or equivalent rollout switch so the product can fall back to the current shell if needed.

## Testing Strategy

Testing should be expanded around the new architecture instead of relying only on existing page tests.

### 1. Module registry and route mapping tests

Verify:

- pathname to module resolution
- active nav item behavior
- secondary tab resolution
- route grouping stability

### 2. Shell component tests

Verify:

- desktop rail behavior
- mobile nav behavior
- toolbar slot rendering
- page hero rendering
- shell transition safety

### 3. Integration smoke tests

Verify:

- auth redirects still behave correctly
- locale-prefixed routing still works
- admin vs non-admin boundaries are preserved
- dashboard/settings pages still render under expected conditions

### 4. Module sample tests

Start with `Providers` and cover:

- search/filter/sort/view mode
- batch actions entry points
- adapter-provided titles and shell metadata
- current provider business UI rendered correctly inside the new shell

## Rollout And Completion Criteria

The migration should only be considered complete when all of the following are true:

1. `dashboard + settings` pages render inside one unified shell.
2. The `Providers` module clearly demonstrates the Octopus-inspired operator experience rather than a theme-only restyle.
3. Auth, locale, and business data semantics are preserved.
4. Build, lint, typecheck, unit tests, and targeted integration smoke tests pass.
5. Rollback to the previous shell remains possible until at least the end of Phase 1 validation.

## Alternatives Considered

### 1. Visual refresh only

Rejected because it keeps the current fragmented information architecture and would fail to capture the core operator experience that makes Octopus valuable.

### 2. Full SPA rewrite modeled directly on Octopus runtime structure

Rejected because it rewrites the wrong layer first. It would entangle shell redesign with auth, routing, locale, and server-side page behavior, dramatically increasing migration risk.

### 3. Brand-new parallel frontend mounted beside the current app

Rejected for phase 1 because it creates two frontends to maintain, duplicates route/data wiring, and delays learning from incremental rollout.

## Success Definition

Success means CCH still behaves like CCH operationally, but feels like a single, fast, modern operator console in the way Octopus does.

The defining product change is not "new colors" or "new components". It is the shift from:

- route-first admin surfaces

to:

- module-first operator workflows
