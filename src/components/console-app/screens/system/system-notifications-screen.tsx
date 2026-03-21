"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { GlobalSettingsCard } from "@/app/[locale]/settings/notifications/_components/global-settings-card";
import { NotificationTypeCard } from "@/app/[locale]/settings/notifications/_components/notification-type-card";
import { NotificationsSkeleton } from "@/app/[locale]/settings/notifications/_components/notifications-skeleton";
import { WebhookTargetsSection } from "@/app/[locale]/settings/notifications/_components/webhook-targets-section";
import {
  NOTIFICATION_TYPES,
  type NotificationSettingsState,
  useNotificationsPageData,
} from "@/app/[locale]/settings/notifications/_lib/hooks";
import { ConsoleScreenStage } from "@/components/console-app/console-screen-stage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SystemNotificationsScreen() {
  const t = useTranslations("settings");
  const {
    settings,
    targets,
    bindingsByType,
    isLoading,
    loadError,
    updateSettings,
    saveBindings,
    createTarget,
    updateTarget,
    deleteTarget,
    testTarget,
  } = useNotificationsPageData();

  const handleUpdateSettings = async (patch: Partial<NotificationSettingsState>) => {
    const result = await updateSettings(patch);
    if (!result.ok) {
      toast.error(result.error || t("notifications.form.saveFailed"));
    }
    return result;
  };

  if (isLoading || !settings) {
    return (
      <div data-slot="console-screen" data-screen-id="system-notifications">
        <ConsoleScreenStage
          screenId="system-notifications"
          data-slot="system-notifications-screen"
        >
          <NotificationsSkeleton />
        </ConsoleScreenStage>
      </div>
    );
  }

  return (
    <div data-slot="console-screen" data-screen-id="system-notifications">
      <ConsoleScreenStage
        screenId="system-notifications"
        data-slot="system-notifications-screen"
        className="space-y-6"
      >
        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("notifications.form.loadError")}</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : null}

        <GlobalSettingsCard
          enabled={settings.enabled}
          onEnabledChange={async (enabled) => {
            await handleUpdateSettings({ enabled });
          }}
        />

        <WebhookTargetsSection
          targets={targets}
          onCreate={createTarget}
          onUpdate={updateTarget}
          onDelete={deleteTarget}
          onTest={testTarget}
        />

        <section data-slot="section" data-title={t("notifications.bindings.title")}>
          <div className="grid gap-4 p-5 pt-0 md:p-6">
            {NOTIFICATION_TYPES.map((type) => (
              <NotificationTypeCard
                key={type}
                type={type}
                settings={settings}
                targets={targets}
                bindings={bindingsByType[type]}
                onUpdateSettings={handleUpdateSettings}
                onSaveBindings={saveBindings}
              />
            ))}
          </div>
        </section>
      </ConsoleScreenStage>
    </div>
  );
}
