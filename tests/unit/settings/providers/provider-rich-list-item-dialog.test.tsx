/**
 * @vitest-environment happy-dom
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ProviderRichListItem } from "@/app/[locale]/settings/providers/_components/provider-rich-list-item";
import type { ProviderDisplay } from "@/types/provider";
import type { User } from "@/types/user";
import enMessages from "../../../../messages/en";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/actions/providers", () => ({
  editProvider: vi.fn(async () => ({ ok: true })),
  removeProvider: vi.fn(async () => ({ ok: true, data: { undoToken: "undo", operationId: 1 } })),
  getUnmaskedProviderKey: vi.fn(async () => ({ ok: true, data: { key: "sk-test" } })),
  resetProviderCircuit: vi.fn(async () => ({ ok: true })),
  resetProviderTotalUsage: vi.fn(async () => ({ ok: true })),
  undoProviderDelete: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("../../../../src/app/[locale]/settings/providers/_components/forms/provider-form", () => ({
  ProviderForm: ({
    mode,
    cloneProvider,
  }: {
    mode: "create" | "edit";
    cloneProvider?: ProviderDisplay;
  }) => (
    <div data-slot="mock-provider-form">
      {mode === "edit" ? "Edit provider form" : "Create provider form"}
      {cloneProvider ? ` ${cloneProvider.name}` : ""}
    </div>
  ),
}));

const ADMIN_USER: User = {
  id: 1,
  name: "admin",
  description: "",
  role: "admin",
  rpm: null,
  dailyQuota: null,
  providerGroup: null,
  tags: [],
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  dailyResetMode: "fixed",
  dailyResetTime: "00:00",
  isEnabled: true,
};

function makeProviderDisplay(overrides: Partial<ProviderDisplay> = {}): ProviderDisplay {
  return {
    id: 1,
    name: "Claude 3.5 Sonnet",
    url: "https://api.anthropic.com",
    maskedKey: "sk-***",
    isEnabled: true,
    weight: 1,
    priority: 1,
    costMultiplier: 1,
    groupTag: null,
    providerType: "claude",
    providerVendorId: null,
    preserveClientIp: false,
    modelRedirects: null,
    allowedModels: null,
    allowedClients: [],
    blockedClients: [],
    discoveredModels: null,
    modelDiscoveryStatus: null,
    lastModelSyncAt: null,
    lastModelSyncError: null,
    mcpPassthroughType: "none",
    mcpPassthroughUrl: null,
    limit5hUsd: null,
    limitDailyUsd: null,
    dailyResetMode: "fixed",
    dailyResetTime: "00:00",
    limitWeeklyUsd: null,
    limitMonthlyUsd: null,
    limitTotalUsd: null,
    limitConcurrentSessions: 1,
    maxRetryAttempts: null,
    circuitBreakerFailureThreshold: 1,
    circuitBreakerOpenDuration: 60,
    circuitBreakerHalfOpenSuccessThreshold: 1,
    proxyUrl: null,
    proxyFallbackToDirect: false,
    firstByteTimeoutStreamingMs: 0,
    streamingIdleTimeoutMs: 0,
    requestTimeoutNonStreamingMs: 0,
    websiteUrl: null,
    faviconUrl: null,
    cacheTtlPreference: null,
    context1mPreference: null,
    codexReasoningEffortPreference: null,
    codexReasoningSummaryPreference: null,
    codexTextVerbosityPreference: null,
    codexParallelToolCallsPreference: null,
    codexServiceTierPreference: null,
    anthropicMaxTokensPreference: null,
    anthropicThinkingBudgetPreference: null,
    anthropicAdaptiveThinking: null,
    geminiGoogleSearchPreference: null,
    swapCacheTtlBilling: false,
    tpm: null,
    rpm: null,
    rpd: null,
    cc: null,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

function installDesktopMediaQuery() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 768px)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function installMobileMediaQuery() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function installAnimationFrameMock() {
  vi.stubGlobal("requestAnimationFrame", ((callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(0), 0)) as typeof requestAnimationFrame);
  vi.stubGlobal("cancelAnimationFrame", ((id: number) =>
    window.clearTimeout(id)) as typeof cancelAnimationFrame);
}

async function flushTicks(times = 4) {
  for (let i = 0; i < times; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

function renderWithProviders(node: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={enMessages} timeZone="UTC">
          {node}
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
  });

  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe("ProviderRichListItem dialog triggers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installDesktopMediaQuery();
    installAnimationFrameMock();
    document.body.innerHTML = "";
  });

  test("opens edit form through the provider morph dialog on desktop", async () => {
    const provider = makeProviderDisplay();
    const { unmount } = renderWithProviders(
      <ProviderRichListItem
        provider={provider}
        currentUser={ADMIN_USER}
        enableMultiProviderTypes={true}
      />
    );

    await flushTicks(3);

    const trigger = document.querySelector('[data-slot="provider-edit-trigger"]');
    expect(trigger).toBeTruthy();

    act(() => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const dialogContent = document.body.querySelector(
      '[data-slot="provider-morph-dialog-content"]'
    ) as HTMLDivElement | null;
    expect(dialogContent).toBeTruthy();
    expect(dialogContent?.className ?? "").toContain("p-3");
    expect(dialogContent?.className ?? "").not.toContain("p-0");
    expect(document.body.querySelector('[data-slot="provider-dialog-chrome"]')).toBeNull();
    expect(document.body.textContent).toContain("Edit provider form");

    unmount();
  });

  test("opens clone form through the provider morph dialog on desktop", async () => {
    const provider = makeProviderDisplay();
    const { unmount } = renderWithProviders(
      <ProviderRichListItem
        provider={provider}
        currentUser={ADMIN_USER}
        enableMultiProviderTypes={true}
      />
    );

    await flushTicks(3);

    const trigger = document.querySelector('[data-slot="provider-clone-trigger"]');
    expect(trigger).toBeTruthy();

    act(() => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await flushTicks(6);

    expect(document.body.querySelector('[data-slot="provider-morph-dialog-content"]')).toBeTruthy();
    expect(document.body.textContent).toContain("Create provider form Claude 3.5 Sonnet");

    unmount();
  });

  test("renders a morph clone trigger on mobile instead of falling back to a separate dialog path", async () => {
    installMobileMediaQuery();

    const provider = makeProviderDisplay();
    const { unmount } = renderWithProviders(
      <ProviderRichListItem
        provider={provider}
        currentUser={ADMIN_USER}
        enableMultiProviderTypes={true}
      />
    );

    await flushTicks(3);

    const trigger = document.querySelector('[data-slot="provider-clone-trigger"]');
    expect(trigger).toBeTruthy();

    act(() => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.querySelector('[data-slot="provider-morph-dialog-content"]')).toBeTruthy();
    expect(document.body.textContent).toContain("Create provider form Claude 3.5 Sonnet");

    unmount();
  });
});
