/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ConsoleShell } from "@/components/console/console-shell";
import { resolveConsoleRoute, type ConsoleModuleId } from "@/lib/console/module-registry";

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

const myQuotaMocks = vi.hoisted(() => ({
  getMyQuota: vi.fn(),
}));

const systemSettingsMocks = vi.hoisted(() => ({
  getSystemSettings: vi.fn(),
}));

const routingMocks = vi.hoisted(() => ({
  redirect: vi.fn(({ href, locale }: { href: string; locale: string }) => ({ href, locale })),
}));

vi.mock("@/lib/auth", () => authMocks);
vi.mock("@/actions/my-usage", () => myQuotaMocks);
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

vi.mock("@/app/[locale]/dashboard/logs/_components/usage-logs-sections", () => ({
  UsageLogsActiveSessionsSection: () => <div data-testid="usage-logs-active-sessions" />,
  UsageLogsDataSection: () => <div data-testid="usage-logs-data" />,
}));

vi.mock("@/app/[locale]/dashboard/logs/_components/active-sessions-skeleton", () => ({
  ActiveSessionsSkeleton: () => <div data-testid="active-sessions-skeleton" />,
}));

vi.mock("@/app/[locale]/dashboard/logs/_components/usage-logs-skeleton", () => ({
  UsageLogsSkeleton: () => <div data-testid="usage-logs-skeleton" />,
}));

vi.mock("@/app/[locale]/dashboard/users/users-page-client", () => ({
  UsersPageClient: () => <div data-testid="users-page-client" />,
}));

vi.mock("@/app/[locale]/dashboard/sessions/_components/active-sessions-client", () => ({
  ActiveSessionsClient: () => <div data-testid="active-sessions-client" />,
}));

vi.mock("@/app/[locale]/my-usage/_components/quota-cards", () => ({
  QuotaCards: () => <div data-testid="quota-cards" />,
}));

function makeAsyncParams(locale: string) {
  return Promise.resolve({ locale }) as Promise<{ locale: string }>;
}

function makeSearchParams() {
  return Promise.resolve({}) as Promise<Record<string, string | string[] | undefined>>;
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

const MODULE_LABELS: Record<ConsoleModuleId, string> = {
  overview: "Overview",
  traffic: "Traffic",
  providers: "Providers",
  policy: "Policy",
  system: "System",
};

describe("Traffic module page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    myQuotaMocks.getMyQuota.mockResolvedValue({
      ok: true,
      data: { dailyQuota: 100, usedQuota: 40 },
    });
    systemSettingsMocks.getSystemSettings.mockResolvedValue({
      allowGlobalUsageView: true,
      currencyDisplay: "USD",
    });
  });

  test("logs, users, sessions, my quota, and quota layout mount the shared traffic wrapper", async () => {
    vi.resetModules();
    vi.doMock("@/app/[locale]/dashboard/_components/traffic-module-page", () => ({
      TrafficModulePage: ({ activeTab, children }: { activeTab: string; children: ReactNode }) => (
        <div data-slot="traffic-module-page" data-active-tab={activeTab}>
          {children}
        </div>
      ),
    }));

    authMocks.getSession.mockResolvedValue(makeSession("admin"));

    const LogsPage = (await import("@/app/[locale]/dashboard/logs/page")).default;
    const UsersPage = (await import("@/app/[locale]/dashboard/users/page")).default;
    const SessionsPage = (await import("@/app/[locale]/dashboard/sessions/page")).default;
    const QuotasLayout = (await import("@/app/[locale]/dashboard/quotas/layout")).default;

    const logsHtml = renderToStaticMarkup(
      await LogsPage({
        params: makeAsyncParams("en"),
        searchParams: makeSearchParams(),
      })
    );
    const usersHtml = renderToStaticMarkup(await UsersPage({ params: makeAsyncParams("en") }));
    const sessionsHtml = renderToStaticMarkup(
      await SessionsPage({ params: makeAsyncParams("en") })
    );
    const quotasHtml = renderToStaticMarkup(
      await QuotasLayout({ children: <div>Quota Surface</div> })
    );

    authMocks.getSession.mockResolvedValue(makeSession("user"));
    const MyQuotaPage = (await import("@/app/[locale]/dashboard/my-quota/page")).default;
    const myQuotaHtml = renderToStaticMarkup(await MyQuotaPage({ params: makeAsyncParams("en") }));

    expect(logsHtml).toContain('data-slot="traffic-module-page"');
    expect(usersHtml).toContain('data-slot="traffic-module-page"');
    expect(sessionsHtml).toContain('data-slot="traffic-module-page"');
    expect(myQuotaHtml).toContain('data-slot="traffic-module-page"');
    expect(quotasHtml).toContain('data-slot="traffic-module-page"');

    expect(logsHtml).toContain('data-active-tab="logs"');
    expect(usersHtml).toContain('data-active-tab="users"');
    expect(sessionsHtml).toContain('data-active-tab="sessions"');
    expect(myQuotaHtml).toContain('data-active-tab="my-quota"');
    expect(quotasHtml).toContain('data-active-tab="quotas"');
    expect(quotasHtml).toContain('data-tab-id="users"');
    expect(quotasHtml).toContain('data-tab-id="providers"');

    vi.doUnmock("@/app/[locale]/dashboard/_components/traffic-module-page");
  });

  test("renders traffic tabs for admins and keeps quota routes inside the same frame", async () => {
    const { TrafficModulePage } = await import(
      "@/app/[locale]/dashboard/_components/traffic-module-page"
    );

    const html = renderToStaticMarkup(
      await TrafficModulePage({
        role: "admin",
        activeTab: "sessions",
        title: "Sessions",
        description: "Sessions body",
        children: <div>Traffic body</div>,
      })
    );

    expect(html).toContain('data-tab-id="logs"');
    expect(html).toContain('data-tab-id="users"');
    expect(html).toContain('data-tab-id="sessions"');
    expect(html).toContain('data-tab-id="quotas"');
    expect(html).not.toContain('data-tab-id="my-quota"');
    expect(html).toContain('data-tab-id="sessions" data-active="true"');
  });

  test("hides admin-only traffic tabs for non-admin traffic shells", async () => {
    const { TrafficModulePage } = await import(
      "@/app/[locale]/dashboard/_components/traffic-module-page"
    );

    const html = renderToStaticMarkup(
      await TrafficModulePage({
        role: "user",
        activeTab: "my-quota",
        title: "Quota",
        description: "Quota body",
        children: <div>Traffic body</div>,
      })
    );

    expect(html).toContain('data-tab-id="logs"');
    expect(html).toContain('data-tab-id="users"');
    expect(html).toContain('data-tab-id="my-quota"');
    expect(html).not.toContain('data-tab-id="sessions"');
    expect(html).not.toContain('data-tab-id="quotas"');
  });

  test("keeps session message detail routes full bleed inside the console shell", () => {
    const activeRoute = resolveConsoleRoute("/dashboard/sessions/session-123/messages");

    const html = renderToStaticMarkup(
      <ConsoleShell role="admin" activeRoute={activeRoute} moduleLabels={MODULE_LABELS}>
        <div>Session Messages</div>
      </ConsoleShell>
    );

    expect(html).toContain('data-stage-mode="full-bleed"');
  });
});
