import { describe, expect, test } from "vitest";
import { resolveProviderFaviconUrl } from "@/lib/providers/favicon";

describe("resolveProviderFaviconUrl", () => {
  test("filters Google favicon proxy URLs", () => {
    expect(
      resolveProviderFaviconUrl("https://www.google.com/s2/favicons?domain=anthropic.com&sz=32")
    ).toBeNull();
  });

  test("filters gstatic favicon proxy URLs", () => {
    expect(
      resolveProviderFaviconUrl(
        "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&url=http://api.codexcn.com&size=32"
      )
    ).toBeNull();
  });

  test("keeps direct favicon URLs", () => {
    expect(resolveProviderFaviconUrl("https://anthropic.com/favicon.ico")).toBe(
      "https://anthropic.com/favicon.ico"
    );
  });
});
