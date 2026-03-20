import { afterEach, describe, expect, test } from "vitest";
import {
  getVisibleConsoleModules,
  getVisibleConsoleRoutes,
  resolveConsoleRoute,
} from "@/lib/console/module-registry";
import { isOctopusConsoleShellEnabled } from "@/lib/console/console-shell-flag";

const ORIGINAL_FLAG = process.env.ENABLE_OCTOPUS_CONSOLE_SHELL;

afterEach(() => {
  if (ORIGINAL_FLAG === undefined) {
    delete process.env.ENABLE_OCTOPUS_CONSOLE_SHELL;
  } else {
    process.env.ENABLE_OCTOPUS_CONSOLE_SHELL = ORIGINAL_FLAG;
  }
});

describe("console module registry", () => {
  test("resolves modules across dashboard and settings routes", () => {
    expect(resolveConsoleRoute("/dashboard")?.moduleId).toBe("overview");
    expect(resolveConsoleRoute("/dashboard/providers")?.moduleId).toBe("providers");
    expect(resolveConsoleRoute("/settings/providers")?.moduleId).toBe("providers");
    expect(resolveConsoleRoute("/settings/config")?.moduleId).toBe("system");
  });

  test("marks session message routes as full bleed", () => {
    expect(resolveConsoleRoute("/dashboard/sessions/abc/messages")).toMatchObject({
      moduleId: "traffic",
      fullBleed: true,
    });
  });

  test("keeps parent modules visible while hiding admin-only child routes from non-admin users", () => {
    const userModules = getVisibleConsoleModules("user");
    const userOverviewRoutes = getVisibleConsoleRoutes({
      moduleId: "overview",
      role: "user",
    });

    expect(userModules.map((module) => module.id)).toContain("overview");
    expect(userOverviewRoutes.map((route) => route.href)).toContain("/dashboard");
    expect(userOverviewRoutes.map((route) => route.href)).not.toContain("/dashboard/availability");
  });
});

describe("console shell flag", () => {
  test("reads ENABLE_OCTOPUS_CONSOLE_SHELL from the environment", () => {
    delete process.env.ENABLE_OCTOPUS_CONSOLE_SHELL;
    expect(isOctopusConsoleShellEnabled()).toBe(false);

    process.env.ENABLE_OCTOPUS_CONSOLE_SHELL = "true";
    expect(isOctopusConsoleShellEnabled()).toBe(true);
  });
});
