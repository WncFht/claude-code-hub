"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FilterTable } from "@/app/[locale]/settings/request-filters/_components/filter-table";
import { RequestFiltersTableSkeleton } from "@/app/[locale]/settings/request-filters/_components/request-filters-skeleton";
import { Section } from "@/components/section";
import { getConsoleRequestFiltersData } from "../../adapters/policy-bootstrap";
import { useScreenToolbar } from "../../hooks/use-screen-toolbar";
import { PolicyConsoleTabs } from "./policy-console-tabs";

export default function PolicyRequestFiltersScreen() {
  const t = useTranslations("settings.requestFilters");
  const { data, isLoading } = useQuery({
    queryKey: ["console-policy-request-filters"],
    queryFn: getConsoleRequestFiltersData,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  useScreenToolbar("policy-request-filters", <PolicyConsoleTabs activeTab="request-filters" />);

  return (
    <div data-slot="console-screen" data-screen-id="policy-request-filters">
      <div data-slot="policy-request-filters-screen" className="space-y-4">
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
      </div>
    </div>
  );
}
