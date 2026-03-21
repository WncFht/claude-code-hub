import { describe, expect, test } from "vitest";
import { buildConsoleBootstrap } from "@/lib/console/console-bootstrap";
import { mapLegacyConsolePath } from "@/lib/console/legacy-route-map";
import { getDefaultConsolePath, resolveConsoleRuntimeRoute } from "@/lib/console/runtime-route-map";

describe("console runtime route map", () => {
  test("resolves overview and traffic console slugs", () => {
    expect(resolveConsoleRuntimeRoute("/console/overview")).toMatchObject({
      screenId: "overview-home",
      moduleId: "overview",
      consolePath: "/console/overview",
      fullBleed: false,
    });

    expect(resolveConsoleRuntimeRoute("/console/traffic/logs")).toMatchObject({
      screenId: "traffic-logs",
      moduleId: "traffic",
      consolePath: "/console/traffic/logs",
      fullBleed: false,
    });
  });

  test("maps legacy dashboard and settings paths to console paths", () => {
    expect(mapLegacyConsolePath("/dashboard/logs")).toBe("/console/traffic/logs");
    expect(mapLegacyConsolePath("/settings/client-versions")).toBe(
      "/console/policy/client-versions"
    );
    expect(mapLegacyConsolePath("/dashboard/quotas/providers")).toBe(
      "/console/traffic/quotas/providers"
    );
  });

  test("preserves full-bleed session message routes in the new console path model", () => {
    expect(mapLegacyConsolePath("/dashboard/sessions/abc/messages")).toBe(
      "/console/traffic/sessions/abc/messages"
    );

    expect(resolveConsoleRuntimeRoute("/console/traffic/sessions/abc/messages")).toMatchObject({
      screenId: "traffic-session-messages",
      moduleId: "traffic",
      fullBleed: true,
    });
  });

  test("maps remaining detail and diagnostic routes into the console runtime", () => {
    expect(mapLegacyConsolePath("/dashboard/leaderboard/user/7")).toBe(
      "/console/overview/leaderboard/users/7"
    );
    expect(resolveConsoleRuntimeRoute("/console/overview/leaderboard/users/7")).toMatchObject({
      screenId: "overview-user-insights",
      moduleId: "overview",
      fullBleed: false,
    });

    expect(mapLegacyConsolePath("/dashboard/rate-limits")).toBe("/console/traffic/rate-limits");
    expect(resolveConsoleRuntimeRoute("/console/traffic/rate-limits")).toMatchObject({
      screenId: "traffic-rate-limits",
      moduleId: "traffic",
      fullBleed: false,
    });

    expect(mapLegacyConsolePath("/dashboard/quotas/keys")).toBe("/console/traffic/quotas/keys");
    expect(resolveConsoleRuntimeRoute("/console/traffic/quotas/keys")).toMatchObject({
      screenId: "traffic-quotas",
      moduleId: "traffic",
      fullBleed: false,
    });
  });

  test("builds role-aware bootstrap payloads and normalizes invalid paths", () => {
    expect(getDefaultConsolePath("admin")).toBe("/console/overview");
    expect(getDefaultConsolePath("user")).toBe("/console/overview");

    expect(
      buildConsoleBootstrap({
        locale: "zh-CN",
        pathname: "/console/not-a-real-screen",
        role: "admin",
      })
    ).toMatchObject({
      locale: "zh-CN",
      role: "admin",
      requestedPath: "/console/not-a-real-screen",
      currentPath: "/console/overview",
      activeRoute: {
        screenId: "overview-home",
        moduleId: "overview",
      },
    });
  });
});
