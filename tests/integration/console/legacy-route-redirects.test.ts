/**
 * @vitest-environment happy-dom
 */

import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

const routingMocks = vi.hoisted(() => ({
  redirect: vi.fn(({ href, locale }: { href: string; locale: string }) => ({ href, locale })),
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
  }) => createElement("a", { href, ...rest }, children),
  redirect: routingMocks.redirect,
}));

vi.mock("next-intl/server", () => intlServerMocks);

vi.mock("@/components/section", () => ({
  Section: ({ children }: { children: ReactNode }) => createElement("section", null, children),
}));

vi.mock("@/app/[locale]/dashboard/_components/traffic-module-page", () => ({
  TrafficModulePage: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
}));

vi.mock("@/app/[locale]/settings/_components/system-module-page", () => ({
  SystemModulePage: ({ children }: { children: ReactNode }) => createElement("div", null, children),
}));

vi.mock("@/app/[locale]/settings/_components/policy-module-page", () => ({
  PolicyModulePage: ({ children }: { children: ReactNode }) => createElement("div", null, children),
}));

vi.mock("@/app/[locale]/dashboard/users/users-page-client", () => ({
  UsersPageClient: () => createElement("div", { "data-slot": "users-page-client" }),
}));

vi.mock("@/app/[locale]/dashboard/sessions/_components/active-sessions-client", () => ({
  ActiveSessionsClient: () => createElement("div", { "data-slot": "active-sessions-client" }),
}));

vi.mock(
  "@/app/[locale]/dashboard/sessions/[sessionId]/messages/_components/session-messages-client",
  () => ({
    SessionMessagesClient: () => createElement("div", { "data-slot": "session-messages-client" }),
  })
);

vi.mock("@/app/[locale]/dashboard/quotas/providers/_components/providers-quota-manager", () => ({
  ProvidersQuotaManager: () => createElement("div", { "data-slot": "providers-quota-manager" }),
}));

vi.mock("@/app/[locale]/dashboard/quotas/_components/providers-quota-skeleton", () => ({
  ProvidersQuotaSkeleton: () => createElement("div", { "data-slot": "providers-quota-skeleton" }),
}));

vi.mock("@/app/[locale]/dashboard/rate-limits/_components/rate-limit-dashboard", () => ({
  RateLimitDashboard: () => createElement("div", { "data-slot": "rate-limit-dashboard" }),
}));

vi.mock("@/app/[locale]/dashboard/rate-limits/_components/rate-limits-skeleton", () => ({
  RateLimitsContentSkeleton: () =>
    createElement("div", { "data-slot": "rate-limits-content-skeleton" }),
}));

vi.mock("@/app/[locale]/dashboard/leaderboard/user/[userId]/_components/user-insights-view", () => ({
  UserInsightsView: () => createElement("div", { "data-slot": "user-insights-view" }),
}));

vi.mock("@/repository/user", () => ({
  findUserById: vi.fn(async () => ({
    id: 7,
    name: "Operator",
  })),
}));

vi.mock("@/app/[locale]/settings/config/_components/system-settings-form", () => ({
  SystemSettingsForm: () => createElement("form", { "data-slot": "system-settings-form" }),
}));

vi.mock("@/app/[locale]/settings/config/_components/auto-cleanup-form", () => ({
  AutoCleanupForm: () => createElement("div", { "data-slot": "auto-cleanup-form" }),
}));

vi.mock("@/app/[locale]/settings/config/_components/settings-config-skeleton", () => ({
  SettingsConfigSkeleton: () => createElement("div", { "data-slot": "settings-config-skeleton" }),
}));

vi.mock("@/app/[locale]/settings/client-versions/_components/client-version-toggle", () => ({
  ClientVersionToggle: () => createElement("div", { "data-slot": "client-version-toggle" }),
}));

vi.mock("@/app/[locale]/settings/client-versions/_components/client-version-stats-table", () => ({
  ClientVersionStatsTable: () =>
    createElement("div", { "data-slot": "client-version-stats-table" }),
}));

vi.mock("@/app/[locale]/settings/client-versions/_components/client-versions-skeleton", () => ({
  ClientVersionsSettingsSkeleton: () =>
    createElement("div", { "data-slot": "client-version-settings-skeleton" }),
  ClientVersionsTableSkeleton: () =>
    createElement("div", { "data-slot": "client-version-table-skeleton" }),
}));

vi.mock("@/app/[locale]/settings/_components/ui/settings-ui", () => ({
  SettingsSection: ({ children }: { children: ReactNode }) =>
    createElement("section", null, children),
}));

vi.mock("@/actions/providers", () => ({
  getProviders: vi.fn(async () => []),
  getProviderLimitUsageBatch: vi.fn(async () => new Map()),
}));

vi.mock("@/repository/system-config", () => ({
  getSystemSettings: vi.fn(async () => ({
    siteTitle: "Claude Code Hub",
    allowGlobalUsageView: false,
    currencyDisplay: "USD",
    billingModelSource: "original",
    timezone: "UTC",
    verboseProviderError: false,
    enableHttp2: false,
    interceptAnthropicWarmupRequests: false,
    enableThinkingSignatureRectifier: true,
    enableThinkingBudgetRectifier: true,
    enableBillingHeaderRectifier: true,
    enableResponseInputRectifier: true,
    enableCodexSessionIdCompletion: true,
    enableClaudeMetadataUserIdInjection: true,
    enableResponseFixer: true,
    responseFixerConfig: {
      fixTruncatedJson: true,
      fixSseFormat: true,
      fixEncoding: true,
      maxJsonDepth: 200,
      maxFixSize: 1024,
    },
    quotaDbRefreshIntervalSeconds: 10,
    quotaLeasePercent5h: 0.05,
    quotaLeasePercentDaily: 0.05,
    quotaLeasePercentWeekly: 0.05,
    quotaLeasePercentMonthly: 0.05,
    quotaLeaseCapUsd: null,
    enableAutoCleanup: false,
    cleanupRetentionDays: 30,
    cleanupSchedule: "0 2 * * *",
    cleanupBatchSize: 10000,
  })),
}));

vi.mock("@/actions/system-config", () => ({
  fetchSystemSettings: vi.fn(async () => ({
    ok: true,
    data: {
      enableClientVersionCheck: true,
    },
  })),
}));

vi.mock("@/actions/client-versions", () => ({
  fetchClientVersionStats: vi.fn(async () => ({
    ok: true,
    data: [],
  })),
}));

function makeAsyncParams<T extends Record<string, string>>(params: T) {
  return Promise.resolve(params) as Promise<T>;
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

describe("legacy console route redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("redirects legacy dashboard and settings pages to matching /console routes while preserving locale", async () => {
    authMocks.getSession.mockResolvedValue(makeSession({ role: "admin" }));

    const DashboardUsersPage = (await import("@/app/[locale]/dashboard/users/page")).default;
    await DashboardUsersPage({
      params: makeAsyncParams({ locale: "zh-CN" }),
    });

    const SettingsConfigPage = (await import("@/app/[locale]/settings/config/page")).default;
    await SettingsConfigPage({
      params: makeAsyncParams({ locale: "zh-CN" }),
    });

    expect(routingMocks.redirect).toHaveBeenNthCalledWith(1, {
      href: "/console/traffic/users",
      locale: "zh-CN",
    });
    expect(routingMocks.redirect).toHaveBeenNthCalledWith(2, {
      href: "/console/system/config",
      locale: "zh-CN",
    });
  });

  test("preserves session and quota subview params when normalizing legacy routes", async () => {
    authMocks.getSession.mockResolvedValue(makeSession({ role: "admin" }));

    const SessionMessagesPage = (
      await import("@/app/[locale]/dashboard/sessions/[sessionId]/messages/page")
    ).default;
    await SessionMessagesPage({
      params: makeAsyncParams({ locale: "en", sessionId: "session-42" }),
    });

    const ProvidersQuotaPage = (await import("@/app/[locale]/dashboard/quotas/providers/page"))
      .default;
    await ProvidersQuotaPage({
      params: makeAsyncParams({ locale: "en" }),
    });

    expect(routingMocks.redirect).toHaveBeenNthCalledWith(1, {
      href: "/console/traffic/sessions/session-42/messages",
      locale: "en",
    });
    expect(routingMocks.redirect).toHaveBeenNthCalledWith(2, {
      href: "/console/traffic/quotas/providers",
      locale: "en",
    });
  });

  test("redirects the remaining dashboard detail and diagnostic pages into console deep links", async () => {
    authMocks.getSession.mockResolvedValue(makeSession({ role: "admin" }));

    const UserInsightsPage = (await import("@/app/[locale]/dashboard/leaderboard/user/[userId]/page"))
      .default;
    await UserInsightsPage({
      params: makeAsyncParams({ locale: "en", userId: "7" }),
    });

    const RateLimitsPage = (await import("@/app/[locale]/dashboard/rate-limits/page")).default;
    await RateLimitsPage({
      params: makeAsyncParams({ locale: "en" }),
    });

    const KeysQuotaPage = (await import("@/app/[locale]/dashboard/quotas/keys/page")).default;
    await KeysQuotaPage({
      params: makeAsyncParams({ locale: "en" }),
    });

    expect(routingMocks.redirect).toHaveBeenNthCalledWith(1, {
      href: "/console/overview/leaderboard/users/7",
      locale: "en",
    });
    expect(routingMocks.redirect).toHaveBeenNthCalledWith(2, {
      href: "/console/traffic/rate-limits",
      locale: "en",
    });
    expect(routingMocks.redirect).toHaveBeenNthCalledWith(3, {
      href: "/console/traffic/quotas/keys",
      locale: "en",
    });
  });

  test("normalizes forbidden roles to the correct console outcome", async () => {
    authMocks.getSession.mockResolvedValue(makeSession({ role: "user", canLoginWebUi: true }));

    const ClientVersionsPage = (await import("@/app/[locale]/settings/client-versions/page"))
      .default;
    await ClientVersionsPage({
      params: makeAsyncParams({ locale: "en" }),
    });

    expect(routingMocks.redirect).toHaveBeenCalledWith({
      href: "/console/overview",
      locale: "en",
    });
  });

  test("sends unauthenticated legacy requests to login using the console destination", async () => {
    authMocks.getSession.mockResolvedValue(null);

    const DashboardSessionsPage = (await import("@/app/[locale]/dashboard/sessions/page")).default;
    await DashboardSessionsPage({
      params: makeAsyncParams({ locale: "en" }),
    });

    expect(routingMocks.redirect).toHaveBeenCalledWith({
      href: "/login?from=/console/traffic/sessions",
      locale: "en",
    });
  });
});
