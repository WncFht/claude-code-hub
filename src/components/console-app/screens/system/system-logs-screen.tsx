"use client";

import { useTranslations } from "next-intl";
import { LogLevelForm } from "@/app/[locale]/settings/logs/_components/log-level-form";

export default function SystemLogsScreen() {
  const t = useTranslations("settings");

  return (
    <div data-slot="console-screen" data-screen-id="system-logs">
      <div data-slot="system-logs-screen" className="space-y-4">
        <section data-slot="section" data-title={t("logs.section.title")}>
          <LogLevelForm />
        </section>
      </div>
    </div>
  );
}
