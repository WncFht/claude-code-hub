import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      transition,
      className,
      ...rest
    }: {
      children?: React.ReactNode;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      className?: string;
      [key: string]: unknown;
    }) => (
      <div
        className={className}
        data-motion-initial={JSON.stringify(initial)}
        data-motion-animate={JSON.stringify(animate)}
        data-motion-exit={JSON.stringify(exit)}
        data-motion-transition={JSON.stringify(transition)}
        {...rest}
      >
        {children}
      </div>
    ),
  },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock("../provider-form-context", () => ({
  useProviderForm: () => ({
    state: {
      batch: { isEnabled: "no_change" },
      basic: { key: "" },
      ui: { isPending: false },
    },
    dispatch: vi.fn(),
    mode: "batch",
    provider: null,
    hideUrl: false,
    hideWebsiteUrl: false,
    batchProviders: [],
  }),
}));

vi.mock("../components/section-card", () => ({
  SectionCard: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
  SmartInputWrapper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span>Select value</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { BasicInfoSection } from "./basic-info-section";

describe("BasicInfoSection motion", () => {
  test("uses vertical section transitions instead of horizontal slide-ins", () => {
    const html = renderToStaticMarkup(<BasicInfoSection />);

    expect(html).toContain('data-motion-initial="{&quot;opacity&quot;:0,&quot;y&quot;:20}"');
    expect(html).toContain('data-motion-animate="{&quot;opacity&quot;:1,&quot;y&quot;:0}"');
    expect(html).toContain('data-motion-exit="{&quot;opacity&quot;:0,&quot;y&quot;:-16}"');
    expect(html).not.toContain("&quot;x&quot;");
  });
});
