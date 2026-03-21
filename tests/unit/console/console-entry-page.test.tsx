/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

const routingMocks = vi.hoisted(() => ({
  redirect: vi.fn(({ href, locale }: { href: string; locale: string }) => ({ href, locale })),
}));

vi.mock("@/lib/auth", () => authMocks);

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
  redirect: routingMocks.redirect,
  usePathname: () => undefined,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

function makeAsyncParams(locale: string, slug?: string[]) {
  return Promise.resolve({ locale, slug }) as Promise<{ locale: string; slug?: string[] }>;
}

function makeSession({
  role = "admin",
  canLoginWebUi = true,
}: {
  role?: "admin" | "user";
  canLoginWebUi?: boolean;
}) {
  return {
    user: {
      id: 1,
      name: "tester",
      description: "",
      role,
      rpm: null,
      dailyQuota: null,
      providerGroup: null,
      tags: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      dailyResetMode: "fixed" as const,
      dailyResetTime: "00:00",
      isEnabled: true,
    },
    key: {
      canLoginWebUi,
    },
  };
}

describe("console entry page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("redirects unauthenticated visitors to login with the console target", async () => {
    authMocks.getSession.mockResolvedValue(null);

    const ConsoleEntryPage = (await import("@/app/[locale]/console/[[...slug]]/page")).default;
    await ConsoleEntryPage({
      params: makeAsyncParams("en", ["traffic", "logs"]),
    });

    expect(routingMocks.redirect).toHaveBeenCalledWith({
      href: "/login?from=/console/traffic/logs",
      locale: "en",
    });
  });

  test("keeps non-web-ui users on my-usage instead of mounting the console", async () => {
    authMocks.getSession.mockResolvedValue(makeSession({ role: "user", canLoginWebUi: false }));

    const ConsoleEntryPage = (await import("@/app/[locale]/console/[[...slug]]/page")).default;
    await ConsoleEntryPage({
      params: makeAsyncParams("en", ["overview"]),
    });

    expect(routingMocks.redirect).toHaveBeenCalledWith({
      href: "/my-usage",
      locale: "en",
    });
  });

  test("normalizes admin-only screens back to the user's default console screen", async () => {
    authMocks.getSession.mockResolvedValue(makeSession({ role: "user", canLoginWebUi: true }));

    const ConsoleEntryPage = (await import("@/app/[locale]/console/[[...slug]]/page")).default;
    const html = renderToStaticMarkup(
      await ConsoleEntryPage({
        params: makeAsyncParams("en", ["system", "config"]),
      })
    );

    expect(routingMocks.redirect).not.toHaveBeenCalled();
    expect(html).toContain('data-slot="console-entry"');
    expect(html).toContain('data-current-path="/console/overview"');
    expect(html).toContain('data-screen-id="overview-home"');
  });

  test("renders bootstrap payload metadata for valid console slugs", async () => {
    authMocks.getSession.mockResolvedValue(makeSession({ role: "admin", canLoginWebUi: true }));

    const ConsoleEntryPage = (await import("@/app/[locale]/console/[[...slug]]/page")).default;
    const html = renderToStaticMarkup(
      await ConsoleEntryPage({
        params: makeAsyncParams("en", ["traffic", "logs"]),
      })
    );

    expect(html).toContain('data-slot="console-entry"');
    expect(html).toContain('data-current-path="/console/traffic/logs"');
    expect(html).toContain('data-screen-id="traffic-logs"');
    expect(html).toContain('data-module-id="traffic"');
  });

  test("normalizes invalid slugs to the allowed default screen", async () => {
    authMocks.getSession.mockResolvedValue(makeSession({ role: "admin", canLoginWebUi: true }));

    const ConsoleEntryPage = (await import("@/app/[locale]/console/[[...slug]]/page")).default;
    const html = renderToStaticMarkup(
      await ConsoleEntryPage({
        params: makeAsyncParams("en", ["not-real"]),
      })
    );

    expect(html).toContain('data-current-path="/console/overview"');
    expect(html).toContain('data-screen-id="overview-home"');
  });
});
