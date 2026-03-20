import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { SettingsPageHeader } from "./settings-page-header";

describe("SettingsPageHeader", () => {
  test("renders header slot, eyebrow, title, description, and actions", () => {
    const html = renderToStaticMarkup(
      <SettingsPageHeader
        eyebrow="System"
        title="Provider Management"
        description="Shape how operators inspect and edit providers."
        actions={<button type="button">Export</button>}
      />
    );

    expect(html).toContain('data-slot="settings-page-header"');
    expect(html).toContain("System");
    expect(html).toContain("Provider Management");
    expect(html).toContain("Shape how operators inspect and edit providers.");
    expect(html).toContain("Export");
  });
});
