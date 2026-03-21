"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ProviderMorphDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  closeLabel: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export function ProviderMorphDialog({
  open,
  onOpenChange,
  trigger,
  children,
  closeLabel,
  triggerClassName,
  contentClassName,
}: ProviderMorphDialogProps) {
  const uniqueId = useId();
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    document.body.classList.add("overflow-hidden");

    const focusFirstElement = () => {
      const contentElement = contentRef.current;
      if (!contentElement) return;

      const focusableElements = contentElement.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      (focusableElements[0] ?? contentElement).focus();
    };

    const frameId = requestAnimationFrame(focusFirstElement);
    const handleKeyDown = (event: KeyboardEvent | globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
        return;
      }

      if (event.key !== "Tab") return;

      const contentElement = contentRef.current;
      if (!contentElement) return;

      const focusableElements = Array.from(
        contentElement.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frameId);
      document.body.classList.remove("overflow-hidden");
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [open, onOpenChange]);

  const triggerNode = open ? (
    <div
      data-slot="provider-morph-dialog-trigger-placeholder"
      className={cn("relative", triggerClassName)}
      style={{ visibility: "hidden", pointerEvents: "none" }}
      aria-hidden="true"
    >
      {trigger}
    </div>
  ) : (
    <motion.div
      ref={triggerRef}
      data-slot="provider-morph-dialog-trigger"
      layoutId={`provider-dialog-${uniqueId}`}
      className={cn("relative cursor-pointer", triggerClassName)}
      role="button"
      tabIndex={0}
      onClick={() => onOpenChange(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenChange(true);
        }
      }}
    >
      {trigger}
    </motion.div>
  );

  return (
    <>
      {triggerNode}

      {mounted
        ? createPortal(
            <AnimatePresence initial={false} mode="sync">
              {open ? (
                <>
                  <motion.button
                    key={`backdrop-${uniqueId}`}
                    type="button"
                    aria-label={closeLabel}
                    className="fixed inset-0 z-50 bg-[rgba(250,252,250,0.34)] backdrop-blur-md dark:bg-[rgba(3,6,4,0.44)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onOpenChange(false)}
                  />
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
                    <motion.div
                      ref={contentRef}
                      data-slot="provider-morph-dialog-content"
                      layoutId={`provider-dialog-${uniqueId}`}
                      role="dialog"
                      aria-modal="true"
                      tabIndex={-1}
                      className={cn("w-full overflow-hidden", contentClassName)}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {children}
                    </motion.div>
                  </div>
                </>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}
