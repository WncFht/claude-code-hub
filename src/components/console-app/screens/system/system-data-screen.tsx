"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { DatabaseExport } from "@/app/[locale]/settings/data/_components/database-export";
import { DatabaseImport } from "@/app/[locale]/settings/data/_components/database-import";
import { DatabaseStatusDisplay } from "@/app/[locale]/settings/data/_components/database-status";
import { LogCleanupPanel } from "@/app/[locale]/settings/data/_components/log-cleanup-panel";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useConsolePreferences } from "../../hooks/use-console-preferences";

export default function SystemDataScreen() {
  const t = useTranslations("settings");
  const [isUsageGuideOpen, setIsUsageGuideOpen] = useConsolePreferences(
    "system-data",
    "usageGuideOpen",
    false
  );

  return (
    <div data-slot="console-screen" data-screen-id="system-data">
      <div data-slot="system-data-screen" className="space-y-4">
        <section data-slot="section" data-title={t("data.section.status.title")}>
          <DatabaseStatusDisplay />
        </section>

        <section data-slot="section" data-title={t("data.section.cleanup.title")}>
          <LogCleanupPanel />
        </section>

        <section data-slot="section" data-title={t("data.section.export.title")}>
          <DatabaseExport />
        </section>

        <section data-slot="section" data-title={t("data.section.import.title")}>
          <DatabaseImport />
        </section>

        <div className="rounded-xl border border-border/50 bg-card/50 p-5 text-card-foreground backdrop-blur-sm transition-colors duration-200 hover:border-border/80">
          <Collapsible open={isUsageGuideOpen} onOpenChange={setIsUsageGuideOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between p-0 hover:bg-transparent"
              >
                <div className="flex items-center gap-2">
                  {isUsageGuideOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <h3 className="text-base font-semibold">{t("data.guide.title")}</h3>
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <strong>{t("data.guide.items.cleanup.title")}</strong>:{" "}
                    {t("data.guide.items.cleanup.description")}
                  </li>
                  <li>
                    <strong>{t("data.guide.items.format.title")}</strong>:{" "}
                    {t("data.guide.items.format.description")}
                  </li>
                  <li>
                    <strong>{t("data.guide.items.overwrite.title")}</strong>:{" "}
                    {t("data.guide.items.overwrite.description")}
                  </li>
                  <li>
                    <strong>{t("data.guide.items.merge.title")}</strong>:{" "}
                    {t("data.guide.items.merge.description")}
                  </li>
                  <li>
                    <strong>{t("data.guide.items.safety.title")}</strong>:{" "}
                    {t("data.guide.items.safety.description")}
                  </li>
                  <li>
                    <strong>{t("data.guide.items.environment.title")}</strong>:{" "}
                    {t("data.guide.items.environment.description")}
                  </li>
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
