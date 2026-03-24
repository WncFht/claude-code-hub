import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getPendingLegacySchemaRepairs,
  shouldBaselineLegacyDrizzleMigrations,
} from "@/lib/migrate";

describe("migrate bootstrap helpers", () => {
  it("baselines an empty journal when the public schema is already provisioned", () => {
    expect(
      shouldBaselineLegacyDrizzleMigrations({
        migrationRowCount: 0,
        hasProvisionedPublicSchema: true,
      })
    ).toBe(true);
  });

  it("does not baseline when the schema is only partially provisioned", () => {
    expect(
      shouldBaselineLegacyDrizzleMigrations({
        migrationRowCount: 0,
        hasProvisionedPublicSchema: false,
      })
    ).toBe(false);
  });

  it("does not baseline when the drizzle journal already has rows", () => {
    expect(
      shouldBaselineLegacyDrizzleMigrations({
        migrationRowCount: 3,
        hasProvisionedPublicSchema: true,
      })
    ).toBe(false);
  });

  it("repairs the missing codex billing source column when system_settings already exists", () => {
    expect(
      getPendingLegacySchemaRepairs({
        hasSystemSettingsTable: true,
        hasCodexPriorityBillingSource: false,
      })
    ).toEqual(["system_settings.codex_priority_billing_source"]);
  });

  it("skips schema repairs when the required column already exists", () => {
    expect(
      getPendingLegacySchemaRepairs({
        hasSystemSettingsTable: true,
        hasCodexPriorityBillingSource: true,
      })
    ).toEqual([]);
  });

  it("skips schema repairs when system_settings is absent", () => {
    expect(
      getPendingLegacySchemaRepairs({
        hasSystemSettingsTable: false,
        hasCodexPriorityBillingSource: false,
      })
    ).toEqual([]);
  });
});
