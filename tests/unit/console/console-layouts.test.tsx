/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ConsoleModuleId } from "@/lib/console/module-registry";

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

const routingMocks = vi.hoisted(() => ({
  redirect: vi.fn(({ href, locale }: { href: string; locale: string }) => ({ href, locale })),
  usePathname: vi.fn(),
}));

const intlServerMocks = vi.hoisted(() => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));

vi.mock("@/lib/auth", () => authMocks);

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  redirect: routingMocks.redirect,
  usePathname: routingMocks.usePathname,
}));

vi.mock("next-intl/server", () => intlServerMocks);

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...rest }: { children: ReactNode; [key: string]: unknown }) => (
      <div {...rest}>{children}</div>
    ),
  },
}));

vi.mock("@/app/[locale]/dashboard/_components/dashboard-header", () => ({
  DashboardHeader: () => <div data-testid="dashboard-header">Header</div>,
}));

vi.mock("@/app/[locale]/dashboard/_components/webhook-migration-dialog", () => ({
  WebhookMigrationDialog: () => <div data-testid="webhook-migration-dialog" />,
}));

vi.mock("@/app/[locale]/settings/_components/settings-nav", () => ({
  SettingsNav: () => <div data-testid="settings-nav" />,
}));

vi.mock("@/app/[locale]/settings/_lib/nav-items", () => ({
  getTranslatedNavItems: vi.fn(async () => []),
}));

const ORIGINAL_FLAG = process.env.ENABLE_OCTOPUS_CONSOLE_SHELL;

const MODULE_LABELS: Record<ConsoleModuleId, string> = {
  overview: "Overview",
  traffic: "Traffic",
  providers: "Providers",
  policy: "Policy",
  system: "System",
};

function makeAsyncParams(locale: string) {
  const promise = Promise.resolve({ locale });
  return promise as Promise<{ locale: string }>;
}

function makeSession({
  role = "admin",
  canLoginWebUi = true,
}: {
  role?: "admin" | "user";
  canLoginWebUi?: boolean;
}) {
  return {
    user: {
      id: 1,
      name: "tester",
      description: "",
      role,
      rpm: null,
      dailyQuota: null,
      providerGroup: null,
      tags: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      dailyResetMode: "fixed" as const,
      dailyResetTime: "00:00",
      isEnabled: true,
    },
    key: {
      canLoginWebUi,
    },
  };
}

describe("console layouts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ENABLE_OCTOPUS_CONSOLE_SHELL = "true";
  });

  afterEach(() => {
    if (ORIGINAL_FLAG === undefined) {
      delete process.env.ENABLE_OCTOPUS_CONSOLE_SHELL;
    } else {
      process.env.ENABLE_OCTOPUS_CONSOLE_SHELL = ORIGINAL_FLAG;
    }
  });

  test("dashboard layout now acts as a passthrough wrapper for legacy redirects", async () => {
    routingMocks.usePathname.mockReturnValue("/dashboard");
    authMocks.getSession.mockResolvedValue(makeSession({ role: "user", canLoginWebUi: true }));

    const DashboardLayout = (await import("@/app/[locale]/dashboard/layout")).default;
    const html = renderToStaticMarkup(
      await DashboardLayout({
        children: <div>Dashboard content</div>,
        params: makeAsyncParams("en"),
      })
    );

    expect(routingMocks.redirect).not.toHaveBeenCalled();
    expect(html).toContain("Dashboard content");
  });

  test("settings layout no longer performs auth redirects", async () => {
    routingMocks.usePathname.mockReturnValue("/settings/config");
    authMocks.getSession.mockResolvedValue(makeSession({ role: "user", canLoginWebUi: true }));

    const SettingsLayout = (await import("@/app/[locale]/settings/layout")).default;
    const html = renderToStaticMarkup(
      await SettingsLayout({
        children: <div>Settings content</div>,
        params: makeAsyncParams("en"),
      })
    );

    expect(routingMocks.redirect).not.toHaveBeenCalled();
    expect(html).toContain("Settings content");
  });

  test("dashboard main keeps session message routes full bleed inside the shared stage", async () => {
    routingMocks.usePathname.mockReturnValue("/dashboard/sessions/abc/messages");

    const { DashboardMain } = await import("@/app/[locale]/dashboard/_components/dashboard-main");
    const html = renderToStaticMarkup(
      <DashboardMain
        shellEnabled={true}
        role="admin"
        moduleLabels={MODULE_LABELS}
        header={<div data-testid="dashboard-header">Header</div>}
      >
        <div>Messages</div>
      </DashboardMain>
    );

    expect(html).toContain('data-stage-mode="full-bleed"');
    expect(html).toContain("overflow-hidden");
  });

  test("settings layout simply returns children for legacy shim routes", async () => {
    routingMocks.usePathname.mockReturnValue("/settings/config");
    authMocks.getSession.mockResolvedValue(makeSession({ role: "admin", canLoginWebUi: true }));

    const SettingsLayout = (await import("@/app/[locale]/settings/layout")).default;
    const html = renderToStaticMarkup(
      await SettingsLayout({
        children: <div>Settings content</div>,
        params: makeAsyncParams("en"),
      })
    );

    expect(html).toContain("Settings content");
  });
});
