"use client";

import { useTranslations } from "next-intl";
import { LogLevelForm } from "@/app/[locale]/settings/logs/_components/log-level-form";
import { ConsoleScreenStage } from "@/components/console-app/console-screen-stage";

export default function SystemLogsScreen() {
  const t = useTranslations("settings");

  return (
    <div data-slot="console-screen" data-screen-id="system-logs">
      <ConsoleScreenStage screenId="system-logs" data-slot="system-logs-screen" className="space-y-4">
        <section data-slot="section" data-title={t("logs.section.title")}>
          <LogLevelForm />
        </section>
      </ConsoleScreenStage>
    </div>
  );
}
