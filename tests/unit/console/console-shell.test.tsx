/**
 * @vitest-environment happy-dom
 */

import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ConsoleShell } from "@/components/console/console-shell";
import { ConsoleStage } from "@/components/console/console-stage";
import { resolveConsoleRoute, type ConsoleModuleId } from "@/lib/console/module-registry";

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    className,
    children,
    ...rest
  }: {
    href: string;
    className?: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

const MODULE_LABELS: Record<ConsoleModuleId, string> = {
  overview: "Overview",
  traffic: "Traffic",
  providers: "Providers",
  policy: "Policy",
  system: "System",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("ConsoleShell", () => {
  test("renders desktop and mobile navigation and highlights the active module", () => {
    const html = renderToStaticMarkup(
      <ConsoleShell
        role="admin"
        activeRoute={resolveConsoleRoute("/settings/providers")}
        moduleLabels={MODULE_LABELS}
        header={<div data-slot="shell-header">Header</div>}
        hero={<div data-slot="shell-hero">Hero</div>}
        toolbar={<div data-slot="shell-toolbar">Toolbar</div>}
      >
        <div>Providers content</div>
      </ConsoleShell>
    );

    expect(html).toContain('data-slot="console-nav-desktop"');
    expect(html).toContain('data-slot="console-nav-mobile"');
    expect(html).toContain('data-module-id="providers"');
    expect(html).toContain('data-module-id="providers" data-active="true"');
    expect(html).toContain("Providers content");
  });

  test("omits admin-only modules for non-admin shells", () => {
    const html = renderToStaticMarkup(
      <ConsoleShell
        role="user"
        activeRoute={resolveConsoleRoute("/dashboard")}
        moduleLabels={MODULE_LABELS}
      >
        <div>Overview content</div>
      </ConsoleShell>
    );

    expect(html).toContain('data-module-id="overview"');
    expect(html).toContain('data-module-id="traffic"');
    expect(html).not.toContain('data-module-id="providers"');
    expect(html).not.toContain('data-module-id="policy"');
    expect(html).not.toContain('data-module-id="system"');
  });
});

describe("ConsoleStage", () => {
  test("switches between padded and full-bleed staging", () => {
    const paddedHtml = renderToStaticMarkup(<ConsoleStage>Padded</ConsoleStage>);
    const fullBleedHtml = renderToStaticMarkup(<ConsoleStage fullBleed>Full bleed</ConsoleStage>);

    expect(paddedHtml).toContain('data-stage-mode="padded"');
    expect(paddedHtml).toContain("max-w-7xl");
    expect(fullBleedHtml).toContain('data-stage-mode="full-bleed"');
    expect(fullBleedHtml).toContain("overflow-hidden");
  });
});
