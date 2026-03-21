import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      className,
      layout: _layout,
      ...rest
    }: {
      children?: ReactNode;
      className?: string;
      layout?: unknown;
      [key: string]: unknown;
    }) => (
      <div className={className} {...rest}>
        {children}
      </div>
    ),
  },
}));

import { ConsoleScreenStage } from "@/components/console-app/console-screen-stage";

describe("ConsoleScreenStage", () => {
  test("forwards screenId into the staged key and preserves DOM attributes", () => {
    const html = renderToStaticMarkup(
      <ConsoleScreenStage
        screenId="system-config"
        className="space-y-4"
        data-slot="system-config-screen"
        data-test-id="console-stage"
      >
        <section key="config">Config section</section>
        <section key="cleanup">Cleanup section</section>
      </ConsoleScreenStage>
    );

    expect(html).toContain('data-slot="system-config-screen"');
    expect(html).toContain('data-test-id="console-stage"');
    expect(html).toContain("space-y-4");
    expect(html).toContain("Config section");
    expect(html).toContain("Cleanup section");
    expect((html.match(/data-slot="page-stage-item"/g) ?? []).length).toBe(2);
  });
});
