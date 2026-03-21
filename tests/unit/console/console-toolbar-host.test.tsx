/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  ConsoleToolbarHost,
  ConsoleToolbarProvider,
} from "@/components/console-app/console-toolbar-host";
import { useConsolePreferences } from "@/components/console-app/hooks/use-console-preferences";
import { useScreenToolbar } from "@/components/console-app/hooks/use-screen-toolbar";

type ActiveScreenId = "providers-inventory" | "system-config" | "system-logs";

function createStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
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

function ProvidersInventoryScreen() {
  const [viewMode, setViewMode] = useConsolePreferences("providers-inventory", "viewMode", "grid");

  useScreenToolbar(
    "providers-inventory",
    <div data-slot="providers-toolbar" data-view-mode={viewMode}>
      Providers toolbar
    </div>
  );

  return (
    <div data-slot="providers-screen" data-view-mode={viewMode}>
      <button
        type="button"
        data-action="toggle-view-mode"
        onClick={() => setViewMode((current) => (current === "grid" ? "list" : "grid"))}
      >
        Toggle view
      </button>
    </div>
  );
}

function SystemConfigScreen() {
  const [sortBy, setSortBy] = useConsolePreferences("system-config", "sortBy", "latency");

  useScreenToolbar(
    "system-config",
    <div data-slot="system-toolbar" data-sort-by={sortBy}>
      System toolbar
    </div>
  );

  return (
    <div data-slot="system-screen" data-sort-by={sortBy}>
      <button
        type="button"
        data-action="toggle-sort-order"
        onClick={() => setSortBy((current) => (current === "latency" ? "alpha" : "latency"))}
      >
        Toggle sort
      </button>
    </div>
  );
}

function SystemLogsScreen() {
  return <div data-slot="system-logs-screen">Logs</div>;
}

function ToolbarHarness({ activeScreenId }: { activeScreenId: ActiveScreenId }) {
  return (
    <ConsoleToolbarProvider>
      <ConsoleToolbarHost activeScreenId={activeScreenId} />

      {activeScreenId === "providers-inventory" ? <ProvidersInventoryScreen /> : null}
      {activeScreenId === "system-config" ? <SystemConfigScreen /> : null}
      {activeScreenId === "system-logs" ? <SystemLogsScreen /> : null}
    </ConsoleToolbarProvider>
  );
}

describe("ConsoleToolbarHost", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createStorageMock(),
    });
    document.body.innerHTML = "";
    window.localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
  });

  test("renders declarative toolbar content and swaps it when the active screen changes", async () => {
    const view = await render(<ToolbarHarness activeScreenId="providers-inventory" />);

    expect(view.container.querySelector('[data-slot="console-toolbar-host"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="providers-toolbar"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="system-toolbar"]')).toBeNull();

    await view.rerender(<ToolbarHarness activeScreenId="system-config" />);

    expect(view.container.querySelector('[data-slot="providers-toolbar"]')).toBeNull();
    expect(view.container.querySelector('[data-slot="system-toolbar"]')).not.toBeNull();

    await view.unmount();
  });

  test("persists screen preferences across screen switches", async () => {
    const view = await render(<ToolbarHarness activeScreenId="providers-inventory" />);

    const toggleViewButton = view.container.querySelector(
      '[data-action="toggle-view-mode"]'
    ) as HTMLButtonElement | null;

    await act(async () => {
      toggleViewButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushPromises();
    });

    expect(
      view.container.querySelector('[data-slot="providers-screen"]')?.getAttribute("data-view-mode")
    ).toBe("list");

    await view.rerender(<ToolbarHarness activeScreenId="system-config" />);

    const toggleSortButton = view.container.querySelector(
      '[data-action="toggle-sort-order"]'
    ) as HTMLButtonElement | null;

    await act(async () => {
      toggleSortButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await flushPromises();
    });

    expect(
      view.container.querySelector('[data-slot="system-screen"]')?.getAttribute("data-sort-by")
    ).toBe("alpha");

    await view.rerender(<ToolbarHarness activeScreenId="providers-inventory" />);

    expect(
      view.container.querySelector('[data-slot="providers-screen"]')?.getAttribute("data-view-mode")
    ).toBe("list");
    expect(
      view.container
        .querySelector('[data-slot="providers-toolbar"]')
        ?.getAttribute("data-view-mode")
    ).toBe("list");

    await view.rerender(<ToolbarHarness activeScreenId="system-config" />);

    expect(
      view.container.querySelector('[data-slot="system-screen"]')?.getAttribute("data-sort-by")
    ).toBe("alpha");
    expect(
      view.container.querySelector('[data-slot="system-toolbar"]')?.getAttribute("data-sort-by")
    ).toBe("alpha");

    await view.unmount();
  });

  test("leaves the host empty when the active screen does not register toolbar content", async () => {
    const view = await render(<ToolbarHarness activeScreenId="system-logs" />);

    expect(view.container.querySelector('[data-slot="console-toolbar-host"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="console-toolbar-content"]')).toBeNull();
    expect(view.container.querySelector('[data-slot="system-logs-screen"]')).not.toBeNull();

    await view.unmount();
  });
});
