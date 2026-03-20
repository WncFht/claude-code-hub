"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { PageHero } from "@/components/page-hero";
import { Link } from "@/i18n/routing";
import { type ConsoleRole, getVisibleConsoleModuleTabs } from "@/lib/console/module-registry";
import { cn } from "@/lib/utils";

type SystemModuleTabId = "config" | "data" | "notifications" | "logs";

interface SystemModulePageProps {
  role: ConsoleRole;
  activeTab: SystemModuleTabId;
  children: ReactNode;
}

export function SystemModulePage({ role, activeTab, children }: SystemModulePageProps) {
  const t = useTranslations("settings");
  const tabs = getVisibleConsoleModuleTabs({
    moduleId: "system",
    role,
  });

  return (
    <div data-slot="system-module-page" className="space-y-6">
      <PageHero
        eyebrow={t("system.eyebrow")}
        title={t("system.title")}
        description={t("system.description")}
      />

      <div
        data-slot="system-module-tabs"
        className="flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-border/70 bg-card/80 p-2 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.32)]"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            data-tab-id={tab.id}
            data-active={activeTab === tab.id ? "true" : "false"}
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-primary/20 bg-primary/10 text-foreground"
                : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-background/80 hover:text-foreground"
            )}
          >
            {t(tab.labelKey)}
          </Link>
        ))}
      </div>

      <div data-slot="system-module-content" className="space-y-6">
        {children}
      </div>
    </div>
  );
}
