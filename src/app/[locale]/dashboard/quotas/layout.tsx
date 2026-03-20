import { getTranslations } from "next-intl/server";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/routing";
import { getSession } from "@/lib/auth";
import { TrafficModulePage } from "../_components/traffic-module-page";

export default async function QuotasLayout({ children }: { children: React.ReactNode }) {
  const [t, session] = await Promise.all([getTranslations("quota.layout"), getSession()]);
  const role = session?.user.role === "admin" ? "admin" : "user";

  return (
    <TrafficModulePage
      role={role}
      activeTab="quotas"
      title={t("title")}
      description={t("description")}
    >
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <Link href="/dashboard/quotas/users" data-tab-id="users">
            <TabsTrigger value="users">{t("tabs.users")}</TabsTrigger>
          </Link>
          <Link href="/dashboard/quotas/providers" data-tab-id="providers">
            <TabsTrigger value="providers">{t("tabs.providers")}</TabsTrigger>
          </Link>
        </TabsList>

        {children}
      </Tabs>
    </TrafficModulePage>
  );
}
