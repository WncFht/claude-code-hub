"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { mapLegacyConsolePath } from "@/lib/console/legacy-route-map";
import { getVisibleConsoleModuleTabs } from "@/lib/console/module-registry";
import { cn } from "@/lib/utils";

interface PolicyConsoleTabsProps {
  activeTab: "sensitive-words" | "error-rules" | "request-filters" | "client-versions";
}

export function PolicyConsoleTabs({ activeTab }: PolicyConsoleTabsProps) {
  const t = useTranslations("settings");
  const tabs = getVisibleConsoleModuleTabs({
    moduleId: "policy",
    role: "admin",
  });

  return (
    <div
      data-slot="policy-console-tabs"
      className="flex flex-wrap items-center gap-2 rounded-[20px]"
    >
      {tabs.map((tab) => {
        const href = mapLegacyConsolePath(tab.href) ?? tab.href;
        const isActive = activeTab === tab.id;

        return (
          <Link
            key={tab.id}
            href={href}
            data-tab-id={tab.id}
            data-active={isActive ? "true" : "false"}
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary/25 bg-primary/10 text-foreground"
                : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-background/80 hover:text-foreground"
            )}
          >
            {t(tab.labelKey)}
          </Link>
        );
      })}
    </div>
  );
}
