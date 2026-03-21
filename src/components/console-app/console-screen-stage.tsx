"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { PageStage } from "@/components/page-stage";

interface ConsoleScreenStageProps extends HTMLAttributes<HTMLDivElement> {
  screenId: string;
  children: ReactNode;
}

export function ConsoleScreenStage({ screenId, children, ...rest }: ConsoleScreenStageProps) {
  return (
    <PageStage activeKey={screenId} {...rest}>
      {children}
    </PageStage>
  );
}
