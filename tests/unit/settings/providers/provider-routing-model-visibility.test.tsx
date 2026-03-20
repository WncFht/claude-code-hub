/** @vitest-environment happy-dom */

const mockDispatch = vi.fn();
const mockUseProviderForm = vi.fn();
const mockUseQueryClient = vi.fn(() => ({ invalidateQueries: vi.fn() }));
const syncProviderModelsMock = vi.fn();

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("framer-motion", () => ({
  motion: { div: ({ children, ...rest }: any) => <div {...rest}>{children}</div> },
}));
vi.mock("lucide-react", () => {
  const stub = ({ className }: any) => <span data-testid="icon" className={className} />;
  return { Info: stub, Layers: stub, Route: stub, Scale: stub, RefreshCw: stub };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockUseQueryClient(),
}));
vi.mock("@/actions/providers", () => ({
  syncProviderModels: (...args: any[]) => syncProviderModelsMock(...args),
}));
vi.mock("@/lib/provider-type-utils", () => ({
  getProviderTypeConfig: () => ({
    icon: ({ className }: any) => <span data-testid="provider-icon" className={className} />,
    bgColor: "bg-muted",
    iconColor: "text-foreground",
  }),
}));
vi.mock(
  "@/app/[locale]/settings/providers/_components/forms/provider-form/provider-form-context",
  () => ({
    useProviderForm: (...args: any[]) => mockUseProviderForm(...args),
  })
);
vi.mock("@/components/form/client-restrictions-editor", () => ({
  ClientRestrictionsEditor: () => <div data-testid="client-restrictions-editor" />,
}));
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock("@/components/ui/input", () => ({
  Input: (props: any) => <input {...props} />,
}));
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
}));
vi.mock("@/components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange, disabled }: any) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
    />
  ),
}));
vi.mock("@/components/ui/tag-input", () => ({
  TagInput: ({ value }: any) => <div>{Array.isArray(value) ? value.join(",") : ""}</div>,
}));
vi.mock("@/app/[locale]/settings/providers/_components/batch-edit/mixed-value-indicator", () => ({
  MixedValueIndicator: () => <div data-testid="mixed-value-indicator" />,
}));
vi.mock("@/app/[locale]/settings/providers/_components/model-multi-select", () => ({
  ModelMultiSelect: () => <div data-testid="model-multi-select" />,
}));
vi.mock("@/app/[locale]/settings/providers/_components/model-redirect-editor", () => ({
  ModelRedirectEditor: () => <div data-testid="model-redirect-editor" />,
}));
vi.mock(
  "@/app/[locale]/settings/providers/_components/forms/provider-form/components/section-card",
  () => ({
    FieldGroup: ({ label, children }: any) => (
      <section>
        <div>{label}</div>
        {children}
      </section>
    ),
    SectionCard: ({ title, description, children }: any) => (
      <section>
        <h2>{title}</h2>
        <p>{description}</p>
        {children}
      </section>
    ),
    SmartInputWrapper: ({ label, description, children }: any) => (
      <div>
        <label>{label}</label>
        {description ? <p>{description}</p> : null}
        {children}
      </div>
    ),
    ToggleRow: ({ label, description, children }: any) => (
      <div>
        <span>{label}</span>
        <span>{description}</span>
        {children}
      </div>
    ),
  })
);

import type React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { RoutingSection } from "@/app/[locale]/settings/providers/_components/forms/provider-form/sections/routing-section";
import type { ProviderDisplay } from "@/types/provider";
import type { ProviderFormState } from "@/app/[locale]/settings/providers/_components/forms/provider-form/provider-form-types";

function render(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

function makeProvider(overrides: Partial<ProviderDisplay> = {}): ProviderDisplay {
  return {
    id: 1,
    name: "Provider A",
    url: "https://api.example.com",
    maskedKey: "sk-***",
    isEnabled: true,
    weight: 1,
    priority: 0,
    groupPriorities: null,
    costMultiplier: 1,
    groupTag: null,
    providerType: "claude",
    providerVendorId: null,
    preserveClientIp: false,
    modelRedirects: null,
    activeTimeStart: null,
    activeTimeEnd: null,
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
    limitConcurrentSessions: 0,
    maxRetryAttempts: null,
    circuitBreakerFailureThreshold: 5,
    circuitBreakerOpenDuration: 1800000,
    circuitBreakerHalfOpenSuccessThreshold: 2,
    proxyUrl: null,
    proxyFallbackToDirect: false,
    firstByteTimeoutStreamingMs: 0,
    streamingIdleTimeoutMs: 0,
    requestTimeoutNonStreamingMs: 0,
    websiteUrl: null,
    faviconUrl: null,
    cacheTtlPreference: null,
    swapCacheTtlBilling: false,
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
    tpm: null,
    rpm: null,
    rpd: null,
    cc: null,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

function createMockState(overrides: Partial<ProviderFormState["routing"]> = {}): ProviderFormState {
  return {
    basic: { name: "", url: "", key: "", websiteUrl: "" },
    routing: {
      providerType: "claude",
      groupTag: [],
      preserveClientIp: false,
      modelRedirects: {},
      allowedModels: [],
      allowedClients: [],
      blockedClients: [],
      priority: 0,
      groupPriorities: {},
      weight: 1,
      costMultiplier: 1,
      cacheTtlPreference: "inherit",
      swapCacheTtlBilling: false,
      codexReasoningEffortPreference: "inherit",
      codexReasoningSummaryPreference: "inherit",
      codexTextVerbosityPreference: "inherit",
      codexParallelToolCallsPreference: "inherit",
      codexServiceTierPreference: "inherit",
      anthropicMaxTokensPreference: "inherit",
      anthropicThinkingBudgetPreference: "inherit",
      anthropicAdaptiveThinking: null,
      geminiGoogleSearchPreference: "inherit",
      activeTimeStart: null,
      activeTimeEnd: null,
      ...overrides,
    },
    rateLimit: {
      limit5hUsd: null,
      limitDailyUsd: null,
      dailyResetMode: "fixed",
      dailyResetTime: "00:00",
      limitWeeklyUsd: null,
      limitMonthlyUsd: null,
      limitTotalUsd: null,
      limitConcurrentSessions: null,
    },
    circuitBreaker: {
      failureThreshold: undefined,
      openDurationMinutes: undefined,
      halfOpenSuccessThreshold: undefined,
      maxRetryAttempts: null,
    },
    network: {
      proxyUrl: "",
      proxyFallbackToDirect: false,
      firstByteTimeoutStreamingSeconds: undefined,
      streamingIdleTimeoutSeconds: undefined,
      requestTimeoutNonStreamingSeconds: undefined,
    },
    mcp: {
      mcpPassthroughType: "none",
      mcpPassthroughUrl: "",
    },
    batch: { isEnabled: "no_change" },
    ui: {
      activeTab: "routing",
      activeSubTab: null,
      isPending: false,
      showFailureThresholdConfirm: false,
    },
  };
}

function setMockForm({
  state = createMockState(),
  provider = makeProvider(),
  mode = "edit",
}: {
  state?: ProviderFormState;
  provider?: ProviderDisplay;
  mode?: "create" | "edit" | "batch";
} = {}) {
  mockUseProviderForm.mockReturnValue({
    state,
    dispatch: mockDispatch,
    mode,
    provider,
    enableMultiProviderTypes: true,
    hideUrl: false,
    hideWebsiteUrl: false,
    groupSuggestions: [],
    dirtyFields: new Set(),
  });
}

function getBodyText() {
  return document.body.textContent || "";
}

describe("RoutingSection model visibility", () => {
  beforeEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
    vi.clearAllMocks();
    setMockForm();
  });

  it("renders upstream snapshot diff groups for edit mode providers", () => {
    setMockForm({
      state: createMockState({
        allowedModels: ["claude-match", "claude-whitelist-only"],
      }),
      provider: makeProvider({
        discoveredModels: ["claude-match", "claude-upstream-only"],
        modelDiscoveryStatus: "success",
        lastModelSyncAt: "2026-03-20T00:00:00.000Z",
      }),
      mode: "edit",
    });

    const { unmount } = render(<RoutingSection />);

    expect(getBodyText()).toContain("sections.routing.modelDiscovery.title");
    expect(getBodyText()).toContain("sections.routing.modelDiscovery.syncButton");
    expect(getBodyText()).toContain("sections.routing.modelDiscovery.groups.matched");
    expect(getBodyText()).toContain("claude-match");
    expect(getBodyText()).toContain("sections.routing.modelDiscovery.groups.whitelistOnly");
    expect(getBodyText()).toContain("claude-whitelist-only");
    expect(getBodyText()).toContain("sections.routing.modelDiscovery.groups.discoveredOnly");
    expect(getBodyText()).toContain("claude-upstream-only");

    unmount();
  });

  it("renders empty snapshot and allow-all note when no whitelist or discovery snapshot exists", () => {
    setMockForm({
      state: createMockState({ allowedModels: [] }),
      provider: makeProvider({
        discoveredModels: null,
        modelDiscoveryStatus: null,
        lastModelSyncAt: null,
        lastModelSyncError: null,
      }),
      mode: "edit",
    });

    const { unmount } = render(<RoutingSection />);

    expect(getBodyText()).toContain("sections.routing.modelDiscovery.empty");
    expect(getBodyText()).toContain("sections.routing.modelDiscovery.allowAllNote");

    unmount();
  });

  it("does not mark whitelist models as missing when no discovery snapshot exists yet", () => {
    setMockForm({
      state: createMockState({ allowedModels: ["gpt-5.4", "gpt-5.3-codex"] }),
      provider: makeProvider({
        discoveredModels: null,
        modelDiscoveryStatus: null,
        lastModelSyncAt: null,
        lastModelSyncError: null,
      }),
      mode: "edit",
    });

    const { container, unmount } = render(<RoutingSection />);
    const discoverySection = Array.from(container.querySelectorAll("section")).find(
      (section) =>
        section.firstElementChild?.textContent === "sections.routing.modelDiscovery.title"
    );

    expect(discoverySection?.textContent).toContain("sections.routing.modelDiscovery.empty");
    expect(discoverySection?.textContent).not.toContain(
      "sections.routing.modelDiscovery.groups.whitelistOnly"
    );
    expect(discoverySection?.textContent).not.toContain("gpt-5.4");
    expect(discoverySection?.textContent).not.toContain("gpt-5.3-codex");

    unmount();
  });

  it("renders last sync error details when the snapshot is stale", () => {
    setMockForm({
      state: createMockState({ allowedModels: ["claude-match"] }),
      provider: makeProvider({
        discoveredModels: ["claude-match"],
        modelDiscoveryStatus: "error",
        lastModelSyncAt: "2026-03-20T01:00:00.000Z",
        lastModelSyncError: "API returned error: HTTP 404",
      }),
      mode: "edit",
    });

    const { unmount } = render(<RoutingSection />);

    expect(getBodyText()).toContain("sections.routing.modelDiscovery.status.error");
    expect(getBodyText()).toContain("API returned error: HTTP 404");

    unmount();
  });

  it("disables sync and warns when connection settings have unsaved edits", () => {
    const state = createMockState();
    state.basic.url = "https://api.changed.example.com";

    setMockForm({
      state,
      provider: makeProvider({
        url: "https://api.example.com",
      }),
      mode: "edit",
    });

    const { container, unmount } = render(<RoutingSection />);
    const syncButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("sections.routing.modelDiscovery.syncButton")
    );

    expect(getBodyText()).toContain("sections.routing.modelDiscovery.saveBeforeSync");
    expect(syncButton?.hasAttribute("disabled")).toBe(true);

    unmount();
  });
});
