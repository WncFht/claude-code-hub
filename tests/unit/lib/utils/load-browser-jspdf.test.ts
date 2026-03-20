import { describe, expect, test, vi } from "vitest";

const mockJsPdf = vi.fn();

vi.mock("jspdf/dist/jspdf.es.min.js", () => ({
  jsPDF: mockJsPdf,
}));

describe("loadBrowserJsPdf", () => {
  test("loads the browser-safe jspdf bundle", async () => {
    const { loadBrowserJsPdf } = await import("@/lib/utils/load-browser-jspdf");

    const module = await loadBrowserJsPdf();

    expect(module.jsPDF).toBe(mockJsPdf);
  });
});
