import { describe, expect, test } from "vitest";
import {
  getVisibleConsoleModuleTabs,
  getVisibleConsoleModules,
  resolveConsoleRoute,
} from "@/lib/console/module-registry";

describe("overview and traffic route metadata", () => {
  test("resolves overview routes to the expected secondary tabs", () => {
    expect(resolveConsoleRoute("/dashboard")?.moduleId).toBe("overview");
    expect(resolveConsoleRoute("/dashboard")?.secondaryTabId).toBe("home");

    expect(resolveConsoleRoute("/dashboard/leaderboard")).toMatchObject({
      moduleId: "overview",
      secondaryTabId: "leaderboard",
    });

    expect(resolveConsoleRoute("/dashboard/availability")).toMatchObject({
      moduleId: "overview",
      secondaryTabId: "availability",
    });
  });

  test("resolves traffic routes to the expected secondary tabs", () => {
    expect(resolveConsoleRoute("/dashboard/logs")).toMatchObject({
      moduleId: "traffic",
      secondaryTabId: "logs",
    });

    expect(resolveConsoleRoute("/dashboard/users")).toMatchObject({
      moduleId: "traffic",
      secondaryTabId: "users",
    });

    expect(resolveConsoleRoute("/dashboard/sessions")).toMatchObject({
      moduleId: "traffic",
      secondaryTabId: "sessions",
    });

    expect(resolveConsoleRoute("/dashboard/my-quota")).toMatchObject({
      moduleId: "traffic",
      secondaryTabId: "my-quota",
    });

    expect(resolveConsoleRoute("/dashboard/quotas/users")).toMatchObject({
      moduleId: "traffic",
      secondaryTabId: "quotas",
    });
  });

  test("keeps the session detail route grouped under traffic and marked full bleed", () => {
    expect(resolveConsoleRoute("/dashboard/sessions/session-123/messages")).toMatchObject({
      moduleId: "traffic",
      secondaryTabId: "sessions",
      fullBleed: true,
    });
  });

  test("exposes module defaults for overview and traffic", () => {
    const moduleDefaults = getVisibleConsoleModules("admin").map((module) => ({
      id: module.id,
      defaultHref: module.defaultHref,
    }));

    expect(moduleDefaults).toContainEqual({
      id: "overview",
      defaultHref: "/dashboard",
    });
    expect(moduleDefaults).toContainEqual({
      id: "traffic",
      defaultHref: "/dashboard/logs",
    });
  });

  test("filters overview and traffic tabs by role without losing route resolution", () => {
    const adminOverviewTabs = getVisibleConsoleModuleTabs({
      moduleId: "overview",
      role: "admin",
    });
    const userOverviewTabs = getVisibleConsoleModuleTabs({
      moduleId: "overview",
      role: "user",
    });
    const adminTrafficTabs = getVisibleConsoleModuleTabs({
      moduleId: "traffic",
      role: "admin",
    });
    const userTrafficTabs = getVisibleConsoleModuleTabs({
      moduleId: "traffic",
      role: "user",
    });

    expect(adminOverviewTabs.map((tab) => tab.id)).toEqual(["home", "leaderboard", "availability"]);
    expect(userOverviewTabs.map((tab) => tab.id)).toEqual(["home", "leaderboard"]);

    expect(adminTrafficTabs.map((tab) => tab.id)).toEqual(["logs", "users", "sessions", "quotas"]);
    expect(userTrafficTabs.map((tab) => tab.id)).toEqual(["logs", "users", "my-quota"]);
  });
});
