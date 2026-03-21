"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ModelPriceDrawer } from "@/app/[locale]/settings/prices/_components/model-price-drawer";
import { PriceList } from "@/app/[locale]/settings/prices/_components/price-list";
import { PricesSkeleton } from "@/app/[locale]/settings/prices/_components/prices-skeleton";
import { SyncLiteLLMButton } from "@/app/[locale]/settings/prices/_components/sync-litellm-button";
import { UploadPriceDialog } from "@/app/[locale]/settings/prices/_components/upload-price-dialog";
import { ConsoleScreenStage } from "@/components/console-app/console-screen-stage";
import { getConsolePricesPageQueryOptions } from "../../console-screen-query-options";
import { useScreenToolbar } from "../../hooks/use-screen-toolbar";

export default function ProvidersPricingScreen() {
  const t = useTranslations("settings");
  const { data, isLoading } = useQuery({
    ...getConsolePricesPageQueryOptions(),
    refetchOnWindowFocus: false,
  });

  useScreenToolbar(
    "providers-pricing",
    <div className="flex flex-wrap items-center gap-2">
      <ModelPriceDrawer mode="create" />
      <SyncLiteLLMButton />
      <UploadPriceDialog defaultOpen={false} isRequired={false} />
    </div>
  );

  if (isLoading || !data) {
    return (
      <div data-slot="console-screen" data-screen-id="providers-pricing">
        <ConsoleScreenStage screenId="providers-pricing">
          <PricesSkeleton />
        </ConsoleScreenStage>
      </div>
    );
  }

  return (
    <div data-slot="console-screen" data-screen-id="providers-pricing">
      <ConsoleScreenStage screenId="providers-pricing" className="space-y-4">
        <section data-slot="section" data-title={t("prices.section.title")}>
          <PriceList
            initialPrices={data.data as never[]}
            initialTotal={data.total}
            initialPage={data.page}
            initialPageSize={data.pageSize}
            initialSearchTerm=""
            initialSourceFilter=""
            initialLitellmProviderFilter=""
          />
        </section>
      </ConsoleScreenStage>
    </div>
  );
}
