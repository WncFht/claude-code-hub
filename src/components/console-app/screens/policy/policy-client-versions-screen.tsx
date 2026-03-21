"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { SettingsSection } from "@/app/[locale]/settings/_components/ui/settings-ui";
import { ClientVersionStatsTable } from "@/app/[locale]/settings/client-versions/_components/client-version-stats-table";
import { ClientVersionToggle } from "@/app/[locale]/settings/client-versions/_components/client-version-toggle";
import {
  ClientVersionsSettingsSkeleton,
  ClientVersionsTableSkeleton,
} from "@/app/[locale]/settings/client-versions/_components/client-versions-skeleton";
import { getConsoleClientVersionsData } from "../../adapters/policy-bootstrap";

function ClientVersionsEmptyState() {
  const t = useTranslations("settings");

  return (
    <div
      data-slot="policy-client-versions-empty"
      className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] py-12 text-center"
    >
      <p className="text-muted-foreground">{t("clientVersions.empty.title")}</p>
      <p className="mt-2 text-sm text-muted-foreground">{t("clientVersions.empty.description")}</p>
    </div>
  );
}

export default function PolicyClientVersionsScreen() {
  const t = useTranslations("settings");
  const { data, isLoading } = useQuery({
    queryKey: ["console-policy-client-versions"],
    queryFn: getConsoleClientVersionsData,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  return (
    <div data-slot="console-screen" data-screen-id="policy-client-versions">
      <div data-slot="policy-client-versions-screen" className="space-y-4">
        <SettingsSection
          title={t("clientVersions.section.settings.title")}
          description={t("clientVersions.section.settings.description")}
          icon="smartphone"
          iconColor="text-[#E25706]"
          className="space-y-4"
        >
          <div data-slot="policy-client-version-settings">
            {isLoading || !data ? (
              <ClientVersionsSettingsSkeleton />
            ) : (
              <ClientVersionToggle enabled={data.enableClientVersionCheck} />
            )}
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("clientVersions.section.distribution.title")}
          description={t("clientVersions.section.distribution.description")}
          icon="smartphone"
          iconColor="text-[#E25706]"
          className="space-y-4"
        >
          <div data-slot="policy-client-version-stats">
            {isLoading || !data ? (
              <ClientVersionsTableSkeleton />
            ) : data.stats.length > 0 ? (
              <ClientVersionStatsTable data={data.stats} />
            ) : (
              <ClientVersionsEmptyState />
            )}
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
