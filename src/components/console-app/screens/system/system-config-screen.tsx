"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AutoCleanupForm } from "@/app/[locale]/settings/config/_components/auto-cleanup-form";
import { SettingsConfigSkeleton } from "@/app/[locale]/settings/config/_components/settings-config-skeleton";
import { SystemSettingsForm } from "@/app/[locale]/settings/config/_components/system-settings-form";
import { ConsoleScreenStage } from "@/components/console-app/console-screen-stage";
import { Button } from "@/components/ui/button";
import { getConsoleSystemSettingsQueryOptions } from "../../console-screen-query-options";
import { useScreenToolbar } from "../../hooks/use-screen-toolbar";

const SYSTEM_CONFIG_FORM_ID = "console-system-config-form";

export default function SystemConfigScreen() {
  const t = useTranslations("settings");
  const tForm = useTranslations("settings.config.form");
  const { data: settings, isLoading } = useQuery({
    ...getConsoleSystemSettingsQueryOptions(),
    refetchOnWindowFocus: false,
  });

  useScreenToolbar(
    "system-config",
    <Button type="submit" form={SYSTEM_CONFIG_FORM_ID} data-action="system-config-submit">
      {tForm("saveSettings")}
    </Button>
  );

  if (isLoading || !settings) {
    return (
      <div data-slot="console-screen" data-screen-id="system-config">
        <ConsoleScreenStage screenId="system-config" data-slot="system-config-screen">
          <SettingsConfigSkeleton />
        </ConsoleScreenStage>
      </div>
    );
  }

  return (
    <div data-slot="console-screen" data-screen-id="system-config">
      <ConsoleScreenStage
        screenId="system-config"
        data-slot="system-config-screen"
        className="space-y-4"
      >
        <section data-slot="section" data-title={t("config.section.siteParams.title")}>
          <SystemSettingsForm
            formId={SYSTEM_CONFIG_FORM_ID}
            hideSubmitButton={true}
            initialSettings={{
              siteTitle: settings.siteTitle,
              allowGlobalUsageView: settings.allowGlobalUsageView,
              currencyDisplay: settings.currencyDisplay,
              billingModelSource: settings.billingModelSource,
              codexPriorityBillingSource: settings.codexPriorityBillingSource,
              timezone: settings.timezone,
              verboseProviderError: settings.verboseProviderError,
              enableHttp2: settings.enableHttp2,
              interceptAnthropicWarmupRequests: settings.interceptAnthropicWarmupRequests,
              enableThinkingSignatureRectifier: settings.enableThinkingSignatureRectifier,
              enableThinkingBudgetRectifier: settings.enableThinkingBudgetRectifier,
              enableBillingHeaderRectifier: settings.enableBillingHeaderRectifier,
              enableResponseInputRectifier: settings.enableResponseInputRectifier,
              enableCodexSessionIdCompletion: settings.enableCodexSessionIdCompletion,
              enableClaudeMetadataUserIdInjection: settings.enableClaudeMetadataUserIdInjection,
              enableResponseFixer: settings.enableResponseFixer,
              responseFixerConfig: settings.responseFixerConfig,
              quotaDbRefreshIntervalSeconds: settings.quotaDbRefreshIntervalSeconds,
              quotaLeasePercent5h: settings.quotaLeasePercent5h,
              quotaLeasePercentDaily: settings.quotaLeasePercentDaily,
              quotaLeasePercentWeekly: settings.quotaLeasePercentWeekly,
              quotaLeasePercentMonthly: settings.quotaLeasePercentMonthly,
              quotaLeaseCapUsd: settings.quotaLeaseCapUsd,
            }}
          />
        </section>

        <section data-slot="section" data-title={t("config.section.autoCleanup.title")}>
          <AutoCleanupForm settings={settings} />
        </section>
      </ConsoleScreenStage>
    </div>
  );
}
