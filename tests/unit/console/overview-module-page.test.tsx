/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

const pricingMocks = vi.hoisted(() => ({
  hasPriceTable: vi.fn(),
}));

const systemSettingsMocks = vi.hoisted(() => ({
  getSystemSettings: vi.fn(),
}));

const routingMocks = vi.hoisted(() => ({
  redirect: vi.fn(({ href, locale }: { href: string; locale: string }) => ({ href, locale })),
}));

vi.mock("@/lib/auth", () => authMocks);
vi.mock("@/actions/model-prices", () => pricingMocks);
vi.mock("@/repository/system-config", () => systemSettingsMocks);

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

vi.mock("@/app/[locale]/dashboard/_components/dashboard-bento-sections", () => ({
  DashboardBentoSection: ({ embedded }: { embedded?: boolean }) => (
    <div data-testid="dashboard-bento-section" data-embedded={embedded ? "true" : "false"} />
  ),
}));

vi.mock("@/app/[locale]/dashboard/leaderboard/_components/leaderboard-view", () => ({
  LeaderboardView: () => <div data-testid="leaderboard-view" />,
}));

vi.mock("@/app/[locale]/dashboard/availability/_components/availability-dashboard", () => ({
  AvailabilityDashboard: () => <div data-testid="availability-dashboard" />,
}));

vi.mock("@/app/[locale]/dashboard/availability/_components/availability-skeleton", () => ({
  AvailabilityDashboardSkeleton: () => <div data-testid="availability-skeleton" />,
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

describe("Overview module page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pricingMocks.hasPriceTable.mockResolvedValue(true);
    systemSettingsMocks.getSystemSettings.mockResolvedValue({
      allowGlobalUsageView: true,
      currencyDisplay: "USD",
    });
  });

  test("dashboard landing, leaderboard, and availability mount the shared overview wrapper", async () => {
    vi.resetModules();
    vi.doMock("@/app/[locale]/dashboard/_components/overview-module-page", () => ({
      OverviewModulePage: ({ activeTab, children }: { activeTab: string; children: ReactNode }) => (
        <div data-slot="overview-module-page" data-active-tab={activeTab}>
          {children}
        </div>
      ),
    }));

    authMocks.getSession.mockResolvedValue(makeSession("admin"));

    const DashboardPage = (await import("@/app/[locale]/dashboard/page")).default;
    const LeaderboardPage = (await import("@/app/[locale]/dashboard/leaderboard/page")).default;
    const AvailabilityPage = (await import("@/app/[locale]/dashboard/availability/page")).default;

    const dashboardHtml = renderToStaticMarkup(
      await DashboardPage({ params: makeAsyncParams("en") })
    );
    const leaderboardHtml = renderToStaticMarkup(await LeaderboardPage());
    const availabilityHtml = renderToStaticMarkup(await AvailabilityPage());

    expect(dashboardHtml).toContain('data-slot="overview-module-page"');
    expect(leaderboardHtml).toContain('data-slot="overview-module-page"');
    expect(availabilityHtml).toContain('data-slot="overview-module-page"');

    expect(dashboardHtml).toContain('data-active-tab="home"');
    expect(leaderboardHtml).toContain('data-active-tab="leaderboard"');
    expect(availabilityHtml).toContain('data-active-tab="availability"');
    expect(dashboardHtml).toContain('data-embedded="true"');

    vi.doUnmock("@/app/[locale]/dashboard/_components/overview-module-page");
  });

  test("renders overview tabs consistently and highlights availability only on the availability route", async () => {
    const { OverviewModulePage } = await import(
      "@/app/[locale]/dashboard/_components/overview-module-page"
    );

    const html = renderToStaticMarkup(
      await OverviewModulePage({
        role: "admin",
        activeTab: "availability",
        title: "Availability",
        description: "Availability body",
        children: <div>Overview body</div>,
      })
    );

    expect(html).toContain('data-tab-id="home"');
    expect(html).toContain('data-tab-id="leaderboard"');
    expect(html).toContain('data-tab-id="availability"');
    expect(html).toContain('data-tab-id="availability" data-active="true"');
    expect(html).not.toContain('data-tab-id="leaderboard" data-active="true"');
    expect(html).toContain("console.routes.dashboard");
    expect(html).toContain("console.routes.leaderboard");
    expect(html).toContain("console.routes.availability");
  });

  test("hides the admin-only availability tab for non-admin overview shells", async () => {
    const { OverviewModulePage } = await import(
      "@/app/[locale]/dashboard/_components/overview-module-page"
    );

    const html = renderToStaticMarkup(
      await OverviewModulePage({
        role: "user",
        activeTab: "availability",
        title: "Availability",
        description: "Availability body",
        children: <div>Overview body</div>,
      })
    );

    expect(html).toContain('data-tab-id="home"');
    expect(html).toContain('data-tab-id="leaderboard"');
    expect(html).not.toContain('data-tab-id="availability"');
  });
});
