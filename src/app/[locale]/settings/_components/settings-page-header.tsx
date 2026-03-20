import {
  AlertTriangle,
  Bell,
  Database,
  DollarSign,
  FileText,
  Filter,
  type LucideIcon,
  Settings,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icon name type for serialization across server/client boundary
export type PageHeaderIconName =
  | "settings"
  | "database"
  | "file-text"
  | "bell"
  | "shield-alert"
  | "alert-triangle"
  | "filter"
  | "smartphone"
  | "dollar-sign";

// Map icon names to components
const HEADER_ICON_MAP: Record<PageHeaderIconName, LucideIcon> = {
  settings: Settings,
  database: Database,
  "file-text": FileText,
  bell: Bell,
  "shield-alert": ShieldAlert,
  "alert-triangle": AlertTriangle,
  filter: Filter,
  smartphone: Smartphone,
  "dollar-sign": DollarSign,
};

interface SettingsPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: PageHeaderIconName;
  actions?: React.ReactNode;
}

export function SettingsPageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
}: SettingsPageHeaderProps) {
  const Icon = icon ? HEADER_ICON_MAP[icon] : null;

  return (
    <div className="mb-6 md:mb-8">
      <div
        data-slot="settings-page-header"
        className="relative overflow-hidden rounded-[1.85rem] border border-border/70 bg-card/85 px-6 py-6 shadow-[0_28px_90px_-60px_rgba(15,23,42,0.32)] backdrop-blur-xl md:px-8 md:py-7"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,156,127,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(235,206,158,0.14),transparent_26%)]" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            {Icon && (
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-white/60 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:flex dark:border-white/10 dark:bg-white/5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="space-y-2">
              {eyebrow ? (
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                  {eyebrow}
                </div>
              ) : null}
              <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {title}
              </h1>
              {description && (
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-[15px]">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

// Compact header for sub-sections
interface SettingsSectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function SettingsSectionHeader({
  title,
  description,
  icon: Icon,
  iconColor = "text-muted-foreground",
  badge,
  actions,
  className,
}: SettingsSectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/50 bg-white/60 dark:border-white/10 dark:bg-white/5">
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {badge}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
