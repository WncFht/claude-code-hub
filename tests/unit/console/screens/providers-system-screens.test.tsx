/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { buildConsoleBootstrap } from "@/lib/console/console-bootstrap";

const routingState = vi.hoisted(() => ({
  pathname: "/console/overview",
}));

function createStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

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
  usePathname: () => routingState.pathname,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/section", () => ({
  Section: ({
    title,
    actions,
    children,
    ...rest
  }: {
    title?: string;
    actions?: ReactNode;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <section data-slot="section" data-title={title} {...rest}>
      {actions}
      {children}
    </section>
  ),
}));

vi.mock("@/app/[locale]/settings/providers/_components/provider-manager-loader", () => ({
  ProviderManagerLoader: ({
    viewMode,
    sortBy,
    onViewModeChange,
    onSortByChange,
  }: {
    viewMode: "list" | "vendor";
    sortBy: string;
    onViewModeChange?: (value: "list" | "vendor") => void;
    onSortByChange?: (value: string) => void;
  }) => (
    <div data-slot="provider-manager-loader" data-view-mode={viewMode} data-sort-by={sortBy}>
      <button
        type="button"
        data-action="set-provider-view-vendor"
        onClick={() => onViewModeChange?.("vendor")}
      >
        Vendor
      </button>
      <button
        type="button"
        data-action="set-provider-sort-name"
        onClick={() => onSortByChange?.("name")}
      >
        Name
      </button>
    </div>
  ),
}));

vi.mock("@/app/[locale]/settings/prices/_components/model-price-drawer", () => ({
  ModelPriceDrawer: () => <div data-slot="model-price-drawer" />,
}));

vi.mock("@/app/[locale]/settings/prices/_components/sync-litellm-button", () => ({
  SyncLiteLLMButton: () => <div data-slot="sync-litellm-button" />,
}));

vi.mock("@/app/[locale]/settings/prices/_components/upload-price-dialog", () => ({
  UploadPriceDialog: () => <div data-slot="upload-price-dialog" />,
}));

vi.mock("@/app/[locale]/settings/prices/_components/prices-skeleton", () => ({
  PricesSkeleton: () => <div data-slot="prices-skeleton" />,
}));

vi.mock("@/app/[locale]/settings/prices/_components/price-list", () => ({
  PriceList: ({
    initialTotal,
    initialPage,
    initialPageSize,
  }: {
    initialTotal: number;
    initialPage: number;
    initialPageSize: number;
  }) => (
    <div
      data-slot="price-list"
      data-total={String(initialTotal)}
      data-page={String(initialPage)}
      data-page-size={String(initialPageSize)}
    />
  ),
}));

vi.mock("@/app/[locale]/settings/config/_components/system-settings-form", () => ({
  SystemSettingsForm: ({
    formId,
    hideSubmitButton,
  }: {
    formId?: string;
    hideSubmitButton?: boolean;
  }) => (
    <form
      data-slot="system-settings-form"
      data-form-id={formId}
      data-hide-submit={hideSubmitButton ? "true" : "false"}
    />
  ),
}));

vi.mock("@/app/[locale]/settings/config/_components/auto-cleanup-form", () => ({
  AutoCleanupForm: () => <div data-slot="auto-cleanup-form" />,
}));

vi.mock("@/app/[locale]/settings/config/_components/settings-config-skeleton", () => ({
  SettingsConfigSkeleton: () => <div data-slot="settings-config-skeleton" />,
}));

vi.mock("@/app/[locale]/settings/data/_components/database-status", () => ({
  DatabaseStatusDisplay: () => <div data-slot="database-status-display" />,
}));

vi.mock("@/app/[locale]/settings/data/_components/log-cleanup-panel", () => ({
  LogCleanupPanel: () => <div data-slot="log-cleanup-panel" />,
}));

vi.mock("@/app/[locale]/settings/data/_components/database-export", () => ({
  DatabaseExport: () => <div data-slot="database-export" />,
}));

vi.mock("@/app/[locale]/settings/data/_components/database-import", () => ({
  DatabaseImport: () => <div data-slot="database-import" />,
}));

vi.mock("@/app/[locale]/settings/notifications/_components/global-settings-card", () => ({
  GlobalSettingsCard: () => <div data-slot="global-settings-card" />,
}));

vi.mock("@/app/[locale]/settings/notifications/_components/webhook-targets-section", () => ({
  WebhookTargetsSection: () => <div data-slot="webhook-targets-section" />,
}));

vi.mock("@/app/[locale]/settings/notifications/_components/notification-type-card", () => ({
  NotificationTypeCard: ({ type }: { type: string }) => (
    <div data-slot="notification-type-card" data-type={type} />
  ),
}));

vi.mock("@/app/[locale]/settings/notifications/_components/notifications-skeleton", () => ({
  NotificationsSkeleton: () => <div data-slot="notifications-skeleton" />,
}));

vi.mock("@/app/[locale]/settings/notifications/_lib/hooks", () => ({
  NOTIFICATION_TYPES: ["circuit_breaker", "daily_leaderboard"],
  useNotificationsPageData: () => ({
    settings: {
      enabled: true,
    },
    targets: [],
    bindingsByType: {
      circuit_breaker: [],
      daily_leaderboard: [],
    },
    isLoading: false,
    loadError: null,
    updateSettings: vi.fn(async () => ({ ok: true })),
    saveBindings: vi.fn(async () => ({ ok: true })),
    createTarget: vi.fn(async () => ({ ok: true })),
    updateTarget: vi.fn(async () => ({ ok: true })),
    deleteTarget: vi.fn(async () => ({ ok: true })),
    testTarget: vi.fn(async () => ({ ok: true })),
  }),
}));

vi.mock("@/app/[locale]/settings/logs/_components/log-level-form", () => ({
  LogLevelForm: () => <div data-slot="log-level-form" />,
}));

function makeBootstrap(pathname: string) {
  return buildConsoleBootstrap({
    locale: "en",
    pathname,
    role: "admin",
  });
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function flushAll() {
  await flushPromises();
  await flushPromises();
}

async function waitForSelector(container: HTMLElement, selector: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (container.querySelector(selector)) {
      return;
    }

    await act(async () => {
      await flushAll();
    });
  }

  throw new Error(`Timed out waiting for selector: ${selector}`);
}

async function render(node: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const queryClient = createQueryClient();

  const wrapped = (currentNode: ReactNode) => (
    <QueryClientProvider client={queryClient}>{currentNode}</QueryClientProvider>
  );

  await act(async () => {
    root.render(wrapped(node));
    await flushAll();
  });

  return {
    container,
    rerender: async (nextNode: ReactNode) => {
      await act(async () => {
        root.render(wrapped(nextNode));
        await flushAll();
      });
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
        await flushAll();
      });
      queryClient.clear();
      container.remove();
    },
  };
}

describe("providers and system console screens", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    routingState.pathname = "/console/overview";
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock(),
    });

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/system-settings")) {
        return {
          ok: true,
          json: async () => ({
            siteTitle: "Claude Code Hub",
            allowGlobalUsageView: false,
            currencyDisplay: "USD",
            billingModelSource: "original",
            timezone: "UTC",
            verboseProviderError: false,
            enableHttp2: false,
            interceptAnthropicWarmupRequests: false,
            enableThinkingSignatureRectifier: true,
            enableBillingHeaderRectifier: true,
            enableResponseInputRectifier: true,
            enableThinkingBudgetRectifier: true,
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
          }),
        } as Response;
      }

      if (url.includes("/api/prices")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              data: [],
              total: 0,
              page: 1,
              pageSize: 50,
            },
          }),
        } as Response;
      }

      throw new Error(`Unhandled fetch in test: ${url}`);
    }) as typeof fetch;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    globalThis.fetch = originalFetch;
  });

  test("persists provider inventory view and sort preferences across runtime screen switches", async () => {
    routingState.pathname = "/console/providers/inventory";
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(
      <ConsoleApp bootstrap={makeBootstrap("/console/providers/inventory")} />
    );
    await waitForSelector(view.container, '[data-slot="providers-inventory-screen"]');
    await waitForSelector(view.container, '[data-slot="provider-manager-loader"]');

    expect(view.container.querySelector('[data-slot="providers-inventory-screen"]')).not.toBeNull();
    expect(
      view.container
        .querySelector('[data-slot="provider-manager-loader"]')
        ?.getAttribute("data-view-mode")
    ).toBe("list");
    expect(
      view.container
        .querySelector('[data-slot="provider-manager-loader"]')
        ?.getAttribute("data-sort-by")
    ).toBe("priority");

    await act(async () => {
      view.container
        .querySelector('[data-action="set-provider-view-vendor"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      view.container
        .querySelector('[data-action="set-provider-sort-name"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushAll();
    });
    await waitForSelector(view.container, '[data-slot="provider-manager-loader"]');

    expect(
      view.container
        .querySelector('[data-slot="provider-manager-loader"]')
        ?.getAttribute("data-view-mode")
    ).toBe("vendor");
    expect(
      view.container
        .querySelector('[data-slot="provider-manager-loader"]')
        ?.getAttribute("data-sort-by")
    ).toBe("name");

    routingState.pathname = "/console/system/config";
    await view.rerender(<ConsoleApp bootstrap={makeBootstrap("/console/system/config")} />);
    await waitForSelector(view.container, '[data-slot="system-config-screen"]');
    expect(view.container.querySelector('[data-slot="system-config-screen"]')).not.toBeNull();

    routingState.pathname = "/console/providers/inventory";
    await view.rerender(<ConsoleApp bootstrap={makeBootstrap("/console/providers/inventory")} />);
    await waitForSelector(view.container, '[data-slot="providers-inventory-screen"]');
    await waitForSelector(view.container, '[data-slot="provider-manager-loader"]');

    expect(
      view.container
        .querySelector('[data-slot="provider-manager-loader"]')
        ?.getAttribute("data-view-mode")
    ).toBe("vendor");
    expect(
      view.container
        .querySelector('[data-slot="provider-manager-loader"]')
        ?.getAttribute("data-sort-by")
    ).toBe("name");

    await view.unmount();
  });

  test("loads pricing and config screen adapters through the runtime registry", async () => {
    routingState.pathname = "/console/providers/pricing";
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(
      <ConsoleApp bootstrap={makeBootstrap("/console/providers/pricing")} />
    );
    await waitForSelector(view.container, '[data-slot="providers-pricing-screen"]');
    await waitForSelector(view.container, '[data-slot="price-list"]');

    expect(view.container.querySelector('[data-slot="providers-pricing-screen"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="model-price-drawer"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="sync-litellm-button"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="upload-price-dialog"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="price-list"]')).not.toBeNull();

    routingState.pathname = "/console/system/config";
    await view.rerender(<ConsoleApp bootstrap={makeBootstrap("/console/system/config")} />);
    await waitForSelector(view.container, '[data-slot="system-config-screen"]');
    await waitForSelector(view.container, '[data-slot="system-settings-form"]');
    await waitForSelector(view.container, '[data-slot="console-toolbar-content"]');

    expect(view.container.querySelector('[data-slot="system-config-screen"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="system-settings-form"]')).not.toBeNull();
    expect(
      view.container
        .querySelector('[data-slot="system-settings-form"]')
        ?.getAttribute("data-form-id")
    ).toBe("console-system-config-form");
    expect(
      view.container
        .querySelector('[data-slot="system-settings-form"]')
        ?.getAttribute("data-hide-submit")
    ).toBe("true");
    expect(view.container.querySelector('[data-slot="console-toolbar-content"]')).not.toBeNull();
    expect(
      view.container.querySelector('[data-action="system-config-submit"]')?.getAttribute("form")
    ).toBe("console-system-config-form");

    await view.unmount();
  });

  test("loads system data, notifications, and logs adapters through the runtime registry", async () => {
    routingState.pathname = "/console/system/data";
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(<ConsoleApp bootstrap={makeBootstrap("/console/system/data")} />);
    await waitForSelector(view.container, '[data-slot="system-data-screen"]');

    expect(view.container.querySelector('[data-slot="system-data-screen"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="database-status-display"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="log-cleanup-panel"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="database-export"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="database-import"]')).not.toBeNull();

    routingState.pathname = "/console/system/notifications";
    await view.rerender(<ConsoleApp bootstrap={makeBootstrap("/console/system/notifications")} />);
    await waitForSelector(view.container, '[data-slot="system-notifications-screen"]');

    expect(
      view.container.querySelector('[data-slot="system-notifications-screen"]')
    ).not.toBeNull();
    expect(view.container.querySelector('[data-slot="global-settings-card"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="webhook-targets-section"]')).not.toBeNull();
    expect(view.container.querySelectorAll('[data-slot="notification-type-card"]').length).toBe(2);

    routingState.pathname = "/console/system/logs";
    await view.rerender(<ConsoleApp bootstrap={makeBootstrap("/console/system/logs")} />);
    await waitForSelector(view.container, '[data-slot="system-logs-screen"]');

    expect(view.container.querySelector('[data-slot="system-logs-screen"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="log-level-form"]')).not.toBeNull();

    await view.unmount();
  });
});
