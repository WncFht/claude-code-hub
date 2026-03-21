"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ProviderDialogFrameProps {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
  closeLabel?: string;
}

export function ProviderDialogFrame({
  children,
  className,
  onClose,
  closeLabel,
}: ProviderDialogFrameProps) {
  return (
    <motion.div
      data-slot="provider-dialog-frame"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className={cn("relative flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <div
        aria-hidden="true"
        data-slot="provider-dialog-glow"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(92,158,118,0.28),transparent_72%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(69,115,92,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(69,115,92,0.12)_1px,transparent_1px)] [background-position:center_center] [background-size:32px_32px]"
      />
      <div
        data-slot="provider-dialog-chrome"
        className="relative z-10 flex items-center justify-between border-b border-white/45 px-6 py-4 dark:border-white/10"
      >
        <div aria-hidden="true" className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary/90 shadow-[0_0_16px_rgba(92,158,118,0.58)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-primary/45" />
          <span className="h-2.5 w-2.5 rounded-full bg-border/90" />
        </div>
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="hidden h-px w-28 bg-gradient-to-r from-primary/45 via-primary/12 to-transparent sm:block"
          />
          {onClose ? (
            <motion.button
              type="button"
              data-slot="provider-dialog-close"
              aria-label={closeLabel}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/78 text-muted-foreground shadow-[0_16px_36px_-28px_rgba(15,23,42,0.42)] transition-colors hover:border-primary/25 hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </motion.button>
          ) : null}
        </div>
      </div>
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </motion.div>
  );
}
