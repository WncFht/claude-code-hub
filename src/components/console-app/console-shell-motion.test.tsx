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

vi.mock("@/components/console/console-stage", () => ({
  ConsoleStage: ({ children }: { children: ReactNode }) => (
    <div data-slot="mock-console-stage">{children}</div>
  ),
}));

vi.mock("@/components/console-app/console-header", () => ({
  ConsoleHeader: () => <div data-slot="mock-console-header" />,
}));

vi.mock("@/components/console-app/console-sidebar", () => ({
  ConsoleSidebar: () => <div data-slot="mock-console-sidebar" />,
}));

vi.mock("@/components/console-app/console-module-tabs", () => ({
  ConsoleModuleTabs: () => <div data-slot="mock-console-tabs" />,
}));

import { ConsoleShell } from "@/components/console-app/console-shell";

describe("ConsoleShell motion profile", () => {
  test("uses octopus-style stage transitions on screen changes", () => {
    const html = renderToStaticMarkup(
      <ConsoleShell
        siteTitle="Claude Code Hub"
        currentPath="/console/system/config"
        activeModuleLabel="System"
        activeScreenLabel="Config"
        activeRoute={{
          screenId: "system-config",
          moduleId: "system",
          consolePath: "/console/system/config",
          labelKind: "settings-nav",
          labelKey: "config",
          visibleForRoles: ["admin"],
          matchKind: "exact",
          secondaryTabId: "config",
          fullBleed: false,
          legacyPaths: ["/settings/config"],
        }}
        direction={1}
        navigationItems={[]}
        moduleTabs={[
          {
            id: "config",
            href: "/console/system/config",
            label: "Config",
            active: true,
          },
          {
            id: "logs",
            href: "/console/system/logs",
            label: "Logs",
            active: false,
          },
        ]}
        toolbar={<div>Toolbar actions</div>}
      >
        <section>System config content</section>
      </ConsoleShell>
    );

    expect(html).toContain('data-slot="console-module-tabs-transition"');
    expect(html).toContain('data-slot="console-toolbar-transition"');
    expect(html).toContain('data-screen-id="system-config"');
    expect(html).toContain('data-module-id="system"');
    expect(html).toContain('data-slot="console-stage-transition"');
    expect(html).toContain('data-motion-initial="{&quot;opacity&quot;:0,&quot;scale&quot;:0.8}"');
    expect(html).toContain('data-motion-animate="{&quot;opacity&quot;:1,&quot;scale&quot;:1}"');
    expect(html).toContain('data-motion-exit="{&quot;opacity&quot;:0,&quot;scale&quot;:0.98}"');
    expect(html).toContain(
      'data-motion-transition="{&quot;duration&quot;:0.5,&quot;ease&quot;:[0.16,1,0.3,1],&quot;delay&quot;:0.1}"'
    );
    expect(html).toContain('data-motion-initial="{&quot;opacity&quot;:0,&quot;y&quot;:16}"');
    expect(html).toContain(
      'data-motion-initial="{&quot;opacity&quot;:0,&quot;y&quot;:18,&quot;scale&quot;:0.98}"'
    );
    expect(html).not.toContain("blur");
  });
});
