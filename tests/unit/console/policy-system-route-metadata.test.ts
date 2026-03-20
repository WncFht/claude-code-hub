import { describe, expect, test } from "vitest";
import {
  getVisibleConsoleModuleTabs,
  getVisibleConsoleModules,
  resolveConsoleRoute,
} from "@/lib/console/module-registry";

describe("policy and system route metadata", () => {
  test("resolves policy routes to the expected secondary tabs", () => {
    expect(resolveConsoleRoute("/settings/sensitive-words")).toMatchObject({
      moduleId: "policy",
      secondaryTabId: "sensitive-words",
    });

    expect(resolveConsoleRoute("/settings/error-rules")).toMatchObject({
      moduleId: "policy",
      secondaryTabId: "error-rules",
    });

    expect(resolveConsoleRoute("/settings/request-filters")).toMatchObject({
      moduleId: "policy",
      secondaryTabId: "request-filters",
    });

    expect(resolveConsoleRoute("/settings/client-versions")).toMatchObject({
      moduleId: "policy",
      secondaryTabId: "client-versions",
    });
  });

  test("resolves system routes to the expected secondary tabs", () => {
    expect(resolveConsoleRoute("/settings/config")).toMatchObject({
      moduleId: "system",
      secondaryTabId: "config",
    });

    expect(resolveConsoleRoute("/settings/data")).toMatchObject({
      moduleId: "system",
      secondaryTabId: "data",
    });

    expect(resolveConsoleRoute("/settings/notifications")).toMatchObject({
      moduleId: "system",
      secondaryTabId: "notifications",
    });

    expect(resolveConsoleRoute("/settings/logs")).toMatchObject({
      moduleId: "system",
      secondaryTabId: "logs",
    });
  });

  test("exposes module defaults for policy and system", () => {
    const moduleDefaults = getVisibleConsoleModules("admin").map((module) => ({
      id: module.id,
      defaultHref: module.defaultHref,
    }));

    expect(moduleDefaults).toContainEqual({
      id: "policy",
      defaultHref: "/settings/sensitive-words",
    });
    expect(moduleDefaults).toContainEqual({
      id: "system",
      defaultHref: "/settings/config",
    });
  });

  test("keeps policy and system tabs admin-only", () => {
    const adminPolicyTabs = getVisibleConsoleModuleTabs({
      moduleId: "policy",
      role: "admin",
    });
    const adminSystemTabs = getVisibleConsoleModuleTabs({
      moduleId: "system",
      role: "admin",
    });
    const userPolicyTabs = getVisibleConsoleModuleTabs({
      moduleId: "policy",
      role: "user",
    });
    const userSystemTabs = getVisibleConsoleModuleTabs({
      moduleId: "system",
      role: "user",
    });

    expect(adminPolicyTabs.map((tab) => tab.id)).toEqual([
      "sensitive-words",
      "error-rules",
      "request-filters",
      "client-versions",
    ]);
    expect(adminSystemTabs.map((tab) => tab.id)).toEqual([
      "config",
      "data",
      "notifications",
      "logs",
    ]);

    expect(userPolicyTabs).toEqual([]);
    expect(userSystemTabs).toEqual([]);
    expect(getVisibleConsoleModules("user").map((module) => module.id)).not.toContain("policy");
    expect(getVisibleConsoleModules("user").map((module) => module.id)).not.toContain("system");
  });
});
