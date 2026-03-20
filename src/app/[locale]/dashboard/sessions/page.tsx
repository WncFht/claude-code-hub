import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { TrafficModulePage } from "../_components/traffic-module-page";
import { ActiveSessionsClient } from "./_components/active-sessions-client";

export const dynamic = "force-dynamic";

export default async function ActiveSessionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  // 权限检查：仅 admin 用户可访问
  if (!session || session.user.role !== "admin") {
    return redirect({ href: session ? "/dashboard" : "/login", locale });
  }

  const t = await getTranslations("dashboard");

  return (
    <TrafficModulePage
      role="admin"
      activeTab="sessions"
      title={t("sessions.title")}
      description={t("sessions.description")}
    >
      <ActiveSessionsClient />
    </TrafficModulePage>
  );
}
