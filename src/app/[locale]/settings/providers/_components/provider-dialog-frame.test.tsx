import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import { ProviderDialogFrame } from "./provider-dialog-frame";

describe("ProviderDialogFrame", () => {
  test("renders the provider dialog chrome slots and child content", () => {
    const html = renderToStaticMarkup(
      <ProviderDialogFrame>
        <div>Provider form body</div>
      </ProviderDialogFrame>
    );

    expect(html).toContain('data-slot="provider-dialog-frame"');
    expect(html).toContain('data-slot="provider-dialog-glow"');
    expect(html).toContain('data-slot="provider-dialog-chrome"');
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

  test("uses a vertical-only entry motion without scale blur", () => {
    const html = renderToStaticMarkup(
      <ProviderDialogFrame>
        <div>Provider form body</div>
      </ProviderDialogFrame>
    );

    expect(html).toContain("translateY(20px)");
    expect(html).not.toContain("scale(");
  });
});
