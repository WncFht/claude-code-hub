import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { PageHero } from "@/components/page-hero";

describe("PageHero", () => {
  test("renders eyebrow, title, description, metrics, and actions", () => {
    const html = renderToStaticMarkup(
      <PageHero
        eyebrow="Operator cockpit"
        title="Provider Management"
        description="Keep day-to-day provider operations in one place."
        metrics={[
          { label: "Providers", value: "12" },
          { label: "Attention", value: "2", hint: "Open circuits" },
        ]}
        actions={<button type="button">Refresh</button>}
      />
    );

    expect(html).toContain('data-slot="page-hero"');
    expect(html).toContain("Operator cockpit");
    expect(html).toContain("Provider Management");
    expect(html).toContain("Keep day-to-day provider operations in one place.");
    expect(html).toContain("Providers");
    expect(html).toContain(">12<");
    expect(html).toContain("Open circuits");
    expect(html).toContain("Refresh");
  });
});
