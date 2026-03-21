"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AddRuleDialog } from "@/app/[locale]/settings/error-rules/_components/add-rule-dialog";
import { ErrorRuleTester } from "@/app/[locale]/settings/error-rules/_components/error-rule-tester";
import { ErrorRulesTableSkeleton } from "@/app/[locale]/settings/error-rules/_components/error-rules-skeleton";
import { RefreshCacheButton } from "@/app/[locale]/settings/error-rules/_components/refresh-cache-button";
import { RuleListTable } from "@/app/[locale]/settings/error-rules/_components/rule-list-table";
import { ConsoleScreenStage } from "@/components/console-app/console-screen-stage";
import { Section } from "@/components/section";
import { getConsoleErrorRulesQueryOptions } from "../../console-screen-query-options";

export default function PolicyErrorRulesScreen() {
  const t = useTranslations("settings");
  const { data, isLoading } = useQuery({
    ...getConsoleErrorRulesQueryOptions(),
    refetchOnWindowFocus: false,
  });

  return (
    <div data-slot="console-screen" data-screen-id="policy-error-rules">
      <ConsoleScreenStage screenId="policy-error-rules" className="space-y-4">
        <Section
          title={t("errorRules.tester.title")}
          description={t("errorRules.tester.description")}
          icon="flask-conical"
          iconColor="text-blue-400"
        >
          <ErrorRuleTester />
        </Section>

        <Section
          title={t("errorRules.section.title")}
          icon="alert-triangle"
          iconColor="text-orange-400"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <RefreshCacheButton stats={data?.cacheStats ?? null} />
              <AddRuleDialog />
            </div>
          }
        >
          {isLoading || !data ? <ErrorRulesTableSkeleton /> : <RuleListTable rules={data.rules} />}
        </Section>
      </ConsoleScreenStage>
    </div>
  );
}
