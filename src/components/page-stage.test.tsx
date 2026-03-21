import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { PageStage } from "@/components/page-stage";

describe("PageStage", () => {
  test("renders page-stage slot and wraps children as staged items", () => {
    const html = renderToStaticMarkup(
      <PageStage activeKey="/dashboard" className="space-y-4">
        <div key="summary">Dashboard body</div>
        <section key="chart">Chart body</section>
      </PageStage>
    );

    expect(html).toContain('data-slot="page-stage"');
    expect(html).toContain("Dashboard body");
    expect(html).toContain("Chart body");
    expect(html).toContain("space-y-4");
    expect((html.match(/data-slot="page-stage-item"/g) ?? []).length).toBe(2);
  });
});
