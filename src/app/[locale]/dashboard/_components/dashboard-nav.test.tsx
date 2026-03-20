/**
 * @vitest-environment happy-dom
 */

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { DashboardNav } from "./dashboard-nav";

const routingMocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: React.ReactNode;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  usePathname: routingMocks.usePathname,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("DashboardNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders nav slot and marks the current dashboard item as active", () => {
    routingMocks.usePathname.mockReturnValue("/dashboard/providers");

    const html = renderToStaticMarkup(
      <DashboardNav
        items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/dashboard/providers", label: "Providers" },
        ]}
      />
    );

    expect(html).toContain('data-slot="dashboard-nav"');
    expect(html).toContain("Dashboard");
    expect(html).toContain("Providers");
    expect(html).toContain("bg-primary/10");
  });
});
