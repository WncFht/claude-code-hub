/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { resolveConsoleRoute } from "@/lib/console/module-registry";

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

const routingMocks = vi.hoisted(() => ({
  redirect: vi.fn(({ href, locale }: { href: string; locale: string }) => ({ href, locale })),
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
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));

vi.mock(
  "@/app/[locale]/settings/providers/_components/provider-manager-loader",
  () => ({
    ProviderManagerLoader: ({ embedded }: { embedded?: boolean }) => (
      <div data-testid="provider-manager-loader" data-embedded={embedded ? "true" : "false"} />
    ),
  })
);

vi.mock(
  "@/app/[locale]/settings/providers/_components/auto-sort-priority-dialog",
  () => ({
    AutoSortPriorityDialog: () => <button type="button">auto-sort</button>,
  })
);

vi.mock(
  "@/app/[locale]/settings/providers/_components/recluster-vendors-dialog",
  () => ({
    ReclusterVendorsDialog: () => <button type="button">recluster</button>,
  })
);

vi.mock(
  "@/app/[locale]/settings/providers/_components/scheduling-rules-dialog",
  () => ({
    SchedulingRulesDialog: () => <button type="button">schedule</button>,
  })
);

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

function makeAsyncParams(locale: string) {
  return Promise.resolve({ locale }) as Promise<{ locale: string }>;
}

function makeSession(role: "admin" | "user" = "admin") {
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
      canLoginWebUi: true,
    },
  };
}

describe("Providers module pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("dashboard providers and settings providers share the same module hero and tabs", async () => {
    vi.resetModules();
    vi.doMock("@/app/[locale]/settings/providers/_components/providers-module-page", () => ({
      ProvidersModulePage: ({
        activeTab,
        children,
      }: {
        activeTab: string;
        children: ReactNode;
      }) => (
        <div data-slot="providers-module-page" data-active-tab={activeTab}>
          {children}
        </div>
      ),
    }));

    authMocks.getSession.mockResolvedValue(makeSession("admin"));

    const DashboardProvidersPage = (await import("@/app/[locale]/dashboard/providers/page")).default;
    const SettingsProvidersPage = (await import("@/app/[locale]/settings/providers/page")).default;

    const dashboardHtml = renderToStaticMarkup(
      await DashboardProvidersPage({ params: makeAsyncParams("en") })
    );
    const settingsHtml = renderToStaticMarkup(await SettingsProvidersPage());

    expect(dashboardHtml).toContain('data-slot="providers-module-page"');
    expect(settingsHtml).toContain('data-slot="providers-module-page"');
    expect(dashboardHtml).toContain('data-active-tab="inventory"');
    expect(settingsHtml).toContain('data-active-tab="inventory"');
    expect(dashboardHtml).toContain('data-embedded="true"');
    expect(settingsHtml).toContain('data-embedded="true"');

    vi.doUnmock("@/app/[locale]/settings/providers/_components/providers-module-page");
  });

  test("providers module exposes shared inventory and pricing tabs", async () => {
    vi.resetModules();
    const { ProvidersModulePage } = await import(
      "@/app/[locale]/settings/providers/_components/providers-module-page"
    );

    const html = renderToStaticMarkup(
      await ProvidersModulePage({
        activeTab: "inventory",
        inventoryHref: "/settings/providers",
        pricingHref: "/settings/prices",
        children: <div>Inventory surface</div>,
      })
    );

    expect(html).toContain('data-tab-id="inventory"');
    expect(html).toContain('data-tab-id="pricing"');
    expect(html).toContain("nav.providers");
    expect(html).toContain("nav.prices");
  });

  test("pricing routes stay grouped under providers module metadata", () => {
    expect(resolveConsoleRoute("/settings/prices")).toMatchObject({
      moduleId: "providers",
    });
  });
});
