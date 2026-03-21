"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  Database,
  DollarSign,
  Download,
  FileText,
  Filter,
  FlaskConical,
  HardDrive,
  Link2,
  type LucideIcon,
  Power,
  Settings,
  ShieldAlert,
  Smartphone,
  Trash2,
  TrendingUp,
  Upload,
  Webhook,
} from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";

// Icon name type for serialization across server/client boundary
export type SectionIconName =
  | "settings"
  | "trash"
  | "database"
  | "hard-drive"
  | "download"
  | "upload"
  | "file-text"
  | "bell"
  | "webhook"
  | "shield-alert"
  | "alert-triangle"
  | "filter"
  | "smartphone"
  | "dollar-sign"
  | "link"
  | "power"
  | "trending-up"
  | "flask-conical";

// Map icon names to components (client-side only)
const SECTION_ICON_MAP: Record<SectionIconName, LucideIcon> = {
  settings: Settings,
  trash: Trash2,
  database: Database,
  "hard-drive": HardDrive,
  download: Download,
  upload: Upload,
  "file-text": FileText,
  bell: Bell,
  webhook: Webhook,
  "shield-alert": ShieldAlert,
  "alert-triangle": AlertTriangle,
  filter: Filter,
  smartphone: Smartphone,
  "dollar-sign": DollarSign,
  link: Link2,
  power: Power,
  "trending-up": TrendingUp,
  "flask-conical": FlaskConical,
};

export type SectionProps = {
  title?: string;
  description?: string;
  icon?: SectionIconName;
  iconColor?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "highlight" | "warning";
  noPadding?: boolean;
};

export function Section({
  title,
  description,
  icon,
  iconColor = "text-primary",
  actions,
  children,
  className,
  variant = "default",
  noPadding,
}: SectionProps) {
  const variantStyles = {
    default:
      "border-border/65 bg-card/88 shadow-[0_28px_90px_-62px_rgba(8,22,15,0.45)] hover:border-border/90",
    highlight:
      "border-primary/25 bg-[linear-gradient(135deg,rgba(70,96,77,0.18),rgba(255,255,255,0.88))] shadow-[0_28px_90px_-58px_rgba(58,96,69,0.45)] hover:border-primary/35 dark:bg-[linear-gradient(135deg,rgba(90,146,103,0.12),rgba(34,45,39,0.86))]",
    warning:
      "border-amber-300/40 bg-[linear-gradient(135deg,rgba(255,247,221,0.92),rgba(245,252,246,0.84))] shadow-[0_28px_90px_-64px_rgba(92,118,83,0.28)] hover:border-amber-400/50 dark:border-amber-800/70 dark:bg-amber-950/25",
  };

  const Icon = icon ? SECTION_ICON_MAP[icon] : null;

  return (
    <motion.section
      data-slot="section"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border backdrop-blur-xl transition-[border-color,transform,box-shadow] duration-200",
        variantStyles[variant],
        !noPadding && "p-5 md:p-6 lg:p-7",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(117,180,132,0.1),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(77,109,91,0.12),transparent_28%)]" />

      <div className="relative z-10">
        {(title || description || Icon || actions) && (
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              {Icon && (
                <div
                  className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/50 bg-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-white/10 dark:bg-white/5"
                  )}
                >
                  <Icon className={cn("h-4 w-4", iconColor)} />
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h2 className="text-base font-semibold tracking-tight text-foreground md:text-lg">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </motion.section>
  );
}

// Legacy support - simple section without animation
export function SectionStatic({
  title,
  description,
  actions,
  children,
  className,
}: Omit<SectionProps, "icon" | "iconColor" | "variant" | "noPadding">) {
  return (
    <section
      data-slot="section"
      className={cn(
        "rounded-[1.75rem] border border-border/65 bg-card/88 p-5 shadow-[0_28px_90px_-62px_rgba(8,22,15,0.45)] transition-[border-color,transform,box-shadow] duration-200 hover:border-border/90 md:p-6 lg:p-7",
        className
      )}
    >
      {(title || description || actions) && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
