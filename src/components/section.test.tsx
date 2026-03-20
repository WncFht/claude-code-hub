import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { Section } from "@/components/section";

describe("Section", () => {
  test("renders section slot, copy, actions, and children", () => {
    const html = renderToStaticMarkup(
      <Section
        title="Routing workspace"
        description="Batch edits and filters stay together in one surface."
        actions={<button type="button">Refresh</button>}
      >
        <div>Section content</div>
      </Section>
    );

    expect(html).toContain('data-slot="section"');
    expect(html).toContain("Routing workspace");
    expect(html).toContain("Batch edits and filters stay together in one surface.");
    expect(html).toContain("Refresh");
    expect(html).toContain("Section content");
  });
});
