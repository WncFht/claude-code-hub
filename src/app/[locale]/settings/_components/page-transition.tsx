"use client";

import type { ReactNode } from "react";
import { PageStage } from "@/components/page-stage";
import { usePathname } from "@/i18n/routing";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <PageStage activeKey={pathname} className={className}>
      {children}
    </PageStage>
  );
}
