import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { PageHero } from "@/components/page-hero";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type ProvidersModuleTabId = "inventory" | "pricing";

interface ProvidersModulePageProps {
  activeTab: ProvidersModuleTabId;
  inventoryHref: string;
  pricingHref: string;
  actions?: ReactNode;
  children: ReactNode;
}

export async function ProvidersModulePage({
  activeTab,
  inventoryHref,
  pricingHref,
  actions,
  children,
}: ProvidersModulePageProps) {
  const t = await getTranslations("settings");
  const tabs = [
    { id: "inventory" as const, href: inventoryHref, label: t("nav.providers") },
    { id: "pricing" as const, href: pricingHref, label: t("nav.prices") },
  ];

  return (
    <div data-slot="providers-module-page" className="space-y-6">
      <PageHero
        eyebrow={t("providers.operator.eyebrow")}
        title={t("providers.title")}
        description={t("providers.description")}
        actions={actions}
      />

      <div
        data-slot="providers-module-tabs"
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
            {tab.label}
          </Link>
        ))}
      </div>

      <div data-slot="providers-module-content" className="space-y-6">
        {children}
      </div>
    </div>
  );
}
