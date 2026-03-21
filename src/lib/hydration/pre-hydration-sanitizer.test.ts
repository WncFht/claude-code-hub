/**
 * @vitest-environment happy-dom
 */

import { describe, expect, test } from "vitest";
import { sanitizeHydrationExtensionArtifacts } from "@/lib/hydration/pre-hydration-sanitizer";

describe("sanitizeHydrationExtensionArtifacts", () => {
  test("removes DarkReader inline attributes before hydration without stripping normal styles", () => {
    document.body.innerHTML = `
      <svg
        data-testid="icon"
        data-darkreader-inline-stroke=""
        style="color: red; --darkreader-inline-stroke: currentColor;"
      ></svg>
    `;

    sanitizeHydrationExtensionArtifacts(document);

    const icon = document.querySelector('[data-testid="icon"]');
    expect(icon?.getAttribute("data-darkreader-inline-stroke")).toBeNull();
    expect(icon?.getAttribute("style")).toContain("color: red");
    expect(icon?.getAttribute("style")).not.toContain("--darkreader-inline-stroke");
  });

  test("removes empty style attributes after cleaning extension-only variables", () => {
    document.body.innerHTML = `
      <svg
        data-testid="icon"
        data-darkreader-inline-fill=""
        style="--darkreader-inline-fill: currentColor;"
      ></svg>
    `;

    sanitizeHydrationExtensionArtifacts(document);

    const icon = document.querySelector('[data-testid="icon"]');
    expect(icon?.getAttribute("data-darkreader-inline-fill")).toBeNull();
    expect(icon?.getAttribute("style")).toBeNull();
  });

  test("removes DarkReader root attributes from the html element", () => {
    document.documentElement.setAttribute("data-darkreader-mode", "dynamic");
    document.documentElement.setAttribute("data-darkreader-scheme", "dark");
    document.documentElement.setAttribute("data-darkreader-proxy-injected", "true");

    sanitizeHydrationExtensionArtifacts(document);

    expect(document.documentElement.getAttribute("data-darkreader-mode")).toBeNull();
    expect(document.documentElement.getAttribute("data-darkreader-scheme")).toBeNull();
    expect(document.documentElement.getAttribute("data-darkreader-proxy-injected")).toBeNull();
  });
});
