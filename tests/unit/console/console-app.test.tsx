/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { act } from "react";
import { NextIntlClientProvider } from "next-intl";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
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

const messages = {
  dashboard: {
    console: {
      modules: {
        overview: "Overview",
        traffic: "Traffic",
        providers: "Providers",
        policy: "Policy",
        system: "System",
      },
      routes: {
        dashboard: "Dashboard",
        leaderboard: "Leaderboard",
        availability: "Availability",
        logs: "Logs",
        users: "Users",
        sessions: "Sessions",
        quotas: "Quotas",
        myQuota: "My Quota",
      },
    },
  },
  settings: {
    nav: {
      sensitiveWords: "Sensitive Words",
      errorRules: "Error Rules",
      requestFilters: "Request Filters",
      clientVersions: "Client Versions",
      config: "Config",
      data: "Data",
      notifications: "Notifications",
      logs: "Logs",
    },
  },
};

function makeBootstrap(pathname: string) {
  return buildConsoleBootstrap({
    locale: "en",
    pathname,
    role: "admin",
  });
}

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function render(node: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(node);
    await flushPromises();
  });

  return {
    container,
    rerender: async (nextNode: ReactNode) => {
      await act(async () => {
        root.render(nextNode);
        await flushPromises();
      });
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
        await flushPromises();
      });
      container.remove();
    },
  };
}

describe("ConsoleApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routingState.pathname = "/console/overview";
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("renders primary module navigation and derives the active screen from the current console pathname", async () => {
    routingState.pathname = "/console/providers/inventory";
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ConsoleApp bootstrap={makeBootstrap("/console/overview")} />
      </NextIntlClientProvider>
    );
    const sidebar = view.container.querySelector('[data-slot="console-sidebar"]');

    expect(view.container.querySelector('[data-slot="console-shell"]')).not.toBeNull();
    expect(sidebar?.querySelector('[data-module-id="overview"]')?.textContent).toContain(
      "Overview"
    );
    expect(sidebar?.querySelector('[data-module-id="traffic"]')?.textContent).toContain("Traffic");
    expect(sidebar?.querySelector('[data-module-id="providers"]')?.textContent).toContain(
      "Providers"
    );
    expect(sidebar?.querySelector('[data-module-id="policy"]')?.textContent).toContain("Policy");
    expect(sidebar?.querySelector('[data-module-id="system"]')?.textContent).toContain("System");
    expect(sidebar.querySelector('[data-module-id="providers"]')?.getAttribute("data-active")).toBe(
      "true"
    );
    expect(
      view.container.querySelector('[data-slot="console-screen"]')?.getAttribute("data-screen-id")
    ).toBe("providers-inventory");

    await view.unmount();
  });

  test("switches the lazy screen loader when the console pathname changes", async () => {
    routingState.pathname = "/console/providers/inventory";
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ConsoleApp bootstrap={makeBootstrap("/console/overview")} />
      </NextIntlClientProvider>
    );

    expect(
      view.container.querySelector('[data-slot="console-screen"]')?.getAttribute("data-screen-id")
    ).toBe("providers-inventory");

    routingState.pathname = "/console/system/config";

    await view.rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ConsoleApp bootstrap={makeBootstrap("/console/overview")} />
      </NextIntlClientProvider>
    );

    expect(
      view.container.querySelector('[data-slot="console-screen"]')?.getAttribute("data-screen-id")
    ).toBe("system-config");

    await view.unmount();
  });

  test("bypasses the padded stage for full-bleed console screens", async () => {
    routingState.pathname = "/console/traffic/sessions/session-1/messages";
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ConsoleApp bootstrap={makeBootstrap("/console/overview")} />
      </NextIntlClientProvider>
    );

    expect(
      view.container.querySelector('[data-slot="console-stage"]')?.getAttribute("data-stage-mode")
    ).toBe("full-bleed");
    expect(
      view.container.querySelector('[data-slot="console-screen"]')?.getAttribute("data-screen-id")
    ).toBe("traffic-session-messages");

    await view.unmount();
  });

  test("preloads the target module screen when a nav item is hovered or focused", async () => {
    routingState.pathname = "/console/overview";
    const screenRegistry = await import("@/lib/console/runtime-screen-registry");
    const preloadSpy = vi.spyOn(screenRegistry, "preloadConsoleRuntimeScreen");
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <ConsoleApp bootstrap={makeBootstrap("/console/overview")} />
      </NextIntlClientProvider>
    );

    const providersNav = view.container.querySelector('[data-module-id="providers"]');
    expect(providersNav).not.toBeNull();

    await act(async () => {
      providersNav?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      providersNav?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      await flushPromises();
    });

    expect(preloadSpy).toHaveBeenCalledWith("providers-inventory");
    expect(preloadSpy).toHaveBeenCalledTimes(2);

    await view.unmount();
  });
});
