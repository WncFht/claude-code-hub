/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const routingMocks = vi.hoisted(() => ({
  redirect: vi.fn(({ href, locale }: { href: string; locale: string }) => ({ href, locale })),
}));

const systemConfigRepositoryMocks = vi.hoisted(() => ({
  getSystemSettings: vi.fn(),
}));

const notificationsHooksMocks = vi.hoisted(() => ({
  useNotificationsPageData: vi.fn(),
}));

vi.mock("@/repository/system-config", () => systemConfigRepositoryMocks);

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

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock("@/app/[locale]/settings/config/_components/auto-cleanup-form", () => ({
  AutoCleanupForm: () => <div data-testid="auto-cleanup-form" />,
}));

vi.mock("@/app/[locale]/settings/config/_components/settings-config-skeleton", () => ({
  SettingsConfigSkeleton: () => <div data-testid="settings-config-skeleton" />,
}));

vi.mock("@/app/[locale]/settings/config/_components/system-settings-form", () => ({
  SystemSettingsForm: () => <div data-testid="system-settings-form" />,
}));

vi.mock("@/app/[locale]/settings/data/_components/database-export", () => ({
  DatabaseExport: () => <div data-testid="database-export" />,
}));

vi.mock("@/app/[locale]/settings/data/_components/database-import", () => ({
  DatabaseImport: () => <div data-testid="database-import" />,
}));

vi.mock("@/app/[locale]/settings/data/_components/database-status", () => ({
  DatabaseStatusDisplay: () => <div data-testid="database-status-display" />,
}));

vi.mock("@/app/[locale]/settings/data/_components/log-cleanup-panel", () => ({
  LogCleanupPanel: () => <div data-testid="log-cleanup-panel" />,
}));

vi.mock("@/app/[locale]/settings/notifications/_components/global-settings-card", () => ({
  GlobalSettingsCard: () => <div data-testid="global-settings-card" />,
}));

vi.mock("@/app/[locale]/settings/notifications/_components/notification-type-card", () => ({
  NotificationTypeCard: () => <div data-testid="notification-type-card" />,
}));

vi.mock("@/app/[locale]/settings/notifications/_components/notifications-skeleton", () => ({
  NotificationsSkeleton: () => <div data-testid="notifications-skeleton" />,
}));

vi.mock("@/app/[locale]/settings/notifications/_components/webhook-targets-section", () => ({
  WebhookTargetsSection: () => <div data-testid="webhook-targets-section" />,
}));

vi.mock("@/app/[locale]/settings/notifications/_lib/hooks", () => ({
  NOTIFICATION_TYPES: ["circuit_breaker", "daily_leaderboard"],
  useNotificationsPageData: notificationsHooksMocks.useNotificationsPageData,
}));

vi.mock("@/app/[locale]/settings/logs/_components/log-level-form", () => ({
  LogLevelForm: () => <div data-testid="log-level-form" />,
}));

function makeAsyncParams(locale: string) {
  return Promise.resolve({ locale }) as Promise<{ locale: string }>;
}

function makeNotificationsState({
  isLoading = false,
  settings = { enabled: true },
  loadError = null,
}: {
  isLoading?: boolean;
  settings?: Record<string, unknown> | null;
  loadError?: string | null;
} = {}) {
  return {
    settings,
    targets: [],
    bindingsByType: {
      circuit_breaker: [],
      daily_leaderboard: [],
    },
    isLoading,
    loadError,
    updateSettings: vi.fn(),
    saveBindings: vi.fn(),
    createTarget: vi.fn(),
    updateTarget: vi.fn(),
    deleteTarget: vi.fn(),
    testTarget: vi.fn(),
  };
}

describe("System module page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    systemConfigRepositoryMocks.getSystemSettings.mockResolvedValue({
      siteTitle: "Claude Code Hub",
      allowGlobalUsageView: true,
      currencyDisplay: "USD",
      billingModelSource: "system",
      timezone: "UTC",
      verboseProviderError: false,
      enableHttp2: true,
      interceptAnthropicWarmupRequests: true,
      enableThinkingSignatureRectifier: true,
      enableThinkingBudgetRectifier: true,
      enableBillingHeaderRectifier: true,
      enableResponseInputRectifier: true,
      enableCodexSessionIdCompletion: true,
      enableClaudeMetadataUserIdInjection: true,
      enableResponseFixer: true,
      responseFixerConfig: null,
      quotaDbRefreshIntervalSeconds: 30,
      quotaLeasePercent5h: 10,
      quotaLeasePercentDaily: 10,
      quotaLeasePercentWeekly: 10,
      quotaLeasePercentMonthly: 10,
      quotaLeaseCapUsd: 10,
    });
    notificationsHooksMocks.useNotificationsPageData.mockReturnValue(makeNotificationsState());
  });

  test("config, data, notifications, and logs share the system wrapper", async () => {
    vi.resetModules();
    vi.doMock("@/app/[locale]/settings/_components/system-module-page", () => ({
      SystemModulePage: ({ activeTab, children }: { activeTab: string; children: ReactNode }) => (
        <div data-slot="system-module-page" data-active-tab={activeTab}>
          {children}
        </div>
      ),
    }));

    const SettingsConfigPage = (await import("@/app/[locale]/settings/config/page")).default;
    const SettingsDataPage = (await import("@/app/[locale]/settings/data/page")).default;
    const NotificationsPage = (await import("@/app/[locale]/settings/notifications/page")).default;
    const SettingsLogsPage = (await import("@/app/[locale]/settings/logs/page")).default;

    const configHtml = renderToStaticMarkup(await SettingsConfigPage());
    const dataHtml = renderToStaticMarkup(<SettingsDataPage />);
    const notificationsHtml = renderToStaticMarkup(<NotificationsPage />);
    const logsHtml = renderToStaticMarkup(await SettingsLogsPage());

    expect(configHtml).toContain('data-slot="system-module-page"');
    expect(dataHtml).toContain('data-slot="system-module-page"');
    expect(notificationsHtml).toContain('data-slot="system-module-page"');
    expect(logsHtml).toContain('data-slot="system-module-page"');

    expect(configHtml).toContain('data-active-tab="config"');
    expect(dataHtml).toContain('data-active-tab="data"');
    expect(notificationsHtml).toContain('data-active-tab="notifications"');
    expect(logsHtml).toContain('data-active-tab="logs"');

    expect(configHtml).not.toContain('data-slot="settings-page-header"');
    expect(dataHtml).not.toContain('data-slot="settings-page-header"');
    expect(notificationsHtml).not.toContain('data-slot="settings-page-header"');
    expect(logsHtml).not.toContain('data-slot="settings-page-header"');

    vi.doUnmock("@/app/[locale]/settings/_components/system-module-page");
  });

  test("notifications loading state stays inside the shared system wrapper", async () => {
    vi.resetModules();
    vi.doMock("@/app/[locale]/settings/_components/system-module-page", () => ({
      SystemModulePage: ({ activeTab, children }: { activeTab: string; children: ReactNode }) => (
        <div data-slot="system-module-page" data-active-tab={activeTab}>
          {children}
        </div>
      ),
    }));

    notificationsHooksMocks.useNotificationsPageData.mockReturnValue(
      makeNotificationsState({ isLoading: true, settings: null })
    );

    const NotificationsPage = (await import("@/app/[locale]/settings/notifications/page")).default;
    const notificationsHtml = renderToStaticMarkup(<NotificationsPage />);

    expect(notificationsHtml).toContain('data-slot="system-module-page"');
    expect(notificationsHtml).toContain('data-active-tab="notifications"');
    expect(notificationsHtml).toContain('data-testid="notifications-skeleton"');

    vi.doUnmock("@/app/[locale]/settings/_components/system-module-page");
  });

  test("renders shared system tabs and module copy", async () => {
    const { SystemModulePage } = await import(
      "@/app/[locale]/settings/_components/system-module-page"
    );

    const html = renderToStaticMarkup(
      <SystemModulePage role="admin" activeTab="notifications">
        <div>System body</div>
      </SystemModulePage>
    );

    expect(html).toContain("system.eyebrow");
    expect(html).toContain("system.title");
    expect(html).toContain("system.description");
    expect(html).toContain('data-tab-id="config"');
    expect(html).toContain('data-tab-id="data"');
    expect(html).toContain('data-tab-id="notifications"');
    expect(html).toContain('data-tab-id="logs"');
    expect(html).toContain('data-tab-id="notifications" data-active="true"');
    expect(html).toContain("nav.config");
    expect(html).toContain("nav.data");
    expect(html).toContain("nav.notifications");
    expect(html).toContain("nav.logs");
  });

  test("hides system tabs for non-admin shells", async () => {
    const { SystemModulePage } = await import(
      "@/app/[locale]/settings/_components/system-module-page"
    );

    const html = renderToStaticMarkup(
      <SystemModulePage role="user" activeTab="notifications">
        <div>System body</div>
      </SystemModulePage>
    );

    expect(html).not.toContain('data-tab-id="config"');
    expect(html).not.toContain('data-tab-id="data"');
    expect(html).not.toContain('data-tab-id="notifications"');
    expect(html).not.toContain('data-tab-id="logs"');
  });

  test("settings index redirects to the system default route", async () => {
    const SettingsIndex = (await import("@/app/[locale]/settings/page")).default;

    await SettingsIndex({ params: makeAsyncParams("en") });

    expect(routingMocks.redirect).toHaveBeenCalledWith({
      href: "/settings/config",
      locale: "en",
    });
  });
});
