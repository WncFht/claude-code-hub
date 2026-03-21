/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getConsoleBootstrap } from "@/app/[locale]/console/_lib/get-console-bootstrap";
import { buildConsoleBootstrap } from "@/lib/console/console-bootstrap";

const routingState = vi.hoisted(() => ({
  pathname: "/console/overview",
}));

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
  useTimeZone: () => "UTC",
}));

vi.mock("@/components/section", () => ({
  Section: ({
    title,
    description,
    actions,
    children,
    icon: _icon,
    iconColor: _iconColor,
    variant: _variant,
    ...rest
  }: {
    title?: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    icon?: string;
    iconColor?: string;
    variant?: string;
    [key: string]: unknown;
  }) => (
    <section data-slot="section" data-title={title} data-description={description} {...rest}>
      {actions}
      {children}
    </section>
  ),
}));

vi.mock("@/app/[locale]/settings/_components/ui/settings-ui", () => ({
  SettingsSection: ({
    title,
    description,
    actions,
    children,
    icon: _icon,
    iconColor: _iconColor,
    ...rest
  }: {
    title?: string;
    description?: string;
    actions?: ReactNode;
    children: ReactNode;
    icon?: string;
    iconColor?: string;
    [key: string]: unknown;
  }) => (
    <section
      data-slot="settings-section"
      data-title={title}
      data-description={description}
      {...rest}
    >
      {actions}
      {children}
    </section>
  ),
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: () => <div data-slot="skeleton" />,
}));

vi.mock("@/app/[locale]/settings/sensitive-words/_components/add-word-dialog", () => ({
  AddWordDialog: () => <button type="button" data-slot="add-word-dialog" />,
}));

vi.mock("@/app/[locale]/settings/sensitive-words/_components/refresh-cache-button", () => ({
  RefreshCacheButton: ({ stats }: { stats: { totalCount: number } | null }) => (
    <button
      type="button"
      data-slot="sensitive-words-refresh-button"
      data-count={stats ? String(stats.totalCount) : "0"}
    />
  ),
}));

vi.mock("@/app/[locale]/settings/sensitive-words/_components/sensitive-words-skeleton", () => ({
  SensitiveWordsTableSkeleton: () => <div data-slot="sensitive-words-skeleton" />,
}));

vi.mock("@/app/[locale]/settings/sensitive-words/_components/word-list-table", () => ({
  WordListTable: ({ words }: { words: Array<{ id: number }> }) => (
    <div data-slot="word-list-table" data-count={String(words.length)} />
  ),
}));

vi.mock("@/app/[locale]/settings/error-rules/_components/add-rule-dialog", () => ({
  AddRuleDialog: () => <button type="button" data-slot="add-rule-dialog" />,
}));

vi.mock("@/app/[locale]/settings/error-rules/_components/refresh-cache-button", () => ({
  RefreshCacheButton: ({ stats }: { stats: { totalCount: number } | null }) => (
    <button
      type="button"
      data-slot="error-rules-refresh-button"
      data-count={stats ? String(stats.totalCount) : "0"}
    />
  ),
}));

vi.mock("@/app/[locale]/settings/error-rules/_components/error-rule-tester", () => ({
  ErrorRuleTester: () => <div data-slot="error-rule-tester" />,
}));

vi.mock("@/app/[locale]/settings/error-rules/_components/error-rules-skeleton", () => ({
  ErrorRulesTableSkeleton: () => <div data-slot="error-rules-skeleton" />,
}));

vi.mock("@/app/[locale]/settings/error-rules/_components/rule-list-table", () => ({
  RuleListTable: ({ rules }: { rules: Array<{ id: number }> }) => (
    <div data-slot="rule-list-table" data-count={String(rules.length)} />
  ),
}));

vi.mock("@/app/[locale]/settings/request-filters/_components/request-filters-skeleton", () => ({
  RequestFiltersTableSkeleton: () => <div data-slot="request-filters-skeleton" />,
}));

vi.mock("@/app/[locale]/settings/request-filters/_components/filter-table", () => ({
  FilterTable: ({
    filters,
    providers,
  }: {
    filters: Array<{ id: number }>;
    providers: Array<{ id: number }>;
  }) => (
    <div
      data-slot="filter-table"
      data-filter-count={String(filters.length)}
      data-provider-count={String(providers.length)}
    />
  ),
}));

vi.mock("@/app/[locale]/settings/client-versions/_components/client-version-toggle", () => ({
  ClientVersionToggle: ({ enabled }: { enabled: boolean }) => (
    <div data-slot="client-version-toggle" data-enabled={enabled ? "true" : "false"} />
  ),
}));

vi.mock("@/app/[locale]/settings/client-versions/_components/client-version-stats-table", () => ({
  ClientVersionStatsTable: ({ data }: { data: Array<{ clientType: string }> }) => (
    <div data-slot="client-version-stats-table" data-count={String(data.length)} />
  ),
}));

vi.mock("@/app/[locale]/settings/client-versions/_components/client-versions-skeleton", () => ({
  ClientVersionsSettingsSkeleton: () => <div data-slot="client-version-settings-skeleton" />,
  ClientVersionsTableSkeleton: () => <div data-slot="client-version-table-skeleton" />,
}));

vi.mock("@/actions/sensitive-words", () => ({
  listSensitiveWords: vi.fn(async () => [
    {
      id: 1,
      word: "blocked",
      matchType: "contains",
      description: "",
      isEnabled: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ]),
  getCacheStats: vi.fn(async () => ({
    containsCount: 1,
    exactCount: 0,
    regexCount: 0,
    totalCount: 1,
    lastReloadTime: 1,
  })),
}));

vi.mock("@/actions/error-rules", () => ({
  listErrorRules: vi.fn(async () => [
    {
      id: 2,
      pattern: "quota",
      category: "prompt_limit",
      matchType: "contains",
      description: "",
      isEnabled: true,
      isDefault: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ]),
  getCacheStats: vi.fn(async () => ({
    containsCount: 1,
    exactCount: 0,
    regexCount: 0,
    totalCount: 1,
    lastReloadTime: 1,
    isLoading: false,
  })),
}));

vi.mock("@/actions/request-filters", () => ({
  listRequestFilters: vi.fn(async () => [
    {
      id: 3,
      name: "strip-tag",
    },
  ]),
}));

vi.mock("@/repository/provider", () => ({
  findAllProviders: vi.fn(async () => [
    {
      id: 9,
      name: "Provider A",
    },
  ]),
}));

vi.mock("@/actions/client-versions", () => ({
  fetchClientVersionStats: vi.fn(async () => ({
    ok: true,
    data: [
      {
        clientType: "claude-cli",
        gaVersion: "1.0.0",
        totalUsers: 1,
        users: [],
      },
    ],
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
  for (let attempt = 0; attempt < 30; attempt += 1) {
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

describe("policy console screens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    routingState.pathname = "/console/overview";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("loads all policy destinations from /console/policy/* with shell-owned policy tabs", async () => {
    routingState.pathname = "/console/policy/sensitive-words";
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(
      <ConsoleApp bootstrap={makeBootstrap("/console/policy/sensitive-words")} />
    );
    await waitForSelector(view.container, '[data-slot="word-list-table"]');

    expect(view.container.querySelector('[data-slot="word-list-table"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="policy-module-page"]')).toBeNull();

    const moduleTabs = view.container.querySelector('[data-slot="console-module-tabs"]');
    expect(view.container.querySelector('[data-slot="policy-console-tabs"]')).toBeNull();
    expect(moduleTabs).not.toBeNull();
    expect(moduleTabs?.querySelector('[data-tab-id="sensitive-words"]')).not.toBeNull();
    expect(moduleTabs?.querySelector('[data-tab-id="error-rules"]')).not.toBeNull();
    expect(moduleTabs?.querySelector('[data-tab-id="request-filters"]')).not.toBeNull();
    expect(moduleTabs?.querySelector('[data-tab-id="client-versions"]')).not.toBeNull();

    routingState.pathname = "/console/policy/error-rules";
    await view.rerender(<ConsoleApp bootstrap={makeBootstrap("/console/policy/error-rules")} />);
    await waitForSelector(view.container, '[data-slot="rule-list-table"]');
    expect(view.container.querySelector('[data-slot="error-rule-tester"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="rule-list-table"]')).not.toBeNull();

    routingState.pathname = "/console/policy/request-filters";
    await view.rerender(
      <ConsoleApp bootstrap={makeBootstrap("/console/policy/request-filters")} />
    );
    await waitForSelector(view.container, '[data-slot="filter-table"]');
    expect(view.container.querySelector('[data-slot="filter-table"]')).not.toBeNull();

    await view.unmount();
  });

  test("keeps client versions settings and stats sections inside the runtime screen", async () => {
    routingState.pathname = "/console/policy/client-versions";
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(
      <ConsoleApp bootstrap={makeBootstrap("/console/policy/client-versions")} />
    );
    await waitForSelector(view.container, '[data-slot="client-version-toggle"]');
    await waitForSelector(view.container, '[data-slot="client-version-stats-table"]');

    expect(
      view.container.querySelector('[data-slot="policy-client-version-settings"]')
    ).not.toBeNull();
    expect(view.container.querySelector('[data-slot="client-version-toggle"]')).not.toBeNull();
    expect(
      view.container.querySelector('[data-slot="policy-client-version-stats"]')
    ).not.toBeNull();
    expect(view.container.querySelector('[data-slot="client-version-stats-table"]')).not.toBeNull();

    await view.unmount();
  });

  test("keeps admin-only gating for policy destinations", () => {
    const bootstrap = getConsoleBootstrap({
      locale: "en",
      role: "user",
      slug: ["policy", "client-versions"],
    });

    expect(bootstrap.activeRoute.screenId).toBe("overview-home");
    expect(bootstrap.currentPath).toBe("/console/overview");
  });
});
