"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardStageProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: "bare" | "surface";
}

export function DashboardStage({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  variant = "bare",
}: DashboardStageProps) {
  const isBare = variant === "bare";

  return (
    <section
      data-slot="dashboard-stage"
      className={cn(
        isBare
          ? "space-y-4"
          : "relative overflow-hidden rounded-[2rem] border border-border/65 bg-card/82 px-4 py-4 shadow-[0_28px_90px_-62px_rgba(8,22,15,0.45)] backdrop-blur-xl md:px-5 md:py-5 lg:px-6 lg:py-6",
        className
      )}
    >
      {!isBare ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(108,156,126,0.13),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(60,92,75,0.16),transparent_24%)]" />
      ) : null}
      <div className={cn("relative z-10 space-y-4", isBare && "space-y-3")}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
            {description ? (
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}
