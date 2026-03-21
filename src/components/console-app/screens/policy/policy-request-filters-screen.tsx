"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FilterTable } from "@/app/[locale]/settings/request-filters/_components/filter-table";
import { RequestFiltersTableSkeleton } from "@/app/[locale]/settings/request-filters/_components/request-filters-skeleton";
import { ConsoleScreenStage } from "@/components/console-app/console-screen-stage";
import { Section } from "@/components/section";
import { getConsoleRequestFiltersQueryOptions } from "../../console-screen-query-options";

export default function PolicyRequestFiltersScreen() {
  const t = useTranslations("settings.requestFilters");
  const { data, isLoading } = useQuery({
    ...getConsoleRequestFiltersQueryOptions(),
    refetchOnWindowFocus: false,
  });

  return (
    <div data-slot="console-screen" data-screen-id="policy-request-filters">
      <ConsoleScreenStage screenId="policy-request-filters" className="space-y-4">
        <Section
          title={t("title")}
          description={t("description")}
          icon="filter"
          iconColor="text-[#E25706]"
        >
          {isLoading || !data ? (
            <RequestFiltersTableSkeleton />
          ) : (
            <FilterTable filters={data.filters} providers={data.providers} />
          )}
        </Section>
      </ConsoleScreenStage>
    </div>
  );
}
