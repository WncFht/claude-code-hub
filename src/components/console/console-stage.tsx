import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ConsoleStageProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  fullBleed?: boolean;
}

export function ConsoleStage({
  children,
  className,
  contentClassName,
  fullBleed = false,
}: ConsoleStageProps) {
  return (
    <main
      data-slot="console-stage"
      data-stage-mode={fullBleed ? "full-bleed" : "padded"}
      className={cn("flex-1", fullBleed && "overflow-hidden", className)}
    >
      <div
        data-slot="console-stage-body"
        className={cn(
          fullBleed ? "h-full w-full" : "mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8",
          contentClassName
        )}
      >
        {children}
      </div>
    </main>
  );
}
