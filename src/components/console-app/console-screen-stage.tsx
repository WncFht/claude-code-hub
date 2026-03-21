"use client";

import type { ComponentProps, ReactNode } from "react";
import { PageStage } from "@/components/page-stage";

interface ConsoleScreenStageProps extends Omit<ComponentProps<typeof PageStage>, "activeKey"> {
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
