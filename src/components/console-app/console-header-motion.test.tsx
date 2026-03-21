import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
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
      ...rest
    }: {
      children?: ReactNode;
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

import { ConsoleHeader } from "@/components/console-app/console-header";

describe("ConsoleHeader motion profile", () => {
  test("animates both the title stack and route meta on every route change", () => {
    const html = renderToStaticMarkup(
      <ConsoleHeader
        siteTitle="Claude Code Hub"
        activeModuleLabel="Policy"
        activeScreenLabel="Request Filters"
        currentPath="/console/policy/request-filters"
        direction={1}
      />
    );

    expect(html).toContain('data-slot="console-header-title-stack"');
    expect(html).toContain('data-current-path="/console/policy/request-filters"');
    expect(html).toContain('data-slot="console-header-route-meta"');
    expect(html).toContain('data-motion-initial="{&quot;opacity&quot;:0,&quot;y&quot;:34}"');
    expect(html).toContain('data-motion-animate="{&quot;opacity&quot;:1,&quot;y&quot;:0}"');
    expect(html).toContain('data-motion-exit="{&quot;opacity&quot;:0,&quot;y&quot;:-24}"');
    expect(html).toContain(
      'data-motion-transition="{&quot;duration&quot;:0.3,&quot;ease&quot;:[0.16,1,0.3,1]}"'
    );
  });
});
