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
    <div
      data-slot="provider-dialog-frame"
      className={cn(
        "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.7rem] border border-white/6 bg-[linear-gradient(180deg,rgba(34,49,39,0.94),rgba(37,48,41,0.9))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className
      )}
    >
      {onClose ? (
        <div className="flex justify-end px-5 pt-5 pb-2 sm:px-6 sm:pt-6">
          <motion.button
            type="button"
            data-slot="provider-dialog-close"
            aria-label={closeLabel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/12 text-muted-foreground shadow-[0_16px_36px_-28px_rgba(15,23,42,0.42)] transition-colors hover:border-primary/25 hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      ) : null}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
