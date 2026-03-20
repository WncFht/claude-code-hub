# Provider Model Visibility Design

## Goal

Make every provider in Claude Code Hub expose two separate model views:

- the upstream-discovered model snapshot fetched from the real provider endpoint
- the configured routing whitelist (`allowedModels`) that controls scheduling

The UI must show a compact summary in the provider list and a full comparison in the provider edit flow, without changing current routing semantics.

## Problem

Today `allowedModels` carries too much weight in the settings UI. It is the only visible model list, but it is not a trustworthy upstream inventory:

- `allowedModels` can be empty to mean "allow all"
- admins can type arbitrary model IDs manually
- upstream discovery already exists transiently in `ModelMultiSelect`, but the result is not persisted
- provider rows do not summarize what is actually known upstream versus what is configured locally

This makes it hard to answer basic operational questions such as:

- what models does this provider actually expose now?
- which of those are explicitly whitelisted?
- which whitelist entries no longer exist upstream?

## Constraints

- Preserve `allowedModels` behavior as routing policy.
- Reuse existing `fetchUpstreamModels()` logic rather than introducing a second discovery stack.
- Persist discovery data on the provider record for stable list summaries and detail diffs.
- Keep all new user-facing strings behind `next-intl` across all supported locales.
- Ship with unit/UI tests.

## Chosen Approach

Store provider-level discovery snapshot fields directly on `providers`:

- `discoveredModels: string[] | null`
- `modelDiscoveryStatus: "idle" | "success" | "error" | null`
- `lastModelSyncAt: timestamp | null`
- `lastModelSyncError: text | null`

Then add a manual sync server action that:

1. loads the provider
2. calls `fetchUpstreamModels()` with the real credentials/proxy config
3. on success, overwrites the discovery snapshot, clears the error, stamps sync time
4. on failure, preserves the last good snapshot but records `error` state and error message

## Data Flow

### Persistence

- `src/drizzle/schema.ts` adds the new columns.
- repository selections and `toProvider()` include the new fields everywhere providers are read or written.
- `getProviders()` exposes the fields through `ProviderDisplay`.

### Sync

- `syncProviderModels(providerId)` lives in `src/actions/providers.ts`.
- The action is admin-only, reuses `findProviderById()`, and updates the provider through repository code.
- Cache invalidation follows the same provider edit path so the list refreshes cleanly.

### UI

- Provider list rows show a concise model summary:
  - discovered count or sync status
  - whitelist count or allow-all state
  - a small warning when whitelist and discovery diverge
- Routing section in the provider form shows:
  - discovered snapshot metadata
  - manual sync button
  - overlap / discovered-only / whitelist-only groups
  - existing `ModelMultiSelect` remains the whitelist editor

## Alternatives Considered

### 1. Reuse `allowedModels` for discovery

Rejected because it breaks scheduling semantics and destroys the distinction between operator intent and upstream truth.

### 2. Fetch discovery only on dialog open

Rejected because it produces unstable list summaries, repeats upstream calls, and gives no persisted audit trail.

### 3. Normalize discovery into a separate table

Rejected for now because the product requirement is read-heavy snapshot display, not historical model analytics. A provider-level snapshot is simpler and sufficient.

## Error Handling

- Unsupported or unreachable upstreams record `modelDiscoveryStatus = "error"` and `lastModelSyncError`.
- The last successful `discoveredModels` snapshot is retained on sync failure.
- UI clearly separates "never synced" from "last sync failed".

## Testing

- Repository tests cover batch/update support for the new fields.
- Action tests cover sync success and failure persistence behavior.
- Provider row UI tests cover summary rendering.
- Routing section/UI tests cover diff presentation and sync status rendering.

## Migration Impact

- Existing providers start with no discovery snapshot.
- No routing behavior changes.
- No user/key schema changes.
