import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getCacheStats, listSensitiveWords } from "@/actions/sensitive-words";
import { Section } from "@/components/section";
import { Skeleton } from "@/components/ui/skeleton";
import { PolicyModulePage } from "../_components/policy-module-page";
import { AddWordDialog } from "./_components/add-word-dialog";
import { RefreshCacheButton } from "./_components/refresh-cache-button";
import { SensitiveWordsTableSkeleton } from "./_components/sensitive-words-skeleton";
import { WordListTable } from "./_components/word-list-table";

export const dynamic = "force-dynamic";

export default async function SensitiveWordsPage() {
  const t = await getTranslations("settings");

  return (
    <PolicyModulePage role="admin" activeTab="sensitive-words">
      <Section
        title={t("sensitiveWords.section.title")}
        description={t("sensitiveWords.section.description")}
        icon="shield-alert"
        iconColor="text-primary"
        variant="default"
        actions={
          <div className="flex gap-2">
            <Suspense fallback={<Skeleton className="h-9 w-24" />}>
              <SensitiveWordsRefreshAction />
            </Suspense>
            <AddWordDialog />
          </div>
        }
      >
        <Suspense fallback={<SensitiveWordsTableSkeleton />}>
          <SensitiveWordsTableContent />
        </Suspense>
      </Section>
    </PolicyModulePage>
  );
}

async function SensitiveWordsRefreshAction() {
  const cacheStats = await getCacheStats();
  return <RefreshCacheButton stats={cacheStats} />;
}

async function SensitiveWordsTableContent() {
  const words = await listSensitiveWords();
  return <WordListTable words={words} />;
}
