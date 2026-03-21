import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

describe("RootLayout theme shell", () => {
  test("does not hardcode the html element to light mode", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "src/app/[locale]/layout.tsx"), "utf8");

    expect(source).not.toContain('className="light"');
    expect(source).not.toContain('colorScheme: "light"');
  });
});
