/**
 * @vitest-environment happy-dom
 */

import { useState } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { ProviderDialogFrame } from "./provider-dialog-frame";
import { ProviderMorphDialog } from "./provider-morph-dialog";

function TestDialog() {
  const [open, setOpen] = useState(false);

  return (
    <ProviderMorphDialog
      open={open}
      onOpenChange={setOpen}
      closeLabel="Close"
      trigger={<button type="button">Open provider</button>}
    >
      <div>Provider dialog body</div>
    </ProviderMorphDialog>
  );
}

function TestDialogWithFrameClose() {
  const [open, setOpen] = useState(false);

  return (
    <ProviderMorphDialog
      open={open}
      onOpenChange={setOpen}
      closeLabel="Close"
      trigger={<button type="button">Open provider</button>}
    >
      <ProviderDialogFrame onClose={() => setOpen(false)} closeLabel="Close provider">
        <div>Provider dialog body</div>
      </ProviderDialogFrame>
    </ProviderMorphDialog>
  );
}

describe("ProviderMorphDialog", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("opens portaled content and keeps a hidden trigger placeholder while open", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<TestDialog />);
    });

    const trigger = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Open provider")
    );
    expect(trigger).toBeTruthy();

    act(() => {
      trigger?.click();
    });

    const dialogContent = document.body.querySelector(
      '[data-slot="provider-morph-dialog-content"]'
    ) as HTMLDivElement | null;
    expect(dialogContent).toBeTruthy();
    expect(
      container.querySelector('[data-slot="provider-morph-dialog-trigger-placeholder"]')
    ).toBeTruthy();
    expect(document.body.textContent).toContain("Provider dialog body");
    expect(dialogContent?.getAttribute("style") ?? "").not.toContain("border-radius");

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test("closes the dialog from the morphed frame close button", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(<TestDialogWithFrameClose />);
    });

    const trigger = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Open provider")
    );
    expect(trigger).toBeTruthy();

    act(() => {
      trigger?.click();
    });

    const closeButton = document.body.querySelector(
      '[data-slot="provider-dialog-close"]'
    ) as HTMLButtonElement | null;
    expect(closeButton).toBeTruthy();
    expect(closeButton?.getAttribute("aria-label")).toBe("Close provider");

    act(() => {
      closeButton?.click();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(
      container.querySelector('[data-slot="provider-morph-dialog-trigger-placeholder"]')
    ).toBeNull();
    expect(container.querySelector('[data-slot="provider-morph-dialog-trigger"]')).toBeTruthy();
    expect(document.body.classList.contains("overflow-hidden")).toBe(false);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
