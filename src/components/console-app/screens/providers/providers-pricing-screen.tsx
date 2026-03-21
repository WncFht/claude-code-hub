"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ModelPriceDrawer } from "@/app/[locale]/settings/prices/_components/model-price-drawer";
import { PriceList } from "@/app/[locale]/settings/prices/_components/price-list";
import { PricesSkeleton } from "@/app/[locale]/settings/prices/_components/prices-skeleton";
import { SyncLiteLLMButton } from "@/app/[locale]/settings/prices/_components/sync-litellm-button";
import { UploadPriceDialog } from "@/app/[locale]/settings/prices/_components/upload-price-dialog";
import { useScreenToolbar } from "../../hooks/use-screen-toolbar";

interface PricesPagePayload {
  data: unknown[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchPricesPage(): Promise<PricesPagePayload> {
  const response = await fetch("/api/prices?page=1&pageSize=50");

  if (!response.ok) {
    throw new Error("FETCH_PRICES_FAILED");
  }

  const result = (await response.json()) as {
    ok: boolean;
    data?: PricesPagePayload;
    error?: string;
  };

  if (!result.ok || !result.data) {
    throw new Error(result.error || "FETCH_PRICES_FAILED");
  }

  return result.data;
}

export default function ProvidersPricingScreen() {
  const t = useTranslations("settings");
  const { data, isLoading } = useQuery({
    queryKey: ["console-prices-page"],
    queryFn: fetchPricesPage,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
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
        <div data-slot="providers-pricing-screen">
          <PricesSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div data-slot="console-screen" data-screen-id="providers-pricing">
      <div data-slot="providers-pricing-screen" className="space-y-4">
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
      </div>
    </div>
  );
}
