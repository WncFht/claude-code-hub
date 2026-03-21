"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AddWordDialog } from "@/app/[locale]/settings/sensitive-words/_components/add-word-dialog";
import { RefreshCacheButton } from "@/app/[locale]/settings/sensitive-words/_components/refresh-cache-button";
import { SensitiveWordsTableSkeleton } from "@/app/[locale]/settings/sensitive-words/_components/sensitive-words-skeleton";
import { WordListTable } from "@/app/[locale]/settings/sensitive-words/_components/word-list-table";
import { ConsoleScreenStage } from "@/components/console-app/console-screen-stage";
import { Section } from "@/components/section";
import { getConsoleSensitiveWordsQueryOptions } from "../../console-screen-query-options";

export default function PolicySensitiveWordsScreen() {
  const t = useTranslations("settings");
  const { data, isLoading } = useQuery({
    ...getConsoleSensitiveWordsQueryOptions(),
    refetchOnWindowFocus: false,
  });

  return (
    <div data-slot="console-screen" data-screen-id="policy-sensitive-words">
      <ConsoleScreenStage screenId="policy-sensitive-words" className="space-y-4">
        <Section
          title={t("sensitiveWords.section.title")}
          description={t("sensitiveWords.section.description")}
          icon="shield-alert"
          iconColor="text-primary"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <RefreshCacheButton stats={data?.cacheStats ?? null} />
              <AddWordDialog />
            </div>
          }
        >
          {isLoading || !data ? (
            <SensitiveWordsTableSkeleton />
          ) : (
            <WordListTable words={data.words} />
          )}
        </Section>
      </ConsoleScreenStage>
    </div>
  );
}
