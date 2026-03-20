"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <motion.div
      data-slot="page-transition"
      key={pathname}
      className={cn(className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 30,
      }}
    >
      {children}
    </motion.div>
  );
}
