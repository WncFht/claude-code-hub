import { getTranslations } from "next-intl/server";
import { Section } from "@/components/section";
import { SystemModulePage } from "../_components/system-module-page";
import { LogLevelForm } from "./_components/log-level-form";

export const dynamic = "force-dynamic";

export default async function SettingsLogsPage() {
  const t = await getTranslations("settings");

  return (
    <SystemModulePage role="admin" activeTab="logs">
      <Section
        title={t("logs.section.title")}
        description={t("logs.section.description")}
        icon="file-text"
        variant="default"
      >
        <LogLevelForm />
      </Section>
    </SystemModulePage>
  );
}
