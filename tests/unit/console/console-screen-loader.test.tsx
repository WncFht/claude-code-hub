/**
 * @vitest-environment happy-dom
 */

import { lazy } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { buildConsoleBootstrap } from "@/lib/console/console-bootstrap";
import { resolveConsoleRuntimeRoute } from "@/lib/console/runtime-route-map";

const suspendedModule = new Promise<{
  default: ({ route }: { route: { screenId: string } }) => JSX.Element;
}>(() => undefined);
const LazyScreen = lazy(() => suspendedModule);

const EagerOverviewScreen = ({ route }: { route: { screenId: string } }) => (
  <div data-slot="eager-screen" data-screen-id={route.screenId} />
);

vi.mock("@/lib/console/runtime-screen-registry", () => ({
  getConsoleRuntimeScreen: (_screenId: string) => ({
    Component: LazyScreen,
    load: async () => {
      throw new Error("not used in this test");
    },
    preload: async () => {
      throw new Error("not used in this test");
    },
  }),
  getConsoleInitialRuntimeScreen: (screenId: string) =>
    screenId === "overview-home" ? EagerOverviewScreen : null,
}));

describe("ConsoleScreenLoader", () => {
  test("renders the initial active screen without the suspense fallback when an eager screen exists", async () => {
    const bootstrap = buildConsoleBootstrap({
      locale: "en",
      pathname: "/console/overview",
      role: "admin",
    });
    const { ConsoleScreenLoader } = await import("@/components/console-app/console-screen-loader");

    const html = renderToString(
      <ConsoleScreenLoader bootstrap={bootstrap} activeRoute={bootstrap.activeRoute} />
    );

    expect(html).toContain('data-slot="eager-screen"');
    expect(html).not.toContain('data-slot="console-screen-fallback"');
  });

  test("keeps the suspense fallback for non-initial or non-eager screens", async () => {
    const bootstrap = buildConsoleBootstrap({
      locale: "en",
      pathname: "/console/overview",
      role: "admin",
    });
    const activeRoute = resolveConsoleRuntimeRoute("/console/traffic/logs");
    const { ConsoleScreenLoader } = await import("@/components/console-app/console-screen-loader");

    expect(activeRoute).not.toBeNull();

    const html = renderToString(
      <ConsoleScreenLoader bootstrap={bootstrap} activeRoute={activeRoute!} />
    );

    expect(html).toContain('data-slot="console-screen-fallback"');
    expect(html).not.toContain('data-slot="eager-screen"');
  });
});
