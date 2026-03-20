import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/auth";
import { TrafficModulePage } from "../_components/traffic-module-page";
import { UsersPageClient } from "./users-page-client";

export default async function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getSession();

  // 权限检查：允许所有登录用户访问
  if (!session) {
    return redirect({ href: "/login", locale });
  }

  const t = await getTranslations("dashboard");

  return (
    <TrafficModulePage
      role={session.user.role === "admin" ? "admin" : "user"}
      activeTab="users"
      title={t("title.userAndKeyManagement")}
      description={t("console.traffic.descriptions.users")}
    >
      <UsersPageClient currentUser={session.user} />
    </TrafficModulePage>
  );
}
