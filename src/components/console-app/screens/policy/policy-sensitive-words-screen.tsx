"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AddWordDialog } from "@/app/[locale]/settings/sensitive-words/_components/add-word-dialog";
import { RefreshCacheButton } from "@/app/[locale]/settings/sensitive-words/_components/refresh-cache-button";
import { SensitiveWordsTableSkeleton } from "@/app/[locale]/settings/sensitive-words/_components/sensitive-words-skeleton";
import { WordListTable } from "@/app/[locale]/settings/sensitive-words/_components/word-list-table";
import { Section } from "@/components/section";
import { getConsoleSensitiveWordsData } from "../../adapters/policy-bootstrap";
import { useScreenToolbar } from "../../hooks/use-screen-toolbar";
import { PolicyConsoleTabs } from "./policy-console-tabs";

export default function PolicySensitiveWordsScreen() {
  const t = useTranslations("settings");
  const { data, isLoading } = useQuery({
    queryKey: ["console-policy-sensitive-words"],
    queryFn: getConsoleSensitiveWordsData,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  useScreenToolbar("policy-sensitive-words", <PolicyConsoleTabs activeTab="sensitive-words" />);

  return (
    <div data-slot="console-screen" data-screen-id="policy-sensitive-words">
      <div data-slot="policy-sensitive-words-screen" className="space-y-4">
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
      </div>
    </div>
  );
}
