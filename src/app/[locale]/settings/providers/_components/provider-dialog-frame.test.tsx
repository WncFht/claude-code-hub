import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { ProviderDialogFrame } from "./provider-dialog-frame";

describe("ProviderDialogFrame", () => {
  test("renders a clean provider dialog shell without faux window chrome", () => {
    const html = renderToStaticMarkup(
      <ProviderDialogFrame>
        <div>Provider form body</div>
      </ProviderDialogFrame>
    );

    expect(html).toContain('data-slot="provider-dialog-frame"');
    expect(html).not.toContain('data-slot="provider-dialog-glow"');
    expect(html).not.toContain('data-slot="provider-dialog-chrome"');
    expect(html).toContain("Provider form body");
  });

  test("renders a visible close button when an onClose handler is provided", () => {
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <ProviderDialogFrame onClose={onClose} closeLabel="Close provider dialog">
        <div>Provider form body</div>
      </ProviderDialogFrame>
    );

    expect(html).toContain('data-slot="provider-dialog-close"');
    expect(html).toContain("Close provider dialog");
  });

  test("does not declare a second entry animation on top of the morph dialog", () => {
    const html = renderToStaticMarkup(
      <ProviderDialogFrame>
        <div>Provider form body</div>
      </ProviderDialogFrame>
    );

    expect(html).not.toContain("translateY(");
    expect(html).not.toContain("scale(");
    expect(html).not.toContain("opacity:0");
  });
});
