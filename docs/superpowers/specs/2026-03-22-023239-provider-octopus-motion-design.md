# Provider Octopus Motion Design

## Goal

Make the provider management UI feel like Octopus when opening and closing edit and clone flows, while keeping Claude Code Hub's existing provider data model, form fields, permissions, and Next.js page structure.

The target experience is:

- one shared-layout morph chain per provider dialog
- no secondary entrance animation after the morph lands
- no delayed form mount that makes the dialog shell arrive before the content
- consistent edit and clone behavior across desktop and mobile
- lower list-level rendering pressure so dialog transitions stay responsive

## Scope

This design covers the provider settings inventory surfaces under:

- `src/app/[locale]/settings/providers/_components/provider-rich-list-item.tsx`
- `src/app/[locale]/settings/providers/_components/provider-morph-dialog.tsx`
- `src/app/[locale]/settings/providers/_components/provider-dialog-frame.tsx`
- `src/app/[locale]/settings/providers/_components/provider-list.tsx`

It also includes the provider-specific tests that lock in the new behavior.

It does not cover:

- the provider form business logic itself
- unrelated dashboard or console routes
- a full-card provider detail experience equivalent to Octopus channel cards
- backend API or data-fetching semantics

## Problem Summary

The current provider animation feels laggy for structural reasons, not because of a single bad easing curve.

Today the flow is split into multiple independent stages:

1. `ProviderMorphDialog` morphs the trigger into a modal shell.
2. `ProviderDialogFrame` runs its own `opacity + y` entrance animation after the shell already exists.
3. `ProviderRichListItem` waits two `requestAnimationFrame` ticks before mounting `ProviderForm`, showing a skeleton first.

These three stages do not share one layout lifecycle, so the dialog feels like it detaches from its origin and reassembles itself after opening.

The list layer also renders every provider row eagerly, which increases the amount of React work competing with the animation on larger inventories.

## Reference Model From Octopus

Octopus group and channel flows feel better because they centralize motion around one dialog primitive:

- the trigger and dialog content share one `layoutId`
- the portal container only owns backdrop and centering
- the dialog content is the motion surface
- title and description remain inside the same motion tree
- large form bodies can opt out of layout animation without delaying mount

This is the model to copy.

## Chosen Direction

Adopt an Octopus-style provider morph system with three concrete rules.

### 1. Single Morph Surface

`ProviderMorphDialog` becomes the single owner of the shared-layout transition.

It should:

- keep the hidden in-flow trigger placeholder while open
- keep the portal/backdrop behavior
- own the dialog content motion surface
- expose title/body helpers or equivalent layout hooks so inner content does not start a second entrance animation

### 2. Static Dialog Chrome

`ProviderDialogFrame` should keep the provider-specific visual chrome, but stop animating itself independently.

That means:

- remove the nested `initial/animate` entrance motion
- keep the close button and visual shell
- let the morph container handle opening and closing

### 3. Immediate Content Mount

Provider edit and clone forms should mount immediately when the dialog opens.

Instead of delaying mount:

- keep the content in the same render pass as the dialog body
- if a body region proves too layout-heavy, disable layout animation for that region rather than deferring the whole form
- use a single dialog implementation for desktop and mobile so the motion behavior is consistent

## Trigger Strategy

For this migration, keep the existing edit and clone icon triggers.

Reasoning:

- it matches current provider interaction expectations
- it is closer to Octopus group edit behavior than Octopus channel full-card detail behavior
- it avoids reworking provider row click semantics, row actions, and selection mode in the same change

This means the migration copies the Octopus group-style morph model first, not the full Octopus channel card-detail pattern.

## List Rendering Direction

The provider list should reduce unnecessary row work during dialog interactions.

For this slice:

- keep the current list layout and selection behavior
- preserve `React.memo` on provider rows
- precompute the vendor lookup once at the list level
- introduce lightweight list virtualization or windowing if it can be done without destabilizing the provider page

If virtualization adds too much risk in the same slice, the dialog refactor remains mandatory and virtualization becomes a follow-up. Motion correctness comes first.

## Testing Strategy

The migration needs tests that assert behavior, not styling trivia.

Required coverage:

- provider morph dialog no longer depends on a secondary frame entrance animation
- provider edit flow mounts real form content immediately when opened
- provider clone flow uses the same morph dialog path on mobile and desktop
- provider list still renders provider rows and action triggers correctly after the refactor

The tests should follow TDD:

- write the failing test first
- run it to verify the failure is caused by missing behavior
- implement the minimal change
- re-run the targeted tests

## Risks

### Form weight

Mounting the provider form immediately may expose real render cost that was previously hidden behind the skeleton.

Mitigation:

- keep the dialog motion primitive simple
- profile through tests and local interaction after the refactor
- if needed, disable layout animation for heavy inner sections rather than reintroducing delayed mount

### Mobile behavior drift

Desktop and mobile currently diverge for clone flows.

Mitigation:

- make both breakpoints use one provider dialog path
- keep any size differences in CSS only

### Regressions in accessibility

Changing the dialog primitive can break focus return or keyboard close behavior.

Mitigation:

- preserve focus trap, escape handling, and return-focus behavior
- lock these behaviors with targeted dialog tests

## Success Criteria

This migration is successful when:

- opening provider edit or clone feels like one motion event instead of three
- the dialog content no longer appears to detach from the opening trigger
- mobile and desktop use the same provider dialog behavior
- provider dialog tests and provider manager tests pass
- repo-level lint, typecheck, and build complete successfully
