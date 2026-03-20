/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

const routingMocks = vi.hoisted(() => ({
  redirect: vi.fn(({ href, locale }: { href: string; locale: string }) => ({ href, locale })),
}));

const sensitiveWordsMocks = vi.hoisted(() => ({
  getCacheStats: vi.fn(),
  listSensitiveWords: vi.fn(),
}));

const errorRulesMocks = vi.hoisted(() => ({
  getCacheStats: vi.fn(),
  listErrorRules: vi.fn(),
}));

const requestFiltersMocks = vi.hoisted(() => ({
  listRequestFilters: vi.fn(),
}));

const providerRepositoryMocks = vi.hoisted(() => ({
  findAllProviders: vi.fn(),
}));

const clientVersionsMocks = vi.hoisted(() => ({
  fetchClientVersionStats: vi.fn(),
}));

const systemConfigMocks = vi.hoisted(() => ({
  fetchSystemSettings: vi.fn(),
}));

vi.mock("@/lib/auth", () => authMocks);
vi.mock("@/actions/sensitive-words", () => sensitiveWordsMocks);
vi.mock("@/actions/error-rules", () => errorRulesMocks);
vi.mock("@/actions/request-filters", () => requestFiltersMocks);
vi.mock("@/repository/provider", () => providerRepositoryMocks);
vi.mock("@/actions/client-versions", () => clientVersionsMocks);
vi.mock("@/actions/system-config", () => systemConfigMocks);

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

vi.mock("@/app/[locale]/settings/sensitive-words/_components/add-word-dialog", () => ({
  AddWordDialog: () => <button type="button">add-word</button>,
}));

vi.mock("@/app/[locale]/settings/sensitive-words/_components/refresh-cache-button", () => ({
  RefreshCacheButton: () => <button type="button">refresh-sensitive-words</button>,
}));

vi.mock("@/app/[locale]/settings/sensitive-words/_components/sensitive-words-skeleton", () => ({
  SensitiveWordsTableSkeleton: () => <div data-testid="sensitive-words-skeleton" />,
}));

vi.mock("@/app/[locale]/settings/sensitive-words/_components/word-list-table", () => ({
  WordListTable: () => <div data-testid="sensitive-words-table" />,
}));

vi.mock("@/app/[locale]/settings/error-rules/_components/add-rule-dialog", () => ({
  AddRuleDialog: () => <button type="button">add-rule</button>,
}));

vi.mock("@/app/[locale]/settings/error-rules/_components/error-rule-tester", () => ({
  ErrorRuleTester: () => <div data-testid="error-rule-tester" />,
}));

vi.mock("@/app/[locale]/settings/error-rules/_components/error-rules-skeleton", () => ({
  ErrorRulesTableSkeleton: () => <div data-testid="error-rules-skeleton" />,
}));

vi.mock("@/app/[locale]/settings/error-rules/_components/refresh-cache-button", () => ({
  RefreshCacheButton: () => <button type="button">refresh-error-rules</button>,
}));

vi.mock("@/app/[locale]/settings/error-rules/_components/rule-list-table", () => ({
  RuleListTable: () => <div data-testid="error-rules-table" />,
}));

vi.mock("@/app/[locale]/settings/request-filters/_components/filter-table", () => ({
  FilterTable: () => <div data-testid="request-filters-table" />,
}));

vi.mock("@/app/[locale]/settings/request-filters/_components/request-filters-skeleton", () => ({
  RequestFiltersTableSkeleton: () => <div data-testid="request-filters-skeleton" />,
}));

vi.mock("@/app/[locale]/settings/client-versions/_components/client-version-stats-table", () => ({
  ClientVersionStatsTable: () => <div data-testid="client-version-stats-table" />,
}));

vi.mock("@/app/[locale]/settings/client-versions/_components/client-version-toggle", () => ({
  ClientVersionToggle: () => <div data-testid="client-version-toggle" />,
}));

vi.mock("@/app/[locale]/settings/client-versions/_components/client-versions-skeleton", () => ({
  ClientVersionsSettingsSkeleton: () => <div data-testid="client-versions-settings-skeleton" />,
  ClientVersionsTableSkeleton: () => <div data-testid="client-versions-table-skeleton" />,
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

describe("Policy module page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.getSession.mockResolvedValue(makeSession("admin"));
    sensitiveWordsMocks.getCacheStats.mockResolvedValue({ enabled: 1, total: 1 });
    sensitiveWordsMocks.listSensitiveWords.mockResolvedValue([]);
    errorRulesMocks.getCacheStats.mockResolvedValue({ enabled: 1, total: 1 });
    errorRulesMocks.listErrorRules.mockResolvedValue([]);
    requestFiltersMocks.listRequestFilters.mockResolvedValue([]);
    providerRepositoryMocks.findAllProviders.mockResolvedValue([]);
    clientVersionsMocks.fetchClientVersionStats.mockResolvedValue({ ok: true, data: [] });
    systemConfigMocks.fetchSystemSettings.mockResolvedValue({
      ok: true,
      data: { enableClientVersionCheck: true },
    });
  });

  test("sensitive words, error rules, request filters, and client versions share the policy wrapper", async () => {
    vi.resetModules();
    vi.doMock("@/app/[locale]/settings/_components/policy-module-page", () => ({
      PolicyModulePage: ({ activeTab, children }: { activeTab: string; children: ReactNode }) => (
        <div data-slot="policy-module-page" data-active-tab={activeTab}>
          {children}
        </div>
      ),
    }));

    const SensitiveWordsPage = (await import("@/app/[locale]/settings/sensitive-words/page"))
      .default;
    const ErrorRulesPage = (await import("@/app/[locale]/settings/error-rules/page")).default;
    const RequestFiltersPage = (await import("@/app/[locale]/settings/request-filters/page"))
      .default;
    const ClientVersionsPage = (await import("@/app/[locale]/settings/client-versions/page"))
      .default;

    const sensitiveWordsHtml = renderToStaticMarkup(await SensitiveWordsPage());
    const errorRulesHtml = renderToStaticMarkup(await ErrorRulesPage());
    const requestFiltersHtml = renderToStaticMarkup(await RequestFiltersPage());
    const clientVersionsHtml = renderToStaticMarkup(
      await ClientVersionsPage({ params: makeAsyncParams("en") })
    );

    expect(sensitiveWordsHtml).toContain('data-slot="policy-module-page"');
    expect(errorRulesHtml).toContain('data-slot="policy-module-page"');
    expect(requestFiltersHtml).toContain('data-slot="policy-module-page"');
    expect(clientVersionsHtml).toContain('data-slot="policy-module-page"');

    expect(sensitiveWordsHtml).toContain('data-active-tab="sensitive-words"');
    expect(errorRulesHtml).toContain('data-active-tab="error-rules"');
    expect(requestFiltersHtml).toContain('data-active-tab="request-filters"');
    expect(clientVersionsHtml).toContain('data-active-tab="client-versions"');

    expect(sensitiveWordsHtml).not.toContain('data-slot="settings-page-header"');
    expect(errorRulesHtml).not.toContain('data-slot="settings-page-header"');
    expect(requestFiltersHtml).not.toContain('data-slot="settings-page-header"');
    expect(clientVersionsHtml).not.toContain('data-slot="settings-page-header"');

    vi.doUnmock("@/app/[locale]/settings/_components/policy-module-page");
  });

  test("renders shared policy tabs and module copy", async () => {
    const { PolicyModulePage } = await import(
      "@/app/[locale]/settings/_components/policy-module-page"
    );

    const html = renderToStaticMarkup(
      await PolicyModulePage({
        role: "admin",
        activeTab: "request-filters",
        children: <div>Policy body</div>,
      })
    );

    expect(html).toContain("policy.eyebrow");
    expect(html).toContain("policy.title");
    expect(html).toContain("policy.description");
    expect(html).toContain('data-tab-id="sensitive-words"');
    expect(html).toContain('data-tab-id="error-rules"');
    expect(html).toContain('data-tab-id="request-filters"');
    expect(html).toContain('data-tab-id="client-versions"');
    expect(html).toContain('data-tab-id="request-filters" data-active="true"');
    expect(html).toContain("nav.sensitiveWords");
    expect(html).toContain("nav.errorRules");
    expect(html).toContain("nav.requestFilters");
    expect(html).toContain("nav.clientVersions");
  });

  test("hides policy tabs for non-admin shells", async () => {
    const { PolicyModulePage } = await import(
      "@/app/[locale]/settings/_components/policy-module-page"
    );

    const html = renderToStaticMarkup(
      await PolicyModulePage({
        role: "user",
        activeTab: "request-filters",
        children: <div>Policy body</div>,
      })
    );

    expect(html).not.toContain('data-tab-id="sensitive-words"');
    expect(html).not.toContain('data-tab-id="error-rules"');
    expect(html).not.toContain('data-tab-id="request-filters"');
    expect(html).not.toContain('data-tab-id="client-versions"');
  });
});
