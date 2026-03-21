import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      initial,
      animate,
      exit,
      transition,
      className,
      layout: _layout,
      ...rest
    }: {
      children?: ReactNode;
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      className?: string;
      layout?: unknown;
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

import { PageStage } from "@/components/page-stage";

describe("PageStage motion profile", () => {
  test("uses octopus-style fade and scale transitions without blur", () => {
    const html = renderToStaticMarkup(
      <PageStage activeKey="/dashboard">
        <div key="summary">Summary</div>
        <div key="chart">Chart</div>
      </PageStage>
    );

    expect(html).toContain('data-slot="page-stage"');
    expect(html).toContain('data-motion-initial="{&quot;opacity&quot;:0,&quot;y&quot;:20}"');
    expect(html).toContain('data-motion-animate="{&quot;opacity&quot;:1,&quot;y&quot;:0}"');
    expect(html).toContain('data-motion-exit="{&quot;opacity&quot;:0,&quot;scale&quot;:0.95}"');
    expect(html).toContain('data-motion-initial="{&quot;opacity&quot;:0,&quot;y&quot;:20}"');
    expect(html).toContain('data-motion-exit="{&quot;opacity&quot;:0,&quot;scale&quot;:0.95}"');
    expect(html).not.toContain("blur");
  });
});
