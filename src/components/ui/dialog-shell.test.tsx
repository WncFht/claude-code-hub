/**
 * @vitest-environment happy-dom
 */

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

describe("Dialog shell", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("renders the refreshed dialog surface classes", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <Dialog open>
          <DialogContent>
            <VisuallyHidden>
              <div>
                <DialogTitle>Dialog title</DialogTitle>
                <DialogDescription>Dialog description</DialogDescription>
              </div>
            </VisuallyHidden>
            Dialog body
          </DialogContent>
        </Dialog>
      );
    });

    const content = document.querySelector('[data-slot="dialog-content"]');
    expect(content).toBeTruthy();
    expect(content?.className).toContain("rounded-[1.85rem]");
    expect(content?.className).toContain("backdrop-blur-xl");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
